import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const index = readFileSync(join(root, "index.ts"), "utf8");
const hadith = readFileSync(join(root, "engine/repositories/HadithRepository.ts"), "utf8");
const universalIntent = readFileSync(join(root, "engine/UniversalIntent.ts"), "utf8");
const relevance = readFileSync(join(root, "engine/RelevanceScorer.ts"), "utf8");
const expansion = readFileSync(join(root, "engine/IslamicQueryExpansion.ts"), "utf8");

const forbidden = [
  "prioritizeDirectPromiseEvidence",
  "prioritizeDirectAngerEvidence",
  "prioritizeDirectEnvyEvidence",
  "knownHadeethEncSeeds",
  "DIRECT_ANGER_HADITH_IDS",
  "DIRECT_ENVY_HADITH_IDS",
  "PROMISE_QURAN_REFERENCE_KEYS",
  "ENVY_QURAN_REFERENCE_KEYS",
];
for (const token of forbidden) {
  if (index.includes(token) || hadith.includes(token)) {
    throw new Error(`Rustine thématique encore présente: ${token}`);
  }
}

const required = [
  "verifyDocumentaryRelevance(",
  "buildDocumentaryCandidates(",
  "applyDocumentaryVerification(",
  "ensureRequestedCorpusCoverage(",
  "expansion: queryExpansion",
];
for (const token of required) {
  if (!index.includes(token)) throw new Error(`Étape universelle absente: ${token}`);
}

if (!hadith.includes('allowed_domains: ["hadeethenc.com", "sunnah.com"]')) {
  throw new Error("Le fallback Hadith n'est pas limité aux domaines approuvés");
}
if (index.includes("const directQuranTopic") || index.includes("directQuranTopic\n      ? null")) {
  throw new Error("L'expansion sémantique reste conditionnée par l'échec du Coran");
}
if (universalIntent.includes("const CONCEPTS") || universalIntent.includes("DIRECT_")) {
  throw new Error("UniversalIntent contient encore un catalogue thématique de production");
}
if (/Coran\s+\d{1,3}:\d{1,3}|browse\/hadith\/\d+/u.test(relevance)) {
  throw new Error("Le scorer universel contient encore une référence religieuse forcée");
}
if (!expansion.includes("if (modelExpansion) return modelExpansion")) {
  throw new Error("L'expansion sémantique n'est pas prioritaire sur les fallbacks");
}
if (!hadith.includes("Input order already comes from the relevance ranker")) {
  throw new Error("Les hadiths ne garantissent pas l'ordre du score de pertinence");
}

console.log("architecture_invariants_test: OK");
