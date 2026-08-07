import { expandIslamicQuery } from "../engine/IslamicQueryExpansion.ts";

const originalFetch = globalThis.fetch;
const originalDeno = (globalThis as typeof globalThis & { Deno?: unknown }).Deno;

function installDenoEnv(apiKey: string | undefined) {
  (globalThis as typeof globalThis & {
    Deno: { env: { get(name: string): string | undefined } };
  }).Deno = {
    env: {
      get(name: string) {
        if (name === "OPENAI_API_KEY") return apiKey;
        if (name === "WASIL_MODEL_STANDARD") return "test-model";
        return undefined;
      },
    },
  };
}

try {
  installDenoEnv("test-key");
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });

  const unseen = await expandIslamicQuery(
    "Que dit l’Islam sur le fait de divulguer les secrets et de trahir une confidence selon le Coran et la Sunna ?",
  );
  if (!unseen) throw new Error("Le fallback générique n'a pas été produit");
  const fallbackText = [
    unseen.canonicalName,
    ...unseen.evidenceTerms,
    ...unseen.quranSearchTerms,
    ...unseen.hadithSearchTerms,
  ].join(" ").toLowerCase();
  if (!fallbackText.includes("secret") || !fallbackText.includes("confidence")) {
    throw new Error(`Fallback générique imprécis: ${fallbackText}`);
  }
  if (!unseen.directEvidenceDescription.toLowerCase().includes("direct")) {
    throw new Error("Le fallback ne définit pas le critère de preuve directe");
  }

  const outOfScope = await expandIslamicQuery("Quel temps fera-t-il demain à Marseille ?");
  if (outOfScope !== null) {
    throw new Error("Une question non religieuse ne doit pas recevoir un profil islamique lexical");
  }

  const marriageFallback = await expandIslamicQuery(
    "Que dit l'Islam sur le consentement et le mariage forcé ?",
  );
  const marriageEvidence = marriageFallback?.evidenceTerms.join(" ").toLowerCase() ?? "";
  if (!marriageEvidence.includes("consentement") || !marriageEvidence.includes("force")) {
    throw new Error(`Le lexique statique a dilué la cible exacte: ${marriageEvidence}`);
  }

  const modelPayload = {
    isIslamicEntity: true,
    entityType: "concept",
    canonicalName: "Consentement matrimonial et absence de contrainte",
    arabicName: "الرضا في النكاح",
    aliases: ["consentement", "mariage forcé"],
    quranSearchTerms: ["consentement mariage", "ne pas contraindre"],
    hadithSearchTerms: ["consentement de la femme", "mariage forcé"],
    evidenceTerms: ["consentement matrimonial", "absence de contrainte"],
    relatedTerms: ["mariage"],
    directEvidenceDescription: "Preuves exigeant le consentement matrimonial et refusant la contrainte.",
  };
  globalThis.fetch = async () => new Response(JSON.stringify({
    output_text: JSON.stringify(modelPayload),
  }), { status: 200, headers: { "Content-Type": "application/json" } });

  const precise = await expandIslamicQuery(
    "Que dit l’Islam sur le mariage forcé et le consentement ?",
  );
  if (precise?.canonicalName !== modelPayload.canonicalName) {
    throw new Error(
      `Le lexique statique a écrasé l'intention sémantique: ${precise?.canonicalName}`,
    );
  }

  console.log("query_expansion_fallback_and_authority_test: OK");
} finally {
  globalThis.fetch = originalFetch;
  if (originalDeno === undefined) {
    delete (globalThis as typeof globalThis & { Deno?: unknown }).Deno;
  } else {
    (globalThis as typeof globalThis & { Deno?: unknown }).Deno = originalDeno;
  }
}
