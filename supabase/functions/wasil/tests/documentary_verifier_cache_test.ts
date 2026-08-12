import { verifyDocumentaryRelevance } from "../engine/DocumentaryRelevanceVerifier.ts";

const originalFetch = globalThis.fetch;
let fetchCallCount = 0;

(globalThis as unknown as { Deno: unknown }).Deno = {
  env: {
    get(name: string) {
      if (name === "OPENAI_API_KEY") return "test-key";
      if (name === "WASIL_MODEL_RETRIEVAL") return "test-model";
      return undefined;
    },
  },
};

globalThis.fetch = async () => {
  fetchCallCount += 1;
  return new Response(JSON.stringify({
    output_text: JSON.stringify({
      selected: [{
        id: "h-direct",
        relevance: 0.95,
        directness: 0.94,
        reason: "direct",
      }],
    }),
  }), { status: 200, headers: { "Content-Type": "application/json" } });
};

try {
  const candidates = [{
    id: "h-direct",
    kind: "hadith" as const,
    reference: "Sahih",
    text: "Direct evidence",
  }];
  const options = { requireHadith: true };
  const first = await verifyDocumentaryRelevance("Cache contract question", candidates, options);
  const second = await verifyDocumentaryRelevance("Cache contract question", candidates, options);

  if (first?.[0]?.id !== "h-direct" || second?.[0]?.id !== "h-direct") {
    throw new Error("Cached verification changed the documentary selection");
  }
  if (fetchCallCount !== 1) {
    throw new Error(`Expected one model call, received ${fetchCallCount}`);
  }
} finally {
  globalThis.fetch = originalFetch;
}

console.log("documentary_verifier_cache_test: OK");
