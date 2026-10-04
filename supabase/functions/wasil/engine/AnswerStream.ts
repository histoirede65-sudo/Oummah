/** Receives the answer while it is being written, for clients that asked for a stream. */
export type WasilStreamSink = {
  /** New characters of the answer body. */
  delta(text: string): void;
  /** The text sent so far is discarded (structured-output retry). */
  reset(): void;
  /** A pipeline stage the client may show ("web_search", "writing"). */
  stage(name: string): void;
};

/**
 * Extracts the "body" string of the structured answer from the partial JSON
 * the model is producing. The schema writes status, then title, then body, so
 * the body is only forwarded once the status is known to be "answered":
 * refusals are never shown before being replaced by the final message.
 */
export class StructuredBodyExtractor {
  private raw = "";
  private emitted = 0;
  private status: string | null = null;

  push(chunk: string): string {
    this.raw += chunk;
    if (this.status === null) {
      this.status = /"status"\s*:\s*"([a-z_]+)"/.exec(this.raw)?.[1] ?? null;
    }
    if (this.status !== "answered") return "";
    const start = /[{,]\s*"body"\s*:\s*"/.exec(this.raw);
    if (!start) return "";
    const decoded = decodePartialJsonString(this.raw, start.index + start[0].length);
    if (decoded.length <= this.emitted) return "";
    const next = decoded.slice(this.emitted);
    this.emitted = decoded.length;
    return next;
  }
}

/** Decodes a JSON string from `from` up to its closing quote or the last complete character. */
function decodePartialJsonString(raw: string, from: number): string {
  let out = "";
  for (let i = from; i < raw.length; i++) {
    const char = raw[i];
    if (char === '"') break;
    if (char !== "\\") {
      out += char;
      continue;
    }
    const escape = raw[i + 1];
    if (escape === undefined) break;
    if (escape === "u") {
      const hex = raw.slice(i + 2, i + 6);
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) break;
      out += String.fromCharCode(parseInt(hex, 16));
      i += 5;
      continue;
    }
    out += { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" }[escape] ?? escape;
    i += 1;
  }
  return out;
}

/**
 * Reads a /v1/responses server-sent event stream. Text deltas are forwarded as
 * they arrive; the returned object is the same response object the
 * non-streaming endpoint returns, so the existing validation is unchanged.
 */
export async function readOpenAiResponseStream(
  response: Response,
  handlers: { text(delta: string): void; event?(type: string): void },
): Promise<Record<string, unknown>> {
  if (!response.body) throw new Error("OPENAI_STREAM_WITHOUT_BODY");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let finalResponse: Record<string, unknown> | null = null;

  const handleEvent = (block: string) => {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data || data === "[DONE]") return;
    const event = JSON.parse(data) as Record<string, unknown>;
    const type = String(event.type ?? "");
    handlers.event?.(type);
    if (type === "response.output_text.delta" && typeof event.delta === "string") {
      handlers.text(event.delta);
    } else if (
      type === "response.completed" ||
      type === "response.incomplete" ||
      type === "response.failed"
    ) {
      finalResponse = event.response as Record<string, unknown>;
    } else if (type === "error") {
      throw new Error(`OPENAI_STREAM_ERROR: ${JSON.stringify(event).slice(0, 600)}`);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value.replace(/\r\n/g, "\n");
    let separator = buffer.indexOf("\n\n");
    while (separator !== -1) {
      handleEvent(buffer.slice(0, separator));
      buffer = buffer.slice(separator + 2);
      separator = buffer.indexOf("\n\n");
    }
  }
  if (buffer.trim()) handleEvent(buffer);
  if (!finalResponse) throw new Error("OPENAI_STREAM_ENDED_WITHOUT_RESPONSE");
  return finalResponse;
}

/** Wraps a request handler so the answer is sent as server-sent events. */
export function streamWasilResponse(
  corsHeaders: Record<string, string>,
  run: (sink: WasilStreamSink) => Promise<Response>,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // The client went away; the request still completes for billing.
        }
      };
      const sink: WasilStreamSink = {
        delta: (text) => send("delta", { text }),
        reset: () => send("reset", {}),
        stage: (name) => send("stage", { name }),
      };
      try {
        const response = await run(sink);
        const payload = await response.json().catch(() => ({ code: "INVALID_RESPONSE" }));
        send("final", { status: response.status, payload });
      } catch (error) {
        console.error("WASIL_STREAM_FAILURE", error instanceof Error ? error.message : String(error));
        send("final", { status: 500, payload: { code: "STREAM_ERROR" } });
      }
      try {
        controller.close();
      } catch {
        // Already closed by a disconnected client.
      }
    },
  });
  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
