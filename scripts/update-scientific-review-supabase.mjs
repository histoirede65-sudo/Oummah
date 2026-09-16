#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REVIEW_PATH = path.join(ROOT, 'scripts', 'output', 'scientific-review-batch-01.json');
export const REPORT_PATH = path.join(ROOT, 'scripts', 'output', 'scientific-review-batch-01-supabase-dry-run.json');
export const REVIEW_CODES = ['E202', 'E211', 'E250', 'E407', 'E955'];
const IMPORT_VERSION = 'reviewed-1.0';

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function envValue(name) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return undefined;
  const line = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim();
}
function numericAdi(value) { return /^\d+(?:\.\d+)?$/.test(String(value ?? '')) ? Number(value) : null; }

export function loadReview(filePath = REVIEW_PATH) {
  const review = readJson(filePath);
  const codes = review.additives?.map((item) => item.code) ?? [];
  if (codes.length !== REVIEW_CODES.length || REVIEW_CODES.some((code) => !codes.includes(code))) throw new Error(`Review source must contain exactly ${REVIEW_CODES.join(', ')}`);
  return review;
}

export function mergeBySourceId(current = [], proposed = []) {
  const merged = new Map();
  for (const source of [...current, ...proposed]) if (source?.sourceId) merged.set(source.sourceId, source);
  return [...merged.values()];
}
function mergeHistory(current = [], proposed = []) {
  const merged = new Map();
  for (const item of [...current, ...proposed]) merged.set(`${item?.sourceId ?? ''}:${item?.date ?? ''}:${item?.conclusion ?? ''}`, item);
  return [...merged.values()];
}

function proposedRow(review) {
  const adiValue = numericAdi(review.adi?.value);
  const sourceIds = review.sources.map((source) => source.sourceId);
  return {
    code: review.code,
    regulatory_status: review.regulatoryStatus?.conditions ?? null,
    eu_authorized: review.regulatoryStatus?.euAuthorised ?? null,
    adi_value: adiValue,
    adi_unit: review.adi?.unit ?? null,
    adi_display: review.adi ? `${review.adi.value} ${review.adi.unit}` : null,
    adi_authority: review.adiAuthority ?? null,
    severity: review.severity,
    evidence_strength: review.evidenceStrength,
    exposure_concern: review.exposureConcern,
    scientific_classification: review.scientificClassification,
    scientific_summary: review.scientificSummary,
    sensitive_populations: review.sensitivePopulations ?? [],
    health_effects: review.healthEffects ?? [],
    exposure_assessment: { ...(review.exposureAssessment ?? {}), validatedReviewSource: 'scientific-review-batch-01.json', sourceIds },
    assessment_history: review.adiHistory ?? [],
    sources: review.sources,
    scientific_reviewed_at: review.scientificReviewedAt,
    needs_scientific_review: review.needsScientificReview,
    data_version: IMPORT_VERSION,
  };
}

export function buildPatch(review, current) {
  const proposed = proposedRow(review);
  const currentSources = Array.isArray(current.sources) ? current.sources : [];
  const currentExposure = current.exposure_assessment && typeof current.exposure_assessment === 'object' ? current.exposure_assessment : {};
  const currentHistory = Array.isArray(current.assessment_history) ? current.assessment_history : [];
  const patch = { ...proposed,
    exposure_assessment: { ...currentExposure, ...proposed.exposure_assessment, openFoodTox: currentExposure.openFoodTox },
    assessment_history: mergeHistory(currentHistory, proposed.assessment_history),
    sources: mergeBySourceId(currentSources, proposed.sources),
  };
  return { code: review.code, current, proposed: patch, changedFields: Object.keys(patch).filter((field) => JSON.stringify(current[field] ?? null) !== JSON.stringify(patch[field] ?? null)), preservedOpenFoodTox: Boolean(currentExposure.openFoodTox), sourcesAdded: proposed.sources.filter((source) => !currentSources.some((item) => item.sourceId === source.sourceId)).map((source) => source.sourceId), scientificClassificationChange: current.scientific_classification !== patch.scientific_classification };
}

export function buildDryRun({ review, currentRows }) {
  const byCode = new Map(currentRows.map((row) => [String(row.code).toUpperCase(), row]));
  const missing = REVIEW_CODES.filter((code) => !byCode.has(code));
  if (missing.length) throw new Error(`Expected existing Supabase rows are missing: ${missing.join(', ')}`);
  const diffs = review.additives.map((item) => buildPatch(item, byCode.get(item.code)));
  return { source: path.relative(ROOT, REVIEW_PATH), mode: 'dry-run', targetedCodes: REVIEW_CODES, beforeCount: currentRows.length, targetedBeforeCount: diffs.length, newRecords: 0, otherCodesModified: 0, diffs, summary: { targeted: 5, toUpdate: diffs.length, newRecords: 0, otherCodesModified: 0, noDeletion: true, noAutomaticClassification: false, openFoodToxPreserved: diffs.every((diff) => diff.preservedOpenFoodTox), sourceDeduplication: true } };
}

async function readRemoteRows() {
  const url = envValue('EXPO_PUBLIC_SUPABASE_URL')?.replace(/\/+$/, '');
  const key = envValue('SUPABASE_SERVICE_ROLE_KEY') ?? envValue('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Remote read requires EXPO_PUBLIC_SUPABASE_URL and a Supabase read key');
  const response = await fetch(`${url}/rest/v1/food_additive_science?select=*`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Remote read failed: ${response.status} ${await response.text()}`);
  return response.json();
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const review = loadReview(path.resolve(process.argv.includes('--review') ? process.argv[process.argv.indexOf('--review') + 1] : REVIEW_PATH));
    const currentRows = await readRemoteRows();
    const report = buildDryRun({ review, currentRows });
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`5 fiches ciblées | ${report.summary.toUpdate} à mettre à jour | 0 nouvelle | 0 autre code`);
    console.log(`Rapport: ${REPORT_PATH}`);
  } catch (error) {
    const report = { mode: 'dry-run', status: 'blocked_before_write', reason: error instanceof Error ? error.message : String(error), writeAttempted: false, targetedCodes: REVIEW_CODES };
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.error(report.reason);
    process.exitCode = 1;
  }
}
