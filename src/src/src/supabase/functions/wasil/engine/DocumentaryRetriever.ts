export type DocumentaryReference = {
  title: string;
  url: string;
};

export type DocumentaryDossier = {
  sourceId: string;
  canonicalName: string;
  entityType: string;
  summary: string;
  establishedFacts: string[];
  cautions: string[];
  references: DocumentaryReference[];
};

export type WasilWebBudget = {
  initial: number;
  remaining: number;
  used: number;
  hadithCalls: number;
  documentaryCalls: number;
  finalCalls: number;
};

export function consumeWasilWebBudget(
  budget: WasilWebBudget,
  kind: "hadith" | "documentary" | "final",
): boolean {
  if (budget.remaining <= 0) return false;
  budget.remaining -= 1;
  budget.used += 1;
  if (kind === "hadith") budget.hadithCalls += 1;
  if (kind === "documentary") budget.documentaryCalls += 1;
  if (kind === "final") budget.finalCalls += 1;
  return true;
}

type ExpansionLike = {
  isIslamicEntity: boolean;
  entityType: string;
  canonicalName: string;
  arabicName?: string;
  aliases?: string[];
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    action?: {
      sources?: Array<{ title?: string; url?: string }>;
    };
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.pathname = url.pathname.replace(/\/$/, "") || "/";
    return url.toString();
  } catch {
    return "";
  }
}

function outputText(payload: OpenAIResponse) {
  if (payload.output_text?.trim()) return payload.output_text.trim();
  for (const item of payload.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text?.trim()) return part.text.trim();
    }
  }
  return "";
}

function consultedSources(payload: OpenAIResponse): DocumentaryReference[] {
  const result = new Map<string, DocumentaryReference>();
  for (const item of payload.output ?? []) {
    if (item.type !== "web_search_call") continue;
    for (const raw of item.action?.sources ?? []) {
      if (!raw.url) continue;
      const url = normalizeUrl(raw.url);
      if (!url) continue;
      const host = new URL(url).hostname.replace(/^www\./, "");
      if (host === "quran.com" || host === "quranenc.com" || host.endsWith(".quran.com") || host.endsWith(".quranenc.com")) continue;
      result.set(url, {
        title: raw.title?.trim() || host,
        url,
      });
    }
  }
  return [...result.values()].slice(0, 6);
}

function slug(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "entity";
}

export function needsDocumentaryRetrieval(
  expansion: ExpansionLike | null,
  hasInternalQuranTopic: boolean,
) {
  if (!expansion?.isIslamicEntity) return false;
  if (expansion.entityType === "concept" || expansion.entityType === "place" || expansion.entityType === "event") return false;
  if (expansion.entityType === "prophet" && hasInternalQuranTopic) return false;
  if (expansion.entityType === "quranic_person" && hasInternalQuranTopic) return false;
  return true;
}

export async function retrieveDocumentaryKnowledge(
  question: string,
  expansion: ExpansionLike,
  budget?: WasilWebBudget,
): Promise<DocumentaryDossier | null> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;
  if (budget && !consumeWasilWebBudget(budget, "documentary")) {
    console.log("WASIL_WEB_BUDGET_EXHAUSTED", { kind: "documentary" });
    return null;
  }

  const model = Deno.env.get("WASIL_MODEL_STANDARD") ?? "gpt-5.6-luna";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

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
        max_tool_calls: 1,
        tools: [{ type: "web_search" }],
        tool_choice: "required",
        include: ["web_search_call.action.sources"],
        instructions:
          "Tu es le moteur documentaire de Wasil. Tu ne rédiges pas la réponse finale. Recherche l'entité islamique déjà résolue, recoupe plusieurs pages sérieuses et produis un dossier factuel compact. Ne demande jamais de clarification. Ne transforme pas une absence de fiche locale en absence de connaissance. Garde uniquement les faits largement établis. Écarte les récits faibles, sensationnalistes ou non vérifiables. Pour les compagnons et figures historiques, privilégie les hadiths authentiques, les institutions reconnues, les ouvrages ou encyclopédies de référence. Produis uniquement le JSON demandé.",
        input: `QUESTION: ${question}\nENTITÉ: ${expansion.canonicalName}\nTYPE: ${expansion.entityType}\nARABE: ${expansion.arabicName || "non fourni"}\nALIAS: ${(expansion.aliases ?? []).join(", ") || "aucun"}`,
        text: {
          format: {
            type: "json_schema",
            name: "wasil_documentary_dossier",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                establishedFacts: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 10,
                },
                cautions: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 4,
                },
              },
              required: ["summary", "establishedFacts", "cautions"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      console.warn("WASIL_DOCUMENTARY_RETRIEVAL_HTTP_FAILURE", response.status, (await response.text()).slice(0, 600));
      return null;
    }

    const payload = await response.json() as OpenAIResponse;
    const references = consultedSources(payload);
    const parsed = JSON.parse(outputText(payload)) as {
      summary: string;
      establishedFacts: string[];
      cautions: string[];
    };

    if (!parsed.summary?.trim() || !Array.isArray(parsed.establishedFacts) || parsed.establishedFacts.length < 2 || references.length === 0) {
      console.warn("WASIL_DOCUMENTARY_RETRIEVAL_EMPTY", {
        entity: expansion.canonicalName,
        factCount: parsed.establishedFacts?.length ?? 0,
        referenceCount: references.length,
      });
      return null;
    }

    return {
      sourceId: `documentary:${slug(expansion.canonicalName)}`,
      canonicalName: expansion.canonicalName,
      entityType: expansion.entityType,
      summary: parsed.summary.trim(),
      establishedFacts: parsed.establishedFacts.map((item) => item.trim()).filter(Boolean),
      cautions: (parsed.cautions ?? []).map((item) => item.trim()).filter(Boolean),
      references,
    };
  } catch (error) {
    console.warn("WASIL_DOCUMENTARY_RETRIEVAL_FAILURE", {
      entity: expansion.canonicalName,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
