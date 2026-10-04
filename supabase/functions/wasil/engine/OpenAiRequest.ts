export type ReasoningEffort = "minimal" | "low" | "medium" | "high";

const EFFORTS = new Set<ReasoningEffort>(["minimal", "low", "medium", "high"]);

// Set once the provider rejects the reasoning parameter for this worker, so
// later calls do not pay a second round trip.
let reasoningRejected = false;

/** Reads an effort from the environment; "default" or empty keeps the model default. */
export function reasoningEffortFromEnv(
  name: string,
  fallback: ReasoningEffort | null,
): ReasoningEffort | null {
  const raw = Deno.env.get(name)?.trim().toLowerCase();
  if (raw === "default" || raw === "") return null;
  if (raw && EFFORTS.has(raw as ReasoningEffort)) return raw as ReasoningEffort;
  return fallback;
}

/**
 * POST /v1/responses with an optional reasoning effort. A lower effort is the
 * main latency lever on reasoning models; when the model does not accept the
 * parameter, the same request is replayed without it.
 */
export async function postOpenAiResponses(
  body: Record<string, unknown>,
  options: { apiKey: string; effort: ReasoningEffort | null; signal?: AbortSignal },
): Promise<Response> {
  const send = (payload: Record<string, unknown>) =>
    fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: options.signal,
      body: JSON.stringify(payload),
    });

  if (!options.effort || reasoningRejected) return await send(body);

  const response = await send({ ...body, reasoning: { effort: options.effort } });
  if (response.status !== 400) return response;
  const errorText = await response.text();
  if (!/reasoning/i.test(errorText)) {
    return new Response(errorText, { status: 400, headers: response.headers });
  }
  reasoningRejected = true;
  console.warn("WASIL_REASONING_EFFORT_REJECTED", errorText.slice(0, 300));
  return await send(body);
}
