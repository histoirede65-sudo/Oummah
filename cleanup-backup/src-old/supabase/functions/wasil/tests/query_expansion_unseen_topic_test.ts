const originalFetch = globalThis.fetch;
(globalThis as unknown as { Deno: unknown }).Deno = {
  env: {
    get(name: string) {
      if (name === "OPENAI_API_KEY") return "test-key";
      if (name === "WASIL_MODEL_STANDARD") return "test-model";
      return undefined;
    },
  },
};

globalThis.fetch = async () =>
  new Response(JSON.stringify({
    output_text: JSON.stringify({
      isIslamicEntity: true,
      entityType: "concept",
      canonicalName: "Préserver les confidences et les secrets",
      arabicName: "حفظ السر",
      aliases: ["secret", "confidence", "discrétion"],
      quranSearchTerms: ["secret", "confidence", "trahir les dépôts"],
      hadithSearchTerms: ["divulguer un secret", "confidence", "assemblées dépôt"],
      evidenceTerms: ["divulguer une confidence", "préserver un secret", "trahir un secret"],
      relatedTerms: ["amana", "discrétion"],
      directEvidenceDescription: "Une preuve qui interdit de divulguer une confidence ou ordonne de préserver un secret confié.",
    }),
  }), { status: 200, headers: { "Content-Type": "application/json" } });

try {
  const { expandIslamicQuery } = await import("../engine/IslamicQueryExpansion.ts");
  const result = await expandIslamicQuery(
    "Que dit l'Islam sur le fait de divulguer une confidence ?",
  );
  if (!result) throw new Error("Aucune expansion retournée");
  if (!result.evidenceTerms.includes("divulguer une confidence")) {
    throw new Error(`Cible exacte absente: ${result.evidenceTerms.join(",")}`);
  }
  if (result.hadithSearchTerms.length < 2 || result.quranSearchTerms.length < 2) {
    throw new Error("Les corpus n'ont pas reçu de termes distincts");
  }
  if (!result.directEvidenceDescription.includes("divulguer")) {
    throw new Error("La description de preuve directe est trop vague");
  }
} finally {
  globalThis.fetch = originalFetch;
}

console.log("query_expansion_unseen_topic_test: OK");

export {};
