import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const index = readFileSync(join(root, "index.ts"), "utf8");
const expansion = readFileSync(join(root, "engine/IslamicQueryExpansion.ts"), "utf8");
const verifier = readFileSync(join(root, "engine/DocumentaryRelevanceVerifier.ts"), "utf8");
const hadith = readFileSync(join(root, "engine/repositories/HadithRepository.ts"), "utf8");

if (!index.includes("await Promise.all([") || !index.includes("repositoryRetrievalMs")) {
  throw new Error("Les corpus Coran/Hadith ne sont pas récupérés en parallèle ou ne sont pas mesurés");
}
if (!expansion.includes("controller.abort(), 2500")) {
  throw new Error("Le budget de l'expansion sémantique dépasse le contrat de 2,5 s");
}
if (!verifier.includes("controller.abort(), 4_500")) {
  throw new Error("Le budget du vérificateur sémantique dépasse le contrat de 4,5 s");
}
if (!hadith.includes("controller.abort(), 6_500")) {
  throw new Error("Le supplément documentaire Hadith dépasse le contrat de 6,5 s");
}
if (!hadith.includes(".slice(0, 18);")) {
  throw new Error("Le nombre de détails HadeethEnc n'est pas borné à 18 candidats");
}
for (const metric of ["semanticExpansionMs", "repositoryRetrievalMs", "semanticVerifierMs", "totalMs"]) {
  if (!index.includes(metric)) throw new Error(`Mesure de latence absente: ${metric}`);
}

console.log("latency_budget_contract_test: OK");
