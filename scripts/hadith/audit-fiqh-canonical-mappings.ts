import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { FIQH_HADITH_MAPPINGS_WITH_VERIFIED_IDENTITIES } from "../../src/features/fiqh/fiqhHadithMappings";

type CanonicalHadith = { collection?: string; hadithNumber?: string; bookNumber?: string; chapterId?: string; hadith?: Array<{ lang?: string; chapterNumber?: string; chapterTitle?: string; body?: string; urn?: number }> };
type HadeethRecord = { sourceHadithId: string; sourceCollections?: string[]; narrator?: string | null; title?: string | null; sourceReference?: string | null; documentHash?: string | null; hadeethAr?: string | null };
type Payload = { records: HadeethRecord[] };
type ResultStatus = "already_verified" | "canonical_not_found" | "hadeethenc_not_found" | "possible_parallel_narration" | "strong_identity_candidate" | "exact_or_near_exact_identity_candidate";

function arg(name: string) { const prefix = `--${name}=`; return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null; }
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
function collectionKey(value: string) { const key = normalize(value).replace(/ /g, ""); if (key.includes("bukhari")) return "bukhari"; if (key.includes("muslim")) return "muslim"; if (key.includes("abudawud") || key.includes("dawud")) return "abudawud"; if (key.includes("tirmidhi")) return "tirmidhi"; if (key.includes("nasai")) return "nasai"; if (key.includes("ibnmajah") || key.includes("majah")) return "ibnmajah"; return key; }
function parseSourceId(sourceId: string) { const match = /^(.*?)-([0-9]+[a-z]*)$/i.exec(sourceId); return match ? { collection: collectionKey(match[1]), reference: match[2].toLowerCase() } : null; }
function arabicTokens(value: string) { return new Set(normalize(value).split(" ").filter((token) => token.length >= 3)); }
function similarity(left: string, right: string) { const a = arabicTokens(left); const b = arabicTokens(right); if (!a.size || !b.size) return 0; let common = 0; for (const token of a) if (b.has(token)) common++; return common / (a.size + b.size - common); }
function apiBase() { return (process.env.SUNNAH_API_BASE ?? "https://api.sunnah.com/v1").replace(/\/$/, ""); }
async function fetchCanonical(collection: string, reference: string, key: string) { const response = await fetch(`${apiBase()}/collections/${encodeURIComponent(collection)}/hadiths/${encodeURIComponent(reference)}`, { headers: { "X-API-Key": key, Accept: "application/json" } }); if (response.status === 404) return null; if (!response.ok) throw new Error(`Sunnah.com API HTTP ${response.status}`); return await response.json() as CanonicalHadith; }
async function main() {
  const key = process.env.SUNNAH_API_KEY?.trim(); if (!key) throw new Error("SUNNAH_API_KEY est absente. Demandez-la via l'API officielle Sunnah.com avant l'exécution.");
  const payload = JSON.parse(await readFile(resolve("scripts/hadith/data/hadeethenc-fr-v1.17.0.payload.json"), "utf8")) as Payload;
  const selected = FIQH_HADITH_MAPPINGS_WITH_VERIFIED_IDENTITIES.filter((mapping) => mapping.status === "verified" || !arg("source-id") || mapping.sourceId === arg("source-id")).slice(0, Number(arg("limit") ?? 1000));
  const rows = [];
  for (const mapping of selected) {
    if (mapping.status === "verified") { rows.push({ sourceId: mapping.sourceId, status: "already_verified" as ResultStatus, canonicalReference: mapping.canonicalReference ?? mapping.hadithNumber, hadeethEncCandidates: [{ hadeethEncId: mapping.sourceHadithId, hadithId: mapping.hadithId, reasons: ["mapping Fiqh deja verifie"] }] }); continue; }
    const parsed = parseSourceId(mapping.sourceId); if (!parsed) { rows.push({ sourceId: mapping.sourceId, status: "canonical_not_found" as ResultStatus, canonicalReference: null, hadeethEncCandidates: [] }); continue; }
    const canonical = await fetchCanonical(parsed.collection, parsed.reference, key); if (!canonical) { rows.push({ sourceId: mapping.sourceId, status: "canonical_not_found" as ResultStatus, canonicalReference: null, hadeethEncCandidates: [] }); continue; }
    const canonicalText = canonical.hadith?.find((item) => item.lang === "ar")?.body ?? canonical.hadith?.[0]?.body ?? "";
    const candidates = payload.records.filter((record) => (record.sourceCollections ?? []).some((collection) => collectionKey(collection) === parsed.collection)).map((record) => { const score = similarity(canonicalText, record.hadeethAr ?? ""); return { hadeethEncId: record.sourceHadithId, narrator: record.narrator ?? null, arabicSimilarity: score, collectionMatch: true, reasons: score >= 0.75 ? ["concordance arabe forte", "collection compatible"] : ["collection compatible seulement"], warnings: score < 0.75 ? ["transmission ou matn non suffisamment concordant"] : [] }; }).filter((candidate) => candidate.arabicSimilarity >= 0.75).sort((a, b) => b.arabicSimilarity - a.arabicSimilarity).slice(0, 3);
    const status: ResultStatus = candidates.some((candidate) => candidate.arabicSimilarity >= 0.92) ? "exact_or_near_exact_identity_candidate" : candidates.length ? "strong_identity_candidate" : "hadeethenc_not_found";
    rows.push({ sourceId: mapping.sourceId, canonicalReference: canonical, status, hadeethEncCandidates: candidates });
  }
  const report = { generatedAt: new Date().toISOString(), api: apiBase(), policy: "read_only_identity_audit_no_automatic_mapping", rows }; await mkdir(resolve("scripts/hadith/reports"), { recursive: true }); await writeFile(resolve("scripts/hadith/reports/fiqh-canonical-hadeethenc-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`TOTAL FIQH HADITHS: ${rows.length}`); console.log(`ALREADY VERIFIED: ${rows.filter((row) => row.status === "already_verified").length}`); console.log(`CANONICAL FOUND: ${rows.filter((row) => row.canonicalReference).length}`); console.log(`EXACT/NEAR-EXACT: ${rows.filter((row) => row.status === "exact_or_near_exact_identity_candidate").length}`); console.log(`STRONG IDENTITY: ${rows.filter((row) => row.status === "strong_identity_candidate").length}`); console.log(`PARALLEL NARRATIONS: ${rows.filter((row) => row.status === "possible_parallel_narration").length}`); console.log(`HADEETHENC NOT FOUND: ${rows.filter((row) => row.status === "hadeethenc_not_found").length}`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
