import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { FIQH_HADITH_MAPPINGS_WITH_VERIFIED_IDENTITIES } from "../../src/features/fiqh/fiqhHadithMappings";
import { sourceById } from "../../src/features/fiqh/fiqhSources";

type RecordItem = { sourceHadithId: string; sourceCollections?: string[]; narrator?: string | null; title?: string | null; sourceReference?: string | null; documentHash?: string | null; grade?: string | null; hadeeth?: string | null; explanation?: string | null };
type Payload = { records: RecordItem[] };
type Confidence = "strong_candidate" | "review_candidate";
const GENERIC = new Set(["allah", "prophete", "messager", "priere", "ablutions", "jeune", "ramadan", "hajj", "zakat", "muslim", "bukhari", "authentique", "recit", "hadith"]);
const STRONG_THRESHOLD = 0.9;
const REVIEW_THRESHOLD = 0.65;

function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function collectionKey(value: string): string | null {
  const key = normalize(value).replace(/[^a-z]/g, "");
  if (key.includes("bukhari")) return "bukhari";
  if (key.includes("muslim")) return "muslim";
  if (key.includes("abudawud") || key.includes("dawud")) return "abu-dawud";
  if (key.includes("tirmidhi")) return "tirmidhi";
  if (key.includes("nasai")) return "nasai";
  if (key.includes("ibnmajah") || key.includes("majah")) return "ibn-majah";
  return null;
}
function numberAppears(number: string, record: RecordItem) { return new RegExp(`(?:^|\\D)${number.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(?:$|\\D)`).test(record.sourceReference ?? ""); }
function tokensFor(sourceId: string) { return [sourceById.get(sourceId)?.scope, sourceById.get(sourceId)?.reference, sourceId].filter(Boolean).join(" ").split(/[^\p{L}\p{N}]+/u).map(normalize).filter((token) => token.length >= 5 && !GENERIC.has(token)); }
function makeCandidate(mapping: (typeof FIQH_HADITH_MAPPINGS_WITH_VERIFIED_IDENTITIES)[number], record: RecordItem) {
  const expected = collectionKey(mapping.collection); const actual = (record.sourceCollections ?? []).map(collectionKey).filter(Boolean);
  if (!expected || !actual.includes(expected)) return null;
  const referenceMatch = numberAppears(mapping.hadithNumber, record);
  const searchable = normalize([record.title, record.hadeeth, record.explanation].filter(Boolean).join(" "));
  const matched = tokensFor(mapping.sourceId).filter((token) => searchable.includes(token));
  const distinctiveMatch = matched.length >= 3;
  if (!referenceMatch && !distinctiveMatch) return null;
  const score = { collectionMatch: 0.55, referenceMatch: referenceMatch ? 0.35 : 0, narratorMatch: 0, contentMatch: Math.min(0.15, matched.length * 0.05), genericTermsPenalty: 0 };
  const warnings = [
    ...(!referenceMatch ? ["aucune reference numerique canonique presente"] : []),
    ...(!record.sourceReference ? ["sourceReference absente"] : []),
    ...(!record.documentHash ? ["hash documentaire absent"] : []),
  ];
  const finalScore = score.collectionMatch + score.referenceMatch + score.contentMatch;
  if ((!referenceMatch && finalScore < REVIEW_THRESHOLD) || (referenceMatch && finalScore < STRONG_THRESHOLD)) return null;
  return { hadeethEncId: record.sourceHadithId, sourceCollections: record.sourceCollections ?? [], narrator: record.narrator ?? null, title: record.title ?? null, sourceReference: record.sourceReference ?? null, documentHash: record.documentHash ?? null, confidence: referenceMatch ? "strong_candidate" as Confidence : "review_candidate" as Confidence, score: { ...score, finalScore }, reasons: ["collection concordante", ...(referenceMatch ? ["reference numerique explicite dans sourceReference"] : ["formulation distinctive partageant au moins trois termes non generiques"]), ...(matched.length ? [`termes non generiques: ${matched.join(", ")}`] : [])], warnings };
}
async function main() {
  const payload = JSON.parse(await readFile(resolve("scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json"), "utf8")) as Payload;
  const rows = FIQH_HADITH_MAPPINGS_WITH_VERIFIED_IDENTITIES.map((mapping) => mapping.status === "verified"
    ? { sourceId: mapping.sourceId, currentStatus: "already_verified", candidates: [] }
    : { sourceId: mapping.sourceId, expectedCollection: mapping.collection, expectedReference: mapping.canonicalReference ?? mapping.hadithNumber, currentStatus: mapping.status, candidates: payload.records.map((record) => makeCandidate(mapping, record)).filter(Boolean).sort((a, b) => (b?.score.finalScore ?? 0) - (a?.score.finalScore ?? 0)).slice(0, 3) });
  const summary = { generatedAt: new Date().toISOString(), sourcePayload: "scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json", policy: "candidates_only_no_automatic_mapping", thresholds: { strong: STRONG_THRESHOLD, review: REVIEW_THRESHOLD }, totalFiqhHadiths: rows.length, alreadyVerified: rows.filter((row) => row.currentStatus === "already_verified").length, strongCandidates: rows.reduce((n, row) => n + row.candidates.filter((c) => c?.confidence === "strong_candidate").length, 0), reviewCandidates: rows.reduce((n, row) => n + row.candidates.filter((c) => c?.confidence === "review_candidate").length, 0), noReliableCandidate: rows.filter((row) => row.currentStatus !== "already_verified" && row.candidates.length === 0).length, totalCandidateRows: rows.reduce((n, row) => n + row.candidates.length, 0), referencesWithCandidates: rows.filter((row) => row.candidates.length > 0).map((row) => row.sourceId), rows };
  const report = resolve("scripts/hadith/reports/fiqh-hadeethenc-candidates.json"); await mkdir(resolve("scripts/hadith/reports"), { recursive: true }); await writeFile(report, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`TOTAL FIQH HADITHS: ${summary.totalFiqhHadiths}`); console.log(`ALREADY VERIFIED: ${summary.alreadyVerified}`); console.log(`STRONG CANDIDATES: ${summary.strongCandidates}`); console.log(`REVIEW CANDIDATES: ${summary.reviewCandidates}`); console.log(`NO RELIABLE CANDIDATE: ${summary.noReliableCandidate}`); console.log(`TOTAL CANDIDATE ROWS: ${summary.totalCandidateRows}`); console.log(`REPORT: ${report}`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
