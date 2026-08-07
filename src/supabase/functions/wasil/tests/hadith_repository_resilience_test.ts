import type { IslamicQueryExpansion } from "../engine/IslamicQueryExpansion.ts";

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

const requestedUrls: string[] = [];
globalThis.fetch = async (input) => {
  const url = String(input);
  requestedUrls.push(url);
  if (url.includes("hadeethenc.com/api/v1/hadeeths/search/")) {
    return new Response(JSON.stringify({
      data: [{ id: "900001", title: "La confidence est un dépôt" }],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (url.includes("hadeethenc.com/api/v1/hadeeths/one/")) {
    return new Response(JSON.stringify({
      id: "900001",
      hadeeth: "Lorsqu'un homme confie une parole puis se détourne, cette parole est un dépôt à préserver.",
      attribution: "Rapporté dans une collection de hadiths",
      grade: "Bon",
      explanation: "Le texte traite directement de la préservation d'une confidence.",
      reference: "Référence de test",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (url.includes("api.openai.com/v1/responses")) {
    // The supplemental fallback fails: the direct HadeethEnc result must still
    // survive instead of being discarded.
    return new Response("fallback unavailable", { status: 503 });
  }
  return new Response("not found", { status: 404 });
};

const expansion: IslamicQueryExpansion = {
  isIslamicEntity: true,
  entityType: "concept",
  canonicalName: "Préserver les confidences",
  arabicName: "حفظ السر",
  aliases: ["secret", "confidence"],
  quranSearchTerms: ["secret", "dépôt"],
  hadithSearchTerms: ["confidence", "secret confié"],
  evidenceTerms: ["confidence", "préserver un secret"],
  relatedTerms: ["dépôt", "discrétion"],
  directEvidenceDescription: "Une preuve qui ordonne de préserver une confidence.",
};

try {
  const { searchHadithRepository, getHadithRepositoryDebug } = await import(
    "../engine/repositories/HadithRepository.ts"
  );
  const question = "Comment préserver une confidence selon la Sunna ? test-unique-900001";
  const result = await searchHadithRepository(question, {
    force: true,
    expansion,
  });
  if (!result || result.items.length === 0) {
    throw new Error("Le résultat HadeethEnc a été perdu après l'échec du fallback");
  }
  const item = result.items[0];
  if (item.id !== "900001" || !item.sourceUrl?.includes("900001")) {
    throw new Error(`Hadith direct invalide: ${JSON.stringify(item)}`);
  }
  const debug = getHadithRepositoryDebug(question);
  if (!debug.expressionsExecuted.includes("confidence")) {
    throw new Error(`L'expansion Hadith n'a pas été utilisée: ${debug.expressionsExecuted}`);
  }
  if (!requestedUrls.some((url) => url.includes("api.openai.com"))) {
    throw new Error("Le scénario de fallback n'a pas été exercé");
  }
} finally {
  globalThis.fetch = originalFetch;
}

console.log("hadith_repository_resilience_test: OK");
