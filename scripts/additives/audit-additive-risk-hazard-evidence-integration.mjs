#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptProfile, loadCurrentEngine } from './audit-additive-risk-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MASTER = path.join(ROOT, 'scripts/data/additives-scientific-master-v2-exposure.json');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const OUTPUT = path.join(ROOT, 'scripts/output/additive-risk-hazard-evidence-integration-audit-v1.json');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const count = (items, predicate) => items.filter(predicate).length;
const unique = (values) => [...new Set(values.filter(Boolean))];
const VALID_SEVERITY = new Set(['none', 'low', 'moderate', 'serious']);
const VALID_EVIDENCE = new Set(['insufficient', 'limited', 'moderate', 'strong']);
const SECONDARY = new Set(['family', 'contaminant', 'metabolite', 'degradation_product']);
const scopeOf = (effect) => effect?.appliesTo ?? null;
const isAuthority = (evaluation, name) => String(evaluation?.authority ?? '').toUpperCase() === name;

function rawEffects(raw) { return Array.isArray(raw?.potentialEffects) ? raw.potentialEffects : []; }
function rawAuthorities(raw) { return raw?.authorityEvaluations ?? []; }
function authorities(raw) { return unique(rawAuthorities(raw).map((item) => item.authority)); }
function effectSummary(raw) {
  return rawEffects(raw).map((effect) => ({ effect: effect.effect ?? null, severity: effect.severity ?? null, evidenceLevel: effect.evidenceLevel ?? null, appliesTo: effect.appliesTo ?? null, evidenceContext: effect.evidenceContext ?? null }));
}
function profileEvidenceLevel(raw) { return raw?.evidenceLevel ?? null; }

function classifyHazard(raw, derived) {
  const effects = rawEffects(raw);
  if (!effects.length) return derived.level === 'unknown' ? 'OTHER' : 'SCIENTIFIC_DATA_INSUFFICIENT';
  const invalidSeverity = effects.some((effect) => !VALID_SEVERITY.has(effect.severity));
  if (invalidSeverity) return 'SEVERITY_NOT_NORMALIZED';
  const additive = effects.filter((effect) => effect.appliesTo === 'additive');
  const secondary = effects.filter((effect) => SECONDARY.has(effect.appliesTo));
  if (!additive.length && secondary.some((effect) => effect.appliesTo === 'family')) return 'ONLY_FAMILY_EFFECTS';
  if (!additive.length && secondary.some((effect) => effect.appliesTo === 'contaminant')) return 'ONLY_CONTAMINANT_EFFECTS';
  if (!additive.length && secondary.some((effect) => effect.appliesTo === 'metabolite')) return 'ONLY_METABOLITE_EFFECTS';
  if (!additive.length && secondary.some((effect) => effect.appliesTo === 'degradation_product')) return 'ONLY_DEGRADATION_PRODUCT_EFFECTS';
  if (!additive.length) return 'NO_EFFECT_FOR_ADDITIVE_ITSELF';
  if (derived.level === 'unknown') return 'HAZARD_DATA_PRESENT_BUT_UNSUPPORTED_FORMAT';
  return 'CORRECTLY_CONSUMED';
}

function classifyEvidence(raw, derived) {
  const effects = rawEffects(raw);
  const profileLevel = profileEvidenceLevel(raw);
  const effectLevels = effects.map((effect) => effect.evidenceLevel).filter(Boolean);
  const authoritiesWithConclusion = rawAuthorities(raw).filter((item) => typeof item.conclusion === 'string' && item.conclusion.trim());
  const hasRelevantEffect = effects.some((effect) => effect.appliesTo === 'additive');
  if (profileLevel && !VALID_EVIDENCE.has(profileLevel)) return 'EVIDENCE_DATA_PRESENT_BUT_UNSUPPORTED_FORMAT';
  if (effectLevels.some((level) => !VALID_EVIDENCE.has(level))) return 'EVIDENCE_DATA_PRESENT_BUT_UNSUPPORTED_FORMAT';
  if (effects.length && !hasRelevantEffect && effects.some((effect) => SECONDARY.has(effect.appliesTo))) return 'FAMILY_SCOPE_REDUCES_EVIDENCE';
  if (hasRelevantEffect && derived.level === 'insufficient' && effectLevels.length) return 'ENGINE_NOT_READING_EFFECT_EVIDENCE';
  if (!hasRelevantEffect && profileLevel && profileLevel !== 'insufficient' && derived.level === 'insufficient') return 'ENGINE_NOT_READING_PROFILE_EVIDENCE';
  if (rawAuthorities(raw).length && !authoritiesWithConclusion.length && derived.level === 'insufficient') return 'AUTHORITY_EVALUATION_NOT_CONSUMED';
  if (!effects.length && rawAuthorities(raw).length && derived.level === 'insufficient') return 'ONLY_REFERENCE_VALUE_NO_EFFECT_EVIDENCE';
  if (derived.level === 'insufficient') return 'TRULY_INSUFFICIENT_EVIDENCE';
  return 'CORRECTLY_CONSUMED';
}

function rawSnapshot(raw) {
  return {
    potentialEffects: effectSummary(raw),
    rawPotentialEffects: effectSummary(raw),
    profileEvidenceLevel: profileEvidenceLevel(raw),
    authorityEvaluations: rawAuthorities(raw).map((item) => ({ authority: item.authority ?? null, conclusion: item.conclusion ?? null, assessmentScope: item.assessmentScope ?? null, coveredCodes: item.coveredCodes ?? [] })),
    authorities: authorities(raw),
  };
}
function sufficiencyFor(row) {
  const missingSignals = [row.derivedHazard.level === 'unknown' ? 'danger' : '', row.derivedEvidence.level === 'insufficient' ? 'evidence' : '', row.derivedExposure.level === 'unknown' ? 'exposure' : ''].filter(Boolean);
  const familyUnlinked = rawAuthorities(row.raw).some((item) => item.assessmentScope === 'family' && !(item.coveredCodes ?? []).some((code) => String(code).toUpperCase() === String(row.raw.code).toUpperCase()));
  const reasons = [...row.derivedHazard.reasons, ...row.derivedEvidence.reasons, ...row.derivedExposure.reasons];
  if (familyUnlinked) { missingSignals.push('family_scope'); reasons.push('Profil familial sans rattachement individuel explicite.'); }
  return { sufficient: missingSignals.length === 0, missingSignals: unique(missingSignals), availableSignals: ['danger', 'evidence', 'exposure'].filter((signal) => !missingSignals.includes(signal)), reasons: unique(reasons) };
}

async function main() {
  const engine = await loadCurrentEngine();
  const master = read(MASTER).profiles;
  const catalog = new Map(read(CATALOG).entries.map((item) => [item.code, item]));
  const rows = master.map((raw) => {
    const canonicalName = catalog.get(raw.code)?.names?.en ?? raw.names?.en ?? raw.code;
    const adapted = adaptProfile(raw, canonicalName);
    adapted.profile.exposureAssessments = raw.exposureAssessments ?? [];
    const derivedHazard = engine.deriveHazardAssessment(adapted.profile);
    const derivedEvidence = engine.deriveEvidenceAssessment(adapted.profile);
    const derivedExposure = engine.deriveExposureAssessment(adapted.profile);
    const sufficiency = engine(adapted.profile);
    return { raw, profile: adapted.profile, derivedHazard, derivedEvidence, derivedExposure, result: sufficiency };
  });

  const withEffects = rows.filter((row) => rawEffects(row.raw).length);
  const profileFieldCoverage = {
    datasetProfiles: rows.length,
    potentialEffects: count(rows, (row) => rawEffects(row.raw).length > 0),
    potentialEffectsWithSeverity: count(rows, (row) => rawEffects(row.raw).some((effect) => effect.severity != null)),
    potentialEffectsWithExploitableSeverity: count(rows, (row) => rawEffects(row.raw).some((effect) => VALID_SEVERITY.has(effect.severity))),
    potentialEffectsWithEvidenceLevel: count(rows, (row) => rawEffects(row.raw).some((effect) => effect.evidenceLevel != null)),
    potentialEffectsWithExploitableEvidenceLevel: count(rows, (row) => rawEffects(row.raw).some((effect) => VALID_EVIDENCE.has(effect.evidenceLevel))),
    potentialEffectsAppliesToAdditive: count(rows, (row) => rawEffects(row.raw).some((effect) => effect.appliesTo === 'additive')),
    potentialEffectsAppliesToFamily: count(rows, (row) => rawEffects(row.raw).some((effect) => effect.appliesTo === 'family')),
    potentialEffectsAppliesToContaminant: count(rows, (row) => rawEffects(row.raw).some((effect) => effect.appliesTo === 'contaminant')),
    potentialEffectsAppliesToMetabolite: count(rows, (row) => rawEffects(row.raw).some((effect) => effect.appliesTo === 'metabolite')),
    potentialEffectsAppliesToDegradationProduct: count(rows, (row) => rawEffects(row.raw).some((effect) => effect.appliesTo === 'degradation_product')),
    authorityEvaluations: count(rows, (row) => rawAuthorities(row.raw).length > 0),
    efsa: count(rows, (row) => rawAuthorities(row.raw).some((item) => isAuthority(item, 'EFSA'))),
    jecfa: count(rows, (row) => rawAuthorities(row.raw).some((item) => isAuthority(item, 'JECFA'))),
    efsaAndJecfa: count(rows, (row) => { const names = new Set(authorities(row.raw).map((name) => name.toUpperCase())); return names.has('EFSA') && names.has('JECFA'); }),
    profileEvidenceLevel: count(rows, (row) => row.raw.evidenceLevel != null),
  };
  const hazardReasons = Object.fromEntries(unique(withEffects.map((row) => classifyHazard(row.raw, row.derivedHazard))).map((reason) => [reason, count(withEffects, (row) => classifyHazard(row.raw, row.derivedHazard) === reason)]));
  const evidenceReasons = Object.fromEntries(unique(rows.map((row) => classifyEvidence(row.raw, row.derivedEvidence))).map((reason) => [reason, count(rows, (row) => classifyEvidence(row.raw, row.derivedEvidence) === reason)]));
  const relevantHazardIgnored = withEffects.filter((row) => rawEffects(row.raw).some((effect) => effect.appliesTo === 'additive') && row.derivedHazard.level === 'unknown');
  const relevantEvidenceIgnored = rows.filter((row) => (rawEffects(row.raw).some((effect) => effect.appliesTo === 'additive' && effect.evidenceLevel && effect.evidenceLevel !== 'insufficient') || (row.raw.evidenceLevel && row.raw.evidenceLevel !== 'insufficient')) && row.derivedEvidence.level === 'insufficient');
  const matrixGuardRows = rows.filter((row) => row.result.riskLevel === 'insufficient_data' && sufficiencyFor(row).sufficient);
  const exposureCodes = ['E161G', 'E491', 'E493', 'E494', 'E495', 'E959'];
  const explicitExposureProfiles = exposureCodes.map((code) => {
    const row = rows.find((item) => item.raw.code === code);
    if (!row) return { code, missing: true };
    const sufficiency = sufficiencyFor(row);
    const blockingReasons = [...sufficiency.missingSignals];
    if (row.result.riskLevel === 'insufficient_data' && sufficiency.sufficient) blockingReasons.push('classification_matrix_no_matching_rule');
    return { code, ...rawSnapshot(row.raw), derivedHazard: row.derivedHazard, derivedEvidence: row.derivedEvidence, derivedExposure: row.derivedExposure, sufficiency, finalEvaluation: row.result, finalRisk: row.result.riskLevel, blockingReasons };
  });
  const pick = (predicate) => rows.find(predicate);
  const representative = {
    serious: pick((row) => rawEffects(row.raw).some((effect) => effect.severity === 'serious')),
    moderate: pick((row) => rawEffects(row.raw).some((effect) => effect.severity === 'moderate')),
    low: pick((row) => rawEffects(row.raw).some((effect) => effect.severity === 'low')),
    strongEvidence: pick((row) => rawEffects(row.raw).some((effect) => effect.evidenceLevel === 'strong')),
    moderateEvidence: pick((row) => rawEffects(row.raw).some((effect) => effect.evidenceLevel === 'moderate')),
    efsaAndJecfa: pick((row) => { const names = new Set(authorities(row.raw)); return names.has('EFSA') && names.has('JECFA'); }),
    individualAssessment: pick((row) => rawAuthorities(row.raw).some((item) => item.assessmentScope === 'individual')),
    familyAssessment: pick((row) => rawAuthorities(row.raw).some((item) => item.assessmentScope === 'family')),
  };
  const sample = Object.fromEntries(Object.entries(representative).map(([key, row]) => [key, row ? { code: row.raw.code, name: row.raw.names?.en ?? row.raw.code, ...rawSnapshot(row.raw), derivedHazard: row.derivedHazard, derivedEvidence: row.derivedEvidence, derivedExposure: row.derivedExposure } : null]));
  const report = {
    schemaVersion: '1.0', auditVersion: '16C-v1', generatedAt: new Date().toISOString(), mode: 'offline-audit-only', engineSource: 'src/features/boycott/additiveRiskEngine.ts', masterSource: 'scripts/data/additives-scientific-master-v2-exposure.json',
    profileFieldCoverage,
    hazardEngineFieldUsage: { reads: ['potentialEffects via allEffects()', 'effect.appliesTo', 'effect.severity', 'profile.assessment.severity', 'profile.evidenceLevel for none_identified fallback', 'healthEffects legacy fallback'], excludes: ['effect.evidenceLevel for hazard level', 'effect.evidenceContext', 'effect.authority', 'effect.scope', 'assessmentScope directly', 'authority conclusion directly'] },
    evidenceEngineFieldUsage: { reads: ['profile.evidenceLevel', 'profile.assessment.evidenceStrength', 'potentialEffects via allEffects()', 'effect.evidenceLevel', 'effect.appliesTo', 'authorityEvaluations.assessmentScope', 'authorityEvaluations.coveredCodes'], excludes: ['authorityEvaluations.authority for evidence strength', 'authorityEvaluations.conclusion', 'effect.evidenceContext', 'assessmentScope except family guard'] },
    hazardBlockingReasonCounts: hazardReasons,
    evidenceBlockingReasonCounts: evidenceReasons,
    profilesWithRelevantHazardDataIgnored: relevantHazardIgnored.map((row) => ({ code: row.raw.code, name: row.raw.names?.en ?? row.raw.code, rawPotentialEffects: effectSummary(row.raw), derivedHazard: row.derivedHazard, classification: classifyHazard(row.raw, row.derivedHazard), category: classifyHazard(row.raw, row.derivedHazard) === 'CORRECTLY_CONSUMED' ? 'CORRECT_SAFETY_GUARD' : 'INTEGRATION_BUG' })),
    profilesWithRelevantEvidenceDataIgnored: relevantEvidenceIgnored.map((row) => ({ code: row.raw.code, name: row.raw.names?.en ?? row.raw.code, rawProfileEvidenceLevel: row.raw.evidenceLevel ?? null, effectEvidenceLevels: rawEffects(row.raw).map((effect) => effect.evidenceLevel ?? null), derivedEvidence: row.derivedEvidence, classification: classifyEvidence(row.raw, row.derivedEvidence), category: 'INTEGRATION_BUG' })),
    explicitExposureProfiles,
    representativeSamples: sample,
    interpretation: { integrationBugCount: relevantHazardIgnored.length + relevantEvidenceIgnored.length, normalizationGapCount: count(rows, (row) => classifyHazard(row.raw, row.derivedHazard) === 'SEVERITY_NOT_NORMALIZED' || classifyEvidence(row.raw, row.derivedEvidence) === 'EVIDENCE_DATA_PRESENT_BUT_UNSUPPORTED_FORMAT'), scientificDataInsufficientCount: count(rows, (row) => classifyEvidence(row.raw, row.derivedEvidence) === 'TRULY_INSUFFICIENT_EVIDENCE'), correctSafetyGuardCount: count(withEffects, (row) => ['ONLY_FAMILY_EFFECTS', 'ONLY_CONTAMINANT_EFFECTS', 'ONLY_METABOLITE_EFFECTS', 'ONLY_DEGRADATION_PRODUCT_EFFECTS', 'NO_EFFECT_FOR_ADDITIVE_ITSELF'].includes(classifyHazard(row.raw, row.derivedHazard))), matrixConservativeGuardCount: matrixGuardRows.length, matrixConservativeGuardCodes: matrixGuardRows.map((row) => row.raw.code), mainCauseOfGlobalInsufficientData: 'Les axes ne sont pas tous insuffisants : les 6 profils à exposition explicite ont des axes suffisants mais aucune branche de la matrice finale ne couvre leur combinaison. Les autres profils restent gris lorsqu’un axe manque réellement, principalement l’exposition explicite ou la preuve exploitable.' },
    noRulesModified: true,
  };
  save(OUTPUT, report);
  console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), profileFieldCoverage, hazardReasons, evidenceReasons, relevantHazardIgnored: relevantHazardIgnored.length, relevantEvidenceIgnored: relevantEvidenceIgnored.length }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.stack ?? error.message ?? String(error)); process.exitCode = 1; });
