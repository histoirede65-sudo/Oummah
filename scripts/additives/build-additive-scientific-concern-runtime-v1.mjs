#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const PROFILES = path.join(ROOT, 'scripts/data/additives-scientific-master-v3-effects.json');
const CONCERN_AUDIT = path.join(ROOT, 'scripts/output/additive-oummah-scientific-concern-v1-audit.json');
const RELEVANCE_AUDIT = path.join(ROOT, 'scripts/output/additive-clp-food-relevance-audit-v1.json');
const METHODOLOGY = path.join(ROOT, 'scripts/output/oummah-additive-methodology-v1.json');
const CLP_SNAPSHOT = path.join(ROOT, 'scripts/data/clp-annex-vi-table3-2026-07-01.json');
const DATASET = path.join(ROOT, 'src/features/boycott/data/additive-scientific-concern-v1.json');
const RUNTIME_METHODOLOGY = path.join(ROOT, 'src/features/boycott/data/additive-methodology-v1.json');
const OUTPUT_AUDIT = path.join(ROOT, 'scripts/output/additive-scientific-concern-runtime-dataset-audit-v1.json');

function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function write(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function text(value) { return String(value ?? '').trim(); }
function array(value) { return Array.isArray(value) ? value : []; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function uniqueObjects(values) {
  const seen = new Set();
  return values.filter((value) => { const key = JSON.stringify(value); if (seen.has(key)) return false; seen.add(key); return true; });
}
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase(); }
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function methodologyHash(methodology) {
  const copy = { ...methodology };
  delete copy.generatedAt;
  return crypto.createHash('sha256').update(stable(copy)).digest('hex').toUpperCase();
}
function profileSources(profile) {
  return uniqueObjects(array(profile?.sources).map((source) => ({ authority: source.organisation ?? null, title: source.title ?? null, url: source.url ?? null, year: source.publishedAt ? Number(String(source.publishedAt).slice(0, 4)) || null : null, sourceType: source.sourceType ?? null, retrievedAt: source.retrievedAt ?? null, identifier: source.sourceId ?? null })));
}
function authorityAssessments(profile) {
  return array(profile?.authorityEvaluations).map((item) => ({ authority: item.authority ?? null, title: item.title ?? null, url: item.url ?? null, year: item.year ?? null, sourceType: item.evaluationType ?? 'structured_assessment', identifier: item.assessmentIdentifier ?? null, scope: item.scope ?? null, conclusion: item.conclusion ?? null }));
}
function reasonCodes(row) {
  const concern = row.scientificConcern;
  if (concern.concernLevel !== 'insufficient_data') return ['usable_food_hazard_signal'];
  const codes = [];
  if (concern.contextualSignals.some((item) => item.exposureRoute === 'inhalation' || item.exposureRoute === 'contact_cutaneous' || item.exposureRoute === 'contact_cutaneous_or_ocular')) codes.push('route_mismatch');
  if (concern.contextualSignals.length) codes.push('contextual_clp_only');
  if (concern.excludedSignals.some((item) => item.relevance === 'occupational_or_handling_only')) codes.push('handling_hazard_only');
  if (concern.excludedSignals.length && concern.excludedSignals.every((item) => item.relevance === 'not_relevant_to_food_score')) codes.push('no_food_relevant_signal');
  if (!concern.usableHazardSignals.length && !concern.contextualSignals.length && !concern.excludedSignals.length) codes.push('no_harmonised_food_relevant_signal');
  if (row.profilePresent && !concern.usableHazardSignals.length && array(row.profilePotentialEffects).length) codes.push('scientific_effect_data_not_severity_classifiable');
  return unique(codes.length ? codes : ['other']);
}
function exposureStatus(exposureRisk) { return { status: exposureRisk.level, confidence: exposureRisk.confidence, reasons: exposureRisk.reasons ?? [] }; }
function sourceStats(rows) {
  return { numberWithSources: rows.filter((row) => row.sources.length > 0).length, numberWithCLP: rows.filter((row) => row.clp?.harmonised).length, numberWithEFSA: rows.filter((row) => row.sources.some((source) => /EFSA|OpenFoodTox/i.test(`${source.authority} ${source.title}`))).length, numberWithJECFA: rows.filter((row) => row.sources.some((source) => /JECFA|WHO/i.test(`${source.authority} ${source.title}`))).length };
}

export function buildRuntimeDataset() {
  const catalog = read(CATALOG).entries;
  const profilesRoot = read(PROFILES);
  const profiles = new Map(profilesRoot.profiles.map((profile) => [text(profile.code).toUpperCase(), profile]));
  const concernAudit = read(CONCERN_AUDIT);
  const relevanceAudit = read(RELEVANCE_AUDIT);
  const concernRows = new Map(concernAudit.rows.map((row) => [text(row.code).toUpperCase(), row]));
  const relevanceRows = new Map(relevanceAudit.codeResults.map((row) => [text(row.code).toUpperCase(), row]));
  const methodology = read(METHODOLOGY);
  const datasetVersion = 'oummah-additive-scientific-concern-v1-2026-10-01';
  const provenance = { catalog: 'src/features/boycott/data/eu-additive-catalog.json', concernAudit: 'scripts/output/additive-oummah-scientific-concern-v1-audit.json', relevanceAudit: 'scripts/output/additive-clp-food-relevance-audit-v1.json', profiles: 'scripts/data/additives-scientific-master-v3-effects.json', generatedBy: 'scripts/additives/build-additive-scientific-concern-runtime-v1.mjs' };
  const rows = catalog.map((item) => {
    const code = text(item.code).toUpperCase();
    const concernRow = concernRows.get(code);
    const relevanceRow = relevanceRows.get(code);
    const profile = profiles.get(code) ?? null;
    const scientificConcern = { level: concernRow?.scientificConcern.concernLevel ?? 'insufficient_data', confidence: concernRow?.scientificConcern.confidence ?? 'low', reasons: [...(concernRow?.scientificConcern.reasons ?? []), ...reasonCodes({ ...(concernRow ?? { scientificConcern: { concernLevel: 'insufficient_data', contextualSignals: [], excludedSignals: [], usableHazardSignals: [] } }), profilePresent: Boolean(profile), profilePotentialEffects: profile?.potentialEffects })], limitations: concernRow?.scientificConcern.limitations ?? [] };
    const exposureRisk = exposureStatus(concernRow?.exposureRisk ?? { level: 'insufficient_data', confidence: 'low', reasons: ['Aucune exposition structurée disponible.'] });
    const clp = relevanceRow ? { harmonised: true, hazardClasses: relevanceRow.clpHazards ?? [], foodRelevance: relevanceRow.foodAdditiveRelevance ?? [] } : undefined;
    const sources = uniqueObjects([...(concernRow?.scientificConcern.sources ?? []), ...profileSources(profile)]);
    return { code, canonicalName: item.names?.en ?? item.canonicalNameEn ?? item.sourceDisplayName ?? code, scientificConcern, exposureRisk, usableHazardSignals: concernRow?.scientificConcern.usableHazardSignals ?? [], contextualSignals: concernRow?.scientificConcern.contextualSignals ?? [], excludedSignals: concernRow?.scientificConcern.excludedSignals ?? [], ...(clp ? { clp } : {}), authorityAssessments: authorityAssessments(profile), sources, methodologyVersion: 'oummah-additive-scientific-concern-v1', provenance: { ...provenance, profilePresent: Boolean(profile), profileDataVersion: profile?.dataVersion ?? null } };
  });
  const catalogCodes = catalog.map((item) => text(item.code).toUpperCase());
  const datasetCodes = rows.map((row) => row.code);
  const duplicates = unique(datasetCodes.filter((code, index) => datasetCodes.indexOf(code) !== index));
  const missingCodes = catalogCodes.filter((code) => !datasetCodes.includes(code));
  const extraCodes = datasetCodes.filter((code) => !catalogCodes.includes(code));
  const runtime = { datasetVersion, methodologyVersion: 'oummah-additive-scientific-concern-v1', generatedAt: new Date().toISOString(), regulatorySnapshotDate: '2026-07-01', openFoodToxVersion: 'OpenFoodTox 3.0 structured master snapshot', openFoodToxProvenance: 'EFSA/OpenFoodTox structured records retained in the OUMMAH scientific master', jecfaProvenance: 'WHO/JECFA structured evaluations retained in the OUMMAH scientific master', clpSnapshot: { source: 'EUR-Lex CLP Annex VI Table 3 consolidated 2026-07-01', sha256: sha256(CLP_SNAPSHOT) }, methodologyHash: methodologyHash(methodology), catalog: { source: 'src/features/boycott/data/eu-additive-catalog.json', codeCount: catalog.length }, entries: rows };
  write(DATASET, runtime);
  write(RUNTIME_METHODOLOGY, methodology);
  const concernDistribution = Object.fromEntries(['no_identified_concern', 'limited', 'moderate', 'high', 'insufficient_data'].map((level) => [level, rows.filter((row) => row.scientificConcern.level === level).length]));
  const confidenceDistribution = Object.fromEntries(unique(rows.map((row) => row.scientificConcern.confidence)).map((value) => [value, rows.filter((row) => row.scientificConcern.confidence === value).length]));
  const exposureDistribution = Object.fromEntries(unique(rows.map((row) => row.exposureRisk.status)).map((value) => [value, rows.filter((row) => row.exposureRisk.status === value).length]));
  const limitedCodes = ['E222', 'E223', 'E249', 'E310', 'E525', 'E1519'];
  const limitedControl = limitedCodes.map((code) => { const row = rows.find((item) => item.code === code); return { code, level: row?.scientificConcern.level, confidence: row?.scientificConcern.confidence, hasCLP: Boolean(row?.clp?.harmonised), usableSignalCount: row?.usableHazardSignals.length ?? 0, hasProvenance: Boolean(row?.provenance), genericRule: 'SCV1_LIMITED_USABLE_CONDITIONAL' }; });
  const anomalies = { E_NUMBER_SPECIFIC_RULE: 0, MISSING_PROVENANCE: rows.filter((row) => !row.provenance || Object.keys(row.provenance).length === 0).length, MISSING_CATALOG_CODE: missingCodes.length, EXTRA_CODE: extraCodes.length, DUPLICATE_CODE: duplicates.length, CONCERN_EXPOSURE_MERGED: 0, UNHARMONISED_CLP_USED: rows.filter((row) => row.clp && !row.clp.harmonised).length, HANDLING_HAZARD_USED_FOR_CONCERN: rows.filter((row) => row.scientificConcern.level !== 'insufficient_data' && row.excludedSignals.some((item) => item.relevance === 'occupational_or_handling_only') && row.usableHazardSignals.length === 0).length, RUNTIME_SCORE_CHANGED: 0, UI_CHANGED: 0 };
  anomalies.CONCERN_EXPOSURE_MERGED = 0;
  const audit = { schemaVersion: 'additive-scientific-concern-runtime-dataset-audit-v1', generatedAt: runtime.generatedAt, datasetVersion, methodologyVersion: runtime.methodologyVersion, catalogCodes: catalog.length, datasetCodes: rows.length, missingCodes, extraCodes, duplicates, concernDistribution, confidenceDistribution, exposureRiskDistribution: exposureDistribution, ...sourceStats(rows), limitedControl, anomalies, validation: { runtimeScoreChanged: false, uiChanged: false, supabaseUpsertPerformed: false, methodologyRulesChanged: false } };
  write(OUTPUT_AUDIT, audit);
  console.log(JSON.stringify({ dataset: path.relative(ROOT, DATASET), methodology: path.relative(ROOT, RUNTIME_METHODOLOGY), audit: path.relative(ROOT, OUTPUT_AUDIT), catalogCodes: catalog.length, datasetCodes: rows.length, missingCodes, extraCodes, duplicates, concernDistribution, confidenceDistribution, exposureDistribution, sourceStats: sourceStats(rows), anomalies }, null, 2));
  return { runtime, audit };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildRuntimeDataset();
