import { verifyDocumentaryRelevance } from "../engine/DocumentaryRelevanceVerifier.ts";

const originalFetch = globalThis.fetch;
(globalThis as unknown as { Deno: unknown }).Deno = {
  env: {
    get(name: string) {
      if (name === "OPENAI_API_KEY") return "test-key";
      if (name === "WASIL_MODEL_RETRIEVAL") return "test-model";
      return undefined;
    },
  },
};

globalThis.fetch = async () =>
  new Response(JSON.stringify({
    output_text: JSON.stringify({
      selected: [
        { id: "q-direct", relevance: 0.96, directness: 0.94, reason: "direct" },
        { id: "h-direct", relevance: 0.93, directness: 0.91, reason: "direct" },
        { id: "q-low", relevance: 0.9, directness: 0.2, reason: "indirect" },
        { id: "invented", relevance: 1, directness: 1, reason: "hallucinated" },
      ],
    }),
  }), { status: 200, headers: { "Content-Type": "application/json" } });

try {
  const result = await verifyDocumentaryRelevance(
    "Question de test",
    [
      { id: "q-direct", kind: "quran", reference: "Coran 1:1", text: "preuve directe" },
      { id: "h-direct", kind: "hadith", reference: "Sahih", text: "preuve directe" },
      { id: "q-low", kind: "quran", reference: "Coran 2:1-20", text: "récit indirect" },
    ],
    { requireQuran: true, requireHadith: true },
  );
  const ids = result?.map((entry) => entry.id) ?? [];
  if (ids.join(",") !== "q-direct,h-direct") {
    throw new Error(`Sélection invalide: ${ids.join(",")}`);
  }
} finally {
  globalThis.fetch = originalFetch;
}

console.log("documentary_verifier_contract_test: OK");
