export type DocumentaryCandidate = {
  id: string;
  kind: "quran" | "hadith";
  reference: string;
  text: string;
};

export type DocumentaryVerificationSelection = {
  id: string;
  relevance: number;
  directness: number;
  reason: string;
};

type VerificationResponse = {
  selected?: Array<{
    id?: string;
    relevance?: number;
    directness?: number;
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

function isVerifierEnabled(): boolean {
  return Deno.env.get("WASIL_SEMANTIC_VERIFIER") !== "false";
}

/**
 * Semantic second-stage selector.
 *
 * It never writes the final response and cannot invent references because it
 * may only return candidate ids supplied by the repositories. Failures are
 * fail-open: the caller keeps the deterministic lexical ranking.
 */
export async function verifyDocumentaryRelevance(
  question: string,
  candidates: DocumentaryCandidate[],
  options: {
    directEvidenceDescription?: string;
    minimumRelevance?: number;
    minimumDirectness?: number;
    maximumQuranItems?: number;
    maximumHadithItems?: number;
    requireQuran?: boolean;
    requireHadith?: boolean;
  } = {},
): Promise<DocumentaryVerificationSelection[] | null> {
  if (!candidates.length) return [];
  if (!isVerifierEnabled()) return null;

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  const minimumRelevance = options.minimumRelevance ?? 0.72;
  const minimumDirectness = options.minimumDirectness ?? 0.68;
  const maximumQuranItems = options.maximumQuranItems ?? 4;
  const maximumHadithItems = options.maximumHadithItems ?? 4;
  const maximumItems = maximumQuranItems + maximumHadithItems;
  const model = Deno.env.get("WASIL_MODEL_RETRIEVAL") ??
    Deno.env.get("WASIL_MODEL_STANDARD") ?? "gpt-5.6-luna";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1_800);

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
        max_output_tokens: 900,
        instructions:
          "Tu es le vérificateur documentaire de Wasil. Tu ne réponds jamais à l'utilisateur. " +
          "Tu compares chaque candidat à l'intention exacte, pas à de simples mots communs. " +
          "directness mesure si le texte lui-même établit directement la règle, le conseil, le vice, la vertu ou la situation demandée. " +
          "Un récit historique, une biographie, une sourate générale, un thème opposé ou une notion voisine ne doit pas remplacer une preuve normative plus directe. " +
          "Pour le Coran, garde les versets directement utiles et préfère un verset précis à une plage qui le contient. " +
          "Pour les hadiths, garde uniquement les textes dont le contenu précis traite réellement du sujet. " +
          "Lorsque les deux corpus sont demandés, sélectionne séparément les meilleures preuves disponibles dans chacun. " +
          "Tu ne peux retourner que les identifiants fournis. N'invente aucune référence. Retourne uniquement le JSON demandé.",
        input: JSON.stringify({
          question,
          directEvidenceDescription: options.directEvidenceDescription ??
            "Une preuve directement applicable à la question, et non une simple association thématique.",
          corpusRequirements: {
            quran: Boolean(options.requireQuran),
            hadith: Boolean(options.requireHadith),
          },
          candidates: candidates.map((candidate) => ({
            id: candidate.id,
            kind: candidate.kind,
            reference: candidate.reference,
            text: candidate.text.slice(0, 1500),
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
                      directness: { type: "number", minimum: 0, maximum: 1 },
                      reason: { type: "string" },
                    },
                    required: ["id", "relevance", "directness", "reason"],
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
    const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));

    const valid = (parsed.selected ?? [])
      .filter((entry): entry is {
        id: string;
        relevance: number;
        directness: number;
        reason: string;
      } =>
        Boolean(entry.id) &&
        candidateById.has(entry.id!) &&
        typeof entry.relevance === "number" &&
        typeof entry.directness === "number" &&
        entry.relevance >= minimumRelevance &&
        entry.directness >= minimumDirectness
      )
      .sort((a, b) => {
        const directnessDelta = b.directness - a.directness;
        return directnessDelta !== 0 ? directnessDelta : b.relevance - a.relevance;
      });

    const quran = valid
      .filter((entry) => candidateById.get(entry.id)?.kind === "quran")
      .slice(0, maximumQuranItems);
    const hadith = valid
      .filter((entry) => candidateById.get(entry.id)?.kind === "hadith")
      .slice(0, maximumHadithItems);

    return [...quran, ...hadith];
  } catch (error) {
    console.warn("WASIL_DOCUMENTARY_VERIFIER_FAILURE", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
