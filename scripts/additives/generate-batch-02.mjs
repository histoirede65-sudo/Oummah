#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT = path.join(ROOT, 'scripts/data/additives-scientific-batch-02.json');
const EU_URL = 'https://food.ec.europa.eu/food-safety/food-improvement-agents/additives/database_en';
const EXTRA = [
  ['E1400', 'Amidons modifiés', 'Modified starches', 'thickener'],
  ['E1412', 'Phosphate de diamidon', 'Distarch phosphate', 'thickener'],
  ['E150A', 'Caramel ordinaire', 'Plain caramel', 'colour'],
  ['E160B', 'Extrait de rocou', 'Annatto extracts', 'colour'],
  ['E220', 'Dioxyde de soufre', 'Sulphur dioxide', 'preservative'],
  ['E252', 'Nitrate de potassium', 'Potassium nitrate', 'preservative'],
  ['E412', 'Gomme guar', 'Guar gum', 'thickener'],
  ['E415', 'Gomme xanthane', 'Xanthan gum', 'thickener'],
  ['E450', 'Diphosphates', 'Diphosphates', 'raising_agent'],
  ['E471', 'Mono- et diglycérides d’acides gras', 'Mono- and diglycerides of fatty acids', 'emulsifier'],
];
function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) { const match = line.match(/^([A-Z0-9_]+)=(.*)$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['\"]|['\"]$/g, ''); }
}
function toImportRecord(row) {
  const effects = (row.health_effects ?? []).map((effect) => ({ effect: effect.effect ?? effect.title ?? effect.category ?? 'Scientific signal documented in the source', severity: ['none', 'low', 'moderate', 'serious'].includes(effect.severity) ? effect.severity : 'moderate', evidenceLevel: effect.evidenceStrength === 'limited_evidence' ? 'limited' : (effect.evidenceStrength ?? 'insufficient'), appliesTo: 'additive', notes: effect.population }));
  const evaluations = (row.assessment_history ?? []).map((item) => ({ authority: item.organisation ?? 'Authority not specified', conclusion: item.conclusion ?? row.scientific_summary ?? 'Conclusion preserved from the scientific profile.', reviewedAt: String(item.date ?? row.scientific_reviewed_at ?? '').slice(0, 10) }));
  const sources = (row.sources ?? []).filter((item) => typeof item.url === 'string' && /^https?:\/\//.test(item.url)).map((item) => ({ sourceId: item.sourceId ?? `${row.code.toLowerCase()}-source`, organisation: item.organisation ?? 'Official source', sourceType: ['scientific_opinion', 'regulation', 'international_agency', 'official_information'].includes(item.sourceType) ? item.sourceType : 'official_information', title: item.title ?? 'Official scientific source', url: item.url, publishedAt: item.publishedAt, retrievedAt: String(item.retrievedAt ?? item.accessedAt ?? row.scientific_reviewed_at).slice(0, 10), fieldsSupported: ['scientific_summary', 'exposure_assessment'] }));
  return { code: row.code, names: { fr: row.canonical_name, en: row.canonical_name }, aliases: [], function: row.function_classes?.[0] ?? undefined, regulatoryStatus: { eu: row.regulatory_status ?? undefined, notes: [] }, authorityEvaluations: evaluations, exposure: { adi: row.adi_value ?? undefined, unit: row.adi_unit ?? undefined, estimatedExposure: row.exposure_assessment?.exposureConclusion, populationsAtRisk: row.sensitive_populations ?? [], notes: [] }, potentialEffects: effects, restrictions: [], evidenceLevel: row.evidence_strength ?? 'insufficient', sources, lastReviewedAt: String(row.scientific_reviewed_at).slice(0, 10), dataVersion: row.data_version, needsScientificReview: Boolean(row.needs_scientific_review) };
}
async function main() {
  loadEnv();
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase configuration missing');
  const response = await fetch(`${url}/rest/v1/food_additive_science?select=*`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
  const rows = await response.json();
  const complete = rows.filter((row) => !row.needs_scientific_review && row.sources?.length && row.scientific_summary && row.scientific_reviewed_at && row.data_version).map(toImportRecord);
  const extra = EXTRA.map(([code, fr, en, func]) => ({ code, names: { fr, en }, aliases: [], function: func, regulatoryStatus: { eu: 'Référence réglementaire à vérifier dans la base UE.', notes: [] }, authorityEvaluations: [], potentialEffects: [], restrictions: [], evidenceLevel: 'insufficient', sources: [{ sourceId: `ec-eu-additives-database-${code.toLowerCase()}`, organisation: 'European Commission', sourceType: 'regulatory_database', title: 'EU Food Additives Database / Union list reference', url: EU_URL, retrievedAt: '2026-09-30', fieldsSupported: ['identity', 'regulatory_status'] }], lastReviewedAt: '2026-09-30', dataVersion: 'reviewed-1.0', needsScientificReview: true }));
  const batch = [...complete, ...extra];
  fs.writeFileSync(OUTPUT, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: OUTPUT, profiles: batch.length, complete: complete.length, incomplete: extra.length, codes: batch.map((item) => item.code) }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
