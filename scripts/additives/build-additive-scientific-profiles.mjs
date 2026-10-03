#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildImportPlan } from './additive-science-pipeline.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const INPUT = path.join(ROOT, 'scripts/output/additive-science-source-audit-01-v3.json');
const EFSA_INDEX = path.join(ROOT, 'scripts/output/openfoodtox-index.json');
const JECFA_INDEX = path.join(ROOT, 'scripts/output/jecfa-index.json');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const BATCH_OUTPUT = path.join(ROOT, 'scripts/data/additives-scientific-batch-01-v3.json');
const REVIEW_OUTPUT = path.join(ROOT, 'scripts/output/additive-science-manual-review-01.json');
const DRY_RUN_OUTPUT = path.join(ROOT, 'scripts/output/additives-scientific-batch-01-v3-dry-run.json');
const EXISTING = path.join(ROOT, 'scripts/data/food-additive-science-existing.json');
const REVIEW_DATE = new Date().toISOString().slice(0, 10);

function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function save(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function unique(values) { return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ''))]; }
function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function maxYear(values) { return [...values].sort((a, b) => Number(b?.year ?? 0) - Number(a?.year ?? 0))[0] ?? null; }
function familyFor(title, code) {
  const normalized = String(title ?? '').toLowerCase();
  if (/caramel colours.*e 150\s*a,b,c,d|e 150\s*a,b,c,d.*caramel/i.test(normalized)) return { assessmentScope: 'family', coveredCodes: ['E150A', 'E150B', 'E150C', 'E150D'] };
  return { assessmentScope: 'individual', coveredCodes: [code] };
}

function sourceForAuthority(authority, item) {
  if (authority === 'EFSA') {
    const reference = item.efsa.assessmentReferences[0] ?? {};
    return { sourceId: `openfoodtox-${item.code.toLowerCase()}`, organisation: 'EFSA', sourceType: 'official_information', title: 'EFSA OpenFoodTox 3.0 structured record', url: reference.url || 'https://www.efsa.europa.eu/en/data-report/chemical-hazards-database-openfoodtox', retrievedAt: REVIEW_DATE, fieldsSupported: ['identity', 'assessment_reference', 'reference_values', 'assessment_scope'] };
  }
  const reference = item.jecfa.sourceRecords?.[0] ?? {};
  return { sourceId: `jecfa-${item.code.toLowerCase()}`, organisation: 'JECFA', sourceType: 'official_information', title: 'WHO/JECFA evaluation database', url: reference.url || 'https://apps.who.int/food-additives-contaminants-jecfa-database/Home', retrievedAt: REVIEW_DATE, fieldsSupported: ['identity', 'INS', 'CAS', 'evaluation_history', 'ADI'] };
}

function efsaReferenceValues(item) {
  return (item.efsa.referenceValues ?? []).map((value) => {
    if (value.type === 'ADI') return { type: value.noAllocated ? 'not_specified' : 'ADI', lower: number(value.lowerValue), upper: number(value.upperValue), unit: value.unit || null, rawText: value.noAllocated || null, authority: 'EFSA', year: number(item.efsa.latestAssessment?.year), scope: 'food_additive_human', source: item.efsa.latestAssessment?.url || null };
    const isAnimalOrFeed = /animal|feed|bird|cat|dog|fish|rodent|worker/i.test(`${value.field ?? ''} ${value.value ?? ''}`);
    return { type: 'other_reference_value', value: value.value ?? null, unit: null, rawText: value.value ?? null, authority: 'EFSA', year: number(item.efsa.latestAssessment?.year), scope: isAnimalOrFeed ? 'non_human_or_non_food' : 'food_additive_human', source: item.efsa.latestAssessment?.url || null, field: value.field ?? null };
  });
}

function jecfaReferenceValues(item) {
  const source = item.jecfa.sourceRecords?.[0]?.url || null;
  return (item.jecfa.assessments ?? []).filter((assessment) => assessment.adi?.rawText).map((assessment) => {
    const raw = assessment.adi.rawText;
    const status = assessment.adi.status || (/group\s+ADI/i.test(raw) ? 'group_ADI' : /not limited/i.test(raw) ? 'not_limited' : /not specified/i.test(raw) ? 'not_specified' : /temporary/i.test(raw) ? 'temporary' : /withdrawn/i.test(raw) ? 'withdrawn' : null);
    const numeric = [...raw.matchAll(/(?:ADI|of|to|-)\s*(\d+(?:\.\d+)?)\s*(?:mg|µg)/gi)].map((match) => Number(match[1])).filter(Number.isFinite);
    return { type: status || 'ADI', value: numeric.length === 1 ? numeric[0] : null, lower: numeric.length > 1 ? Math.min(...numeric) : null, upper: numeric.length > 1 ? Math.max(...numeric) : null, unit: /µg/i.test(raw) ? 'µg/kg bw/day' : /mg/i.test(raw) ? 'mg/kg bw/day' : null, rawText: raw, authority: 'JECFA', year: number(assessment.year), scope: status === 'group_ADI' ? 'group' : 'food_additive_human', groupName: status === 'group_ADI' ? raw.match(/group\s+ADI[^.;]*/i)?.[0] ?? 'JECFA group ADI' : null, source };
  });
}

const EFFECT_SEVERITIES = new Set(['none', 'low', 'moderate', 'serious', 'unknown']);
const EFFECT_EVIDENCE = new Set(['insufficient', 'limited', 'moderate', 'strong']);
const EFFECT_SCOPES = new Set(['additive', 'metabolite', 'contaminant', 'degradation_product', 'family']);
function firstStructured(raw, keys) { for (const key of keys) if (raw?.[key] !== undefined && raw?.[key] !== null && raw[key] !== '') return raw[key]; return undefined; }
function studyContext(raw) {
  const type = String(firstStructured(raw, ['studyContext', 'studyType', 'study_type', 'humanAnimalContext', 'human_animal_context']) ?? '').toLowerCase();
  const species = firstStructured(raw, ['species', 'testSpecies', 'test_species']);
  const testSystem = firstStructured(raw, ['testSystem', 'test_system', 'system']);
  const duration = firstStructured(raw, ['duration', 'studyDuration', 'study_duration']);
  const normalizedType = /human|clinical|epidemiolog/.test(type) ? 'human' : /animal|in vivo|rat|mouse|dog|cat|fish|bird|rodent/.test(`${type} ${species ?? ''}`.toLowerCase()) ? 'animal' : /in vitro|cell line|cell culture/.test(`${type} ${testSystem ?? ''}`.toLowerCase()) ? 'in_vitro' : 'unknown';
  return { type: normalizedType, ...(species ? { species: String(species) } : {}), ...(duration ? { duration: String(duration) } : {}), ...(testSystem ? { testSystem: String(testSystem) } : {}) };
}
function criticalEndpoints(item, raw) {
  const direct = firstStructured(raw, ['criticalEndpoint', 'critical_endpoint', 'criticalEffect', 'critical_effect']);
  if (direct) return [String(direct)];
  return (item.efsa.referenceValues ?? []).filter((value) => /criticalendpoint/i.test(String(value.field ?? '')) && value.value).map((value) => String(value.value));
}
function referencePoint(raw) {
  const type = firstStructured(raw, ['referencePointType', 'reference_point_type', 'pointOfDepartureType', 'point_of_departure_type']);
  const value = firstStructured(raw, ['referencePointValue', 'reference_point_value', 'NOAEL', 'LOAEL', 'BMD', 'BMDL']);
  const unit = firstStructured(raw, ['referencePointUnit', 'reference_point_unit', 'unit']);
  if (type === undefined && value === undefined && unit === undefined) return undefined;
  return { ...(type !== undefined ? { type: String(type) } : {}), ...(value !== undefined ? { value } : {}), ...(unit !== undefined ? { unit: String(unit) } : {}) };
}
function buildPotentialEffects(item) {
  return (item.efsa.humanHealthEffects ?? []).flatMap((raw, index) => {
    const text = Object.entries(raw ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== '').map(([key, value]) => `${key}: ${value}`).join(' ').trim();
    if (!text) return [];
    const explicitScope = firstStructured(raw, ['appliesTo', 'scope', 'effectScope']);
    const appliesTo = EFFECT_SCOPES.has(explicitScope) ? explicitScope : /contaminant/i.test(text) ? 'contaminant' : /metabolite/i.test(text) ? 'metabolite' : /degradation/i.test(text) ? 'degradation_product' : 'additive';
    const rawSeverity = firstStructured(raw, ['severity', 'severityLevel', 'severity_level']);
    const rawEvidence = firstStructured(raw, ['evidenceLevel', 'evidence_level', 'evidenceStrength', 'evidence_strength']);
    const endpoints = criticalEndpoints(item, raw);
    const context = studyContext(raw);
    const effect = {
      effect: text,
      severity: EFFECT_SEVERITIES.has(rawSeverity) ? rawSeverity : 'unknown',
      evidenceLevel: EFFECT_EVIDENCE.has(rawEvidence) ? rawEvidence : 'insufficient',
      appliesTo,
      studyContext: context,
      ...(endpoints[0] ? { criticalEndpoint: endpoints[0] } : {}),
      ...(firstStructured(raw, ['targetOrgan', 'target_organ']) ? { targetOrgan: String(firstStructured(raw, ['targetOrgan', 'target_organ'])) } : {}),
      ...(referencePoint(raw) ? { referencePoint: referencePoint(raw) } : {}),
      evidenceContext: item.efsa.assessmentDomain,
      source: { authority: 'EFSA', dataset: 'OpenFoodTox 3.0', assessmentId: item.efsa.latestAssessment?.efsaOutputId || item.efsa.latestAssessment?.doi || null, sourceUrl: item.efsa.latestAssessment?.url ?? null, sourceTable: 'humanHealthEffects', sourceRecordId: `${item.code}:humanHealthEffects:${index}` },
      normalization: { severitySource: rawSeverity !== undefined ? 'explicit' : 'unknown', evidenceSource: rawEvidence !== undefined ? 'explicit' : 'unknown' },
    };
    return [effect];
  });
}

function buildAuthorityEvaluations(item) {
  const evaluations = [];
  for (const reference of item.efsa.assessmentReferences ?? []) {
    const family = familyFor(reference.title, item.code);
    evaluations.push({ authority: 'EFSA', year: number(reference.year), conclusion: null, url: reference.url, evaluationType: 'structured_assessment', scope: item.efsa.assessmentDomain, assessmentIdentifier: reference.efsaOutputId || reference.doi || null, sourceDataset: 'OpenFoodTox 3.0', ...family });
  }
  for (const assessment of item.jecfa.assessments ?? []) {
    const family = /group\s+adi/i.test(assessment.adi?.rawText ?? '') ? { assessmentScope: 'group', coveredCodes: [item.code] } : { assessmentScope: 'individual', coveredCodes: [item.code] };
    evaluations.push({ authority: 'JECFA', year: number(assessment.year), conclusion: null, url: item.jecfa.sourceRecords?.[0]?.url || 'https://apps.who.int/food-additives-contaminants-jecfa-database/Home', evaluationType: 'evaluation_summary', scope: 'food_additive_human', assessmentIdentifier: assessment.meeting ? `JECFA-${assessment.meeting}-${assessment.year}` : `JECFA-${assessment.year}`, sourceDataset: 'WHO/JECFA evaluation database', ...family });
  }
  return evaluations;
}

function assessScientificProfileCompleteness(profile) {
  const missingFields = [];
  const reviewReasons = [];
  if (!profile.names?.en && !profile.names?.fr) missingFields.push('names');
  if (!profile.authorityEvaluations?.length) missingFields.push('authorityEvaluations');
  if (!profile.sources?.length) missingFields.push('sources');
  if (!profile.referenceValues?.length) missingFields.push('referenceValues');
  if (profile.authorityEvaluations?.some((evaluation) => evaluation.assessmentScope === 'family')) reviewReasons.push('family_assessment_scope_preserved');
  if (profile.authorityDisagreement) reviewReasons.push('authority_disagreement');
  if (profile.authorityEvaluations?.every((evaluation) => evaluation.conclusion === null)) reviewReasons.push('no_explicit_source_conclusion');
  return { complete: missingFields.length === 0, missingFields, reviewReasons };
}

function evidenceLevel(item, referenceValues) {
  if (item.efsa.matchConfidence === 'strong' && item.efsa.assessmentCount > 0 && referenceValues.length) return item.efsa.assessmentReferences.some((reference) => familyFor(reference.title, item.code).assessmentScope === 'family') ? 'moderate' : 'strong';
  if (item.jecfa.matchConfidence === 'strong' && item.jecfa.evaluationCount > 0) return 'strong';
  if (item.efsa.assessmentCount > 0 || item.jecfa.evaluationCount > 0) return 'limited';
  return 'insufficient';
}

function buildProfile(item, catalogItem) {
  const referenceValues = [...efsaReferenceValues(item), ...jecfaReferenceValues(item)];
  const authorityEvaluations = buildAuthorityEvaluations(item);
  const sources = unique(['EFSA/OpenFoodTox', 'WHO/JECFA'].filter((authority) => authority === 'EFSA/OpenFoodTox' ? item.efsa.matchConfidence === 'strong' || item.efsa.matchConfidence === 'exact' : item.jecfa.matchConfidence === 'strong' || item.jecfa.matchConfidence === 'exact')).map((authority) => sourceForAuthority(authority === 'EFSA/OpenFoodTox' ? 'EFSA' : 'JECFA', item));
  const profile = {
    code: item.code,
    names: { en: catalogItem.names?.en ?? item.canonicalName },
    aliases: unique([...(catalogItem.aliases ?? []), ...(item.jecfa.sourceRecords ?? []).flatMap((record) => [record.name]), ...(item.jecfa.sourceRecords ?? []).flatMap(() => [])]),
    function: null,
    regulatoryStatus: catalogItem.euRegulatoryStatus ? { eu: catalogItem.euRegulatoryStatus, notes: ['Fonction réglementaire UE conservée séparément ; aucune fonction scientifique déduite.'] } : null,
    authorityEvaluations,
    referenceValues,
    authorityDisagreement: null,
    exposure: { referenceValues, estimatedExposure: null, exceedance: null, populationsAtRisk: unique(referenceValues.map((value) => value.population).filter(Boolean)), notes: ['Aucune exposition individuelle ni aucun dépassement n’est déduit de ces sources.'] },
    potentialEffects: buildPotentialEffects(item),
    restrictions: [],
    evidenceLevel: evidenceLevel(item, referenceValues),
    sources,
    lastReviewedAt: REVIEW_DATE,
    dataVersion: 'reviewed-1.0',
    needsScientificReview: false,
  };
  profile.completeness = assessScientificProfileCompleteness(profile);
  profile.needsScientificReview = !profile.completeness.complete || Boolean(profile.authorityDisagreement);
  return profile;
}

function manualReview(items, catalogByCode) {
  return items.filter((item) => !['exact', 'strong'].includes(item.efsa.matchConfidence) && !['exact', 'strong'].includes(item.jecfa.matchConfidence)).map((item) => ({ code: item.code, name: catalogByCode.get(item.code)?.names?.en ?? item.canonicalName, reason: item.combined.reasonIfNotAutomatable || 'MATCH_AMBIGUOUS', candidateSources: item.efsa.discoveryFound || item.jecfa.matchFound ? ['EFSA/OpenFoodTox', 'WHO/JECFA'] : [], candidateMatches: { efsa: { confidence: item.efsa.matchConfidence, assessmentCount: item.efsa.assessmentCount }, jecfa: { confidence: item.jecfa.matchConfidence, evaluationCount: item.jecfa.evaluationCount, ins: item.jecfa.ins } }, recommendedReviewAction: 'Vérification manuelle de l’identité et du périmètre avant génération d’un profil.' }));
}

export { assessScientificProfileCompleteness, buildPotentialEffects, buildProfile, evidenceLevel };

function main() {
  const audit = read(INPUT); const catalog = read(CATALOG).entries; const catalogByCode = new Map(catalog.map((item) => [item.code, item]));
  const automatable = audit.items.filter((item) => ['exact', 'strong'].includes(item.efsa.matchConfidence) || ['exact', 'strong'].includes(item.jecfa.matchConfidence));
  const profiles = automatable.map((item) => buildProfile(item, catalogByCode.get(item.code) ?? { code: item.code, names: { en: item.canonicalName }, aliases: [] }));
  const review = manualReview(audit.items, catalogByCode);
  const knownCodes = new Set(catalog.map((item) => item.code));
  const existingRows = fs.existsSync(EXISTING) ? read(EXISTING).map((row) => ({ ...row, code: row.code ?? row.codeE, lastReviewedAt: row.lastReviewedAt ?? row.scientificReviewedAt })) : [];
  const dryRun = buildImportPlan(profiles, existingRows, knownCodes);
  const dryRunReport = { mode: 'dry-run', sourceBatch: path.relative(ROOT, BATCH_OUTPUT), existingInput: path.relative(ROOT, EXISTING), ...dryRun, summary: { generatedProfiles: profiles.length, validProfiles: dryRun.validation.valid.length, completeProfiles: profiles.filter((profile) => profile.completeness.complete).length, incompleteProfiles: profiles.filter((profile) => !profile.completeness.complete).length, rejectedProfiles: dryRun.validation.rejected.length, proposedNew: dryRun.decisions.filter((decision) => decision.action === 'insert').length, proposedUpdates: dryRun.decisions.filter((decision) => decision.action === 'update').length, conflicts: dryRun.decisions.filter((decision) => decision.action === 'conflict').length, ignored: 0, manualReview: review.length, noClassification: true, noSupabaseWrites: true } };
  save(BATCH_OUTPUT, { schemaVersion: '3.0', generatedAt: new Date().toISOString(), sourceAudit: path.relative(ROOT, INPUT), sourceIndexes: { efsa: path.relative(ROOT, EFSA_INDEX), jecfa: path.relative(ROOT, JECFA_INDEX) }, profiles });
  save(REVIEW_OUTPUT, { schemaVersion: '1.0', generatedAt: new Date().toISOString(), sourceAudit: path.relative(ROOT, INPUT), items: review });
  save(DRY_RUN_OUTPUT, dryRunReport);
  console.log(JSON.stringify({ batch: BATCH_OUTPUT, manualReview: REVIEW_OUTPUT, dryRun: DRY_RUN_OUTPUT, summary: dryRunReport.summary }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
