import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../index.ts", import.meta.url), "utf8");
for (const expected of [
  "resolveDeterministicQuranFact",
  "WASIL_QURAN_FACT_FAST_PATH",
  "local-deterministic",
  "QURAN_SURAH_METADATA",
  "semanticExpansionMs = 0",
  "openAiMs = 0",
]) {
  if (!source.includes(expected)) throw new Error(`Missing fast-path contract: ${expected}`);
}
if (!source.includes('[10, "Yûnus", 109')) throw new Error("Yûnus metadata missing");
if (!source.includes('[19, "Maryam", 98')) throw new Error("Maryam metadata missing");
if (!source.includes('[3, "Âl \'Imrân", 200')) throw new Error("Âl 'Imrân metadata missing");
console.log("quran_fact_fast_path_contract_test: OK");
