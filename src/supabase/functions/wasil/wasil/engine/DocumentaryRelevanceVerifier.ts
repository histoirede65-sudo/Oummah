export type DocumentaryCandidate = {
  id: string;
  kind: "quran" | "hadith";
  reference: string;
  text: string;
};

type VerificationResponse = {
  selected?: Array<{
    id?: string;
    relevance?: number;
    reason?: string;
  }>;
};

function readOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const value = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (value.output_text?.trim()) return value.output_text.trim();
  for (const item of value.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text?.trim()) return part.text.trim();
    }
  }
  return "";
}

/**
 * Small, fail-open semantic verification step.
 * It only selects documentary candidates; it never writes the final answer.
 */
export async function verifyDocumentaryRelevance(
  question: string,
  candidates: DocumentaryCandidate[],
  options: { minimumRelevance?: number; maximumItems?: number } = {},
): Promise<Array<{ id: string; relevance: number; reason: string }> | null> {
  if (!candidates.length) return [];

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  const minimumRelevance = options.minimumRelevance ?? 0.72;
  const maximumItems = options.maximumItems ?? 6;
  const model = Deno.env.get("WASIL_MODEL_STANDARD") ?? "gpt-5.6-luna";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9_000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 700,
        instructions:
          "Tu es le vérificateur documentaire de Wasil. Tu ne réponds jamais à l'utilisateur. " +
          "Tu évalues si chaque passage répond réellement à la question précise. " +
          "Une simple proximité de vocabulaire, un thème secondaire ou une analogie éloignée ne suffit pas. " +
          "Pour le Coran, garde seulement les versets directement utiles comme preuve ou conseil pour la question. " +
          "Pour les hadiths, garde seulement ceux dont le contenu précis traite directement du sujet. " +
          "N'invente aucune référence. Retourne uniquement le JSON demandé.",
        input: JSON.stringify({
          question,
          candidates: candidates.map((candidate) => ({
            id: candidate.id,
            kind: candidate.kind,
            reference: candidate.reference,
            text: candidate.text.slice(0, 1200),
          })),
        }),
        text: {
          format: {
            type: "json_schema",
            name: "wasil_documentary_relevance",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                selected: {
                  type: "array",
                  maxItems: maximumItems,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      id: { type: "string" },
                      relevance: { type: "number", minimum: 0, maximum: 1 },
                      reason: { type: "string" },
                    },
                    required: ["id", "relevance", "reason"],
                  },
                },
              },
              required: ["selected"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      console.warn("WASIL_DOCUMENTARY_VERIFIER_HTTP_FAILURE", response.status);
      return null;
    }

    const payload = await response.json();
    const text = readOutputText(payload);
    if (!text) return null;
    const parsed = JSON.parse(text) as VerificationResponse;
    const allowedIds = new Set(candidates.map((candidate) => candidate.id));
    return (parsed.selected ?? [])
      .filter((entry): entry is { id: string; relevance: number; reason: string } =>
        Boolean(entry.id) &&
        allowedIds.has(entry.id!) &&
        typeof entry.relevance === "number" &&
        entry.relevance >= minimumRelevance
      )
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maximumItems);
  } catch (error) {
    console.warn("WASIL_DOCUMENTARY_VERIFIER_FAILURE", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
