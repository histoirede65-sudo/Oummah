#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const MASTER = path.join(ROOT, 'scripts/data/additives-scientific-master-v1.json');
const EXISTING = path.join(ROOT, 'scripts/output/food-additive-science-proposed-top25.json');
const ENGINE = path.join(ROOT, 'src/features/boycott/additiveRiskEngine.ts');
const AUDIT_OUTPUT = path.join(ROOT, 'scripts/output/additive-risk-engine-audit-v1.json');
const ANOMALY_OUTPUT = path.join(ROOT, 'scripts/output/additive-risk-engine-anomalies-v1.json');
function arg(name, fallback) { const index = process.argv.indexOf(name); return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback; }

const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); };
const rel = (file) => path.relative(ROOT, file);
const count = (items, predicate) => items.filter(predicate).length;
const unique = (values) => [...new Set(values.filter(Boolean))];
const severityRank = { none: 0, low: 1, moderate: 2, serious: 3 };
const evidenceRank = { insufficient: 0, limited: 1, moderate: 2, strong: 3 };

async function loadCurrentEngine() {
  const original = fs.readFileSync(ENGINE, 'utf8');
  const withoutImport = original.replace(/^import\s+\{[^\n]+\}\s+from\s+'\.\/foodAdditiveScienceRepository';\r?\n/m, '');
  const compiled = ts.transpileModule(withoutImport, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  const evaluate = module.evaluateAdditiveRisk;
  evaluate.deriveHazardAssessment = module.deriveHazardAssessment;
  evaluate.deriveEvidenceAssessment = module.deriveEvidenceAssessment;
  evaluate.deriveExposureAssessment = module.deriveExposureAssessment;
  evaluate.getRiskMatrixCoverage = module.getRiskMatrixCoverage;
  return evaluate;
}

function source(record) {
  return { sourceId: record.sourceId ?? `existing-${record.code}`, organisation: record.organisation ?? 'Official source', sourceType: record.sourceType ?? 'official_information', title: record.title ?? 'Scientific record', url: record.url || '', retrievedAt: record.retrievedAt ?? '2026-09-30', fieldsSupported: record.fieldsSupported ?? [] };
}

function effectsFrom(profile) {
  return (profile.potentialEffects ?? []).map((effect) => ({ effect: effect.effect, severity: effect.severity ?? 'none', evidenceLevel: effect.evidenceLevel ?? 'insufficient', appliesTo: effect.appliesTo ?? 'additive', notes: effect.evidenceContext }));
}

function adaptProfile(raw, canonicalName) {
  const isMaster = raw.completeness && typeof raw.completeness === 'object';
  const effects = effectsFrom(raw);
  const references = raw.referenceValues ?? [];
  const conclusions = (raw.authorityEvaluations ?? []).map((item) => item.conclusion).filter((item) => typeof item === 'string' && item.trim());
  const maxSeverity = effects.reduce((best, effect) => severityRank[effect.severity] > severityRank[best] ? effect.severity : best, 'none');
  const maxEvidence = effects.reduce((best, effect) => evidenceRank[effect.evidenceLevel] > evidenceRank[best] ? effect.evidenceLevel : best, raw.evidenceLevel ?? 'insufficient');
  const exposureRaw = raw.exposure?.estimatedExposure ?? raw.exposure?.exposureConcern ?? raw.assessment?.exposureConcern;
  const exposureConcern = ['none', 'unlikely', 'possible', 'concerning', 'unknown'].includes(exposureRaw) ? exposureRaw : 'unknown';
  const sourceRecords = (raw.sources ?? []).map(source);
  const profile = {
    code: raw.code,
    names: raw.names ?? { en: canonicalName },
    aliases: raw.aliases ?? [],
    function: raw.function,
    regulatoryStatusDetail: raw.regulatoryStatus ? { eu: raw.regulatoryStatus.eu, notes: raw.regulatoryStatus.notes } : undefined,
    authorityEvaluations: (raw.authorityEvaluations ?? []).map((item) => ({ ...item, conclusion: item.conclusion ?? '' })),
    exposure: { ...(raw.exposure ?? {}), estimatedExposure: exposureConcern },
    potentialEffects: effects,
    restrictions: raw.restrictions ?? [],
    evidenceLevel: raw.evidenceLevel ?? maxEvidence,
    functionClasses: raw.functionClasses ?? [],
    assessment: raw.assessment ?? { severity: maxSeverity, evidenceStrength: maxEvidence, exposureConcern, classification: 'insufficient_data', conclusion: conclusions.join(' '), sources: sourceRecords },
    scientificSummary: raw.scientificSummary ?? conclusions.join(' '),
    healthEffects: raw.healthEffects ?? [],
    sensitivePopulations: raw.sensitivePopulations ?? [],
    exposureAssessment: raw.exposureAssessment ?? { adiDisplay: references.map((value) => value.rawText).filter(Boolean).join('; ') || undefined, exposureConclusion: exposureConcern, sourceIds: sourceRecords.map((item) => item.sourceId) },
    assessmentHistory: raw.assessmentHistory ?? [],
    sources: sourceRecords,
    needsScientificReview: Boolean(raw.needsScientificReview),
    dataVersion: raw.dataVersion ?? 'audit-1.0',
    completeness: isMaster ? (raw.completeness.complete ? 'complete' : 'partial') : (raw.completeness ?? 'partial'),
  };
  return { profile, references, effects };
}

function profileStatus(raw) {
  if (!raw) return 'missing';
  if (raw.completeness && typeof raw.completeness === 'object') return raw.completeness.complete ? 'complete' : 'incomplete';
  return (raw.needsScientificReview || raw.needs_scientific_review) ? 'incomplete' : 'complete';
}

function resolveRawProfile(existing, generated) {
  if (!existing) return generated;
  if (!generated) return existing;
  const existingIncomplete = Boolean(existing.needs_scientific_review || existing.needsScientificReview || existing.scientific_classification === 'insufficient_data');
  return existingIncomplete && !generated.needsScientificReview && generated.completeness?.complete ? generated : existing;
}

function severeEffects(effects) { return effects.filter((effect) => effect.severity === 'serious').map((effect) => ({ effect: effect.effect, appliesTo: effect.appliesTo, evidenceLevel: effect.evidenceLevel })); }
function authorities(profile) { return unique((profile.authorityEvaluations ?? []).map((item) => item.authority).concat(profile.sources.map((item) => item.organisation))); }
function hasFamily(profile) { return (profile.authorityEvaluations ?? []).some((item) => item.assessmentScope === 'family' || item.assessmentScope === 'group'); }
function isSecondary(effect) { return effect.appliesTo === 'contaminant' || effect.appliesTo === 'metabolite' || effect.appliesTo === 'degradation_product'; }
function referenceStatus(reference) { return String(reference.type ?? '').toLowerCase(); }

function auditHigh(row) {
  const additiveSerious = row.effects.some((effect) => effect.appliesTo === 'additive' && effect.severity === 'serious');
  const strong = row.effects.some((effect) => effect.appliesTo === 'additive' && effect.evidenceLevel === 'strong');
  const concerning = row.profile.assessment.exposureConcern === 'concerning';
  const officialRecommendation = row.result.reasons.some((reason) => /recommandation officielle/i.test(reason));
  return { code: row.code, name: row.canonicalName, reasons: row.result.reasons, severeEffects: severeEffects(row.effects), evidenceLevel: row.profile.evidenceLevel, exposure: row.profile.assessment.exposureConcern, authorities: authorities(row.profile), referenceValues: row.references, sourceCount: row.profile.sources.length, suspectedOverclassification: !(officialRecommendation || (additiveSerious && strong && concerning)), familyOnly: hasFamily(row.profile) && !row.effects.some((effect) => effect.appliesTo === 'additive') };
}

function auditSafe(row) {
  const reassuring = row.profile.authorityEvaluations?.some((item) => /no concern|no particular|without concern|aucune pr[ée]occupation|pas de pr[ée]occupation/i.test(item.conclusion ?? ''));
  const documented = row.profile.sources.length > 0 && row.profile.assessment.exposureConcern !== 'unknown';
  return { code: row.code, name: row.canonicalName, reasons: row.result.reasons, authorities: authorities(row.profile), sourceCount: row.profile.sources.length, exposure: row.profile.assessment.exposureConcern, potentialEffects: row.effects.length, suspectedFalseSafe: !reassuring || !documented || row.effects.length === 0 };
}

function buildAnomalies(rows) {
  const high = rows.filter((row) => row.result.riskLevel === 'high').map(auditHigh);
  const safe = rows.filter((row) => row.result.riskLevel === 'safe').map(auditSafe);
  const suspectedUnderclassification = rows.filter((row) => row.result.riskLevel === 'limited' && row.effects.some((effect) => effect.appliesTo === 'additive' && effect.severity === 'serious' && effect.evidenceLevel === 'strong') && row.profile.assessment.exposureConcern === 'concerning').map((row) => ({ code: row.code, name: row.canonicalName, riskLevel: row.result.riskLevel, reasons: row.result.reasons }));
  const insufficientEvidenceForClassification = rows.filter((row) => ['limited', 'moderate', 'high', 'safe'].includes(row.result.riskLevel) && (row.profile.evidenceLevel === 'insufficient' || row.profile.assessment.exposureConcern === 'unknown')).map((row) => ({ code: row.code, riskLevel: row.result.riskLevel, evidenceLevel: row.profile.evidenceLevel, exposure: row.profile.assessment.exposureConcern }));
  const familyScopeConcern = rows.filter((row) => row.profile && hasFamily(row.profile)).map((row) => ({ code: row.code, riskLevel: row.result.riskLevel, familyOnly: !row.effects.some((effect) => effect.appliesTo === 'additive'), assessmentScopes: row.profile.authorityEvaluations.filter((item) => item.assessmentScope).map((item) => item.assessmentScope) }));
  const contaminantScopeConcern = rows.filter((row) => row.effects.some(isSecondary) && (row.result.riskLevel === 'high' || row.effects.filter(isSecondary).some((effect) => effect.severity === 'serious'))).map((row) => ({ code: row.code, riskLevel: row.result.riskLevel, effects: row.effects.filter(isSecondary) }));
  const groupAdiConcern = rows.filter((row) => row.references.some((reference) => reference.type === 'group_ADI' || reference.scope === 'group')).map((row) => ({ code: row.code, riskLevel: row.result.riskLevel, groupValues: row.references.filter((reference) => reference.type === 'group_ADI' || reference.scope === 'group') }));
  return { suspectedFalseSafe: safe.filter((item) => item.suspectedFalseSafe), suspectedOverclassification: high.filter((item) => item.suspectedOverclassification), suspectedUnderclassification, insufficientEvidenceForClassification, familyScopeConcern, contaminantScopeConcern, groupAdiConcern };
}

export { adaptProfile, profileStatus, resolveRawProfile, loadCurrentEngine };

async function main() {
  const evaluateAdditiveRisk = await loadCurrentEngine();
  const catalog = read(CATALOG).entries;
  const masterProfiles = new Map(read(MASTER).profiles.map((profile) => [profile.code, profile]));
  const existingRecords = new Map(read(EXISTING).records.map((record) => [record.code, record]));
  const rows = [];
  for (const item of catalog) {
    // A complete existing record wins over an incomplete generated replacement (E306).
    const raw = resolveRawProfile(existingRecords.get(item.code), masterProfiles.get(item.code));
    const status = profileStatus(raw);
    if (!raw) {
      rows.push({ code: item.code, canonicalName: item.names?.en ?? item.code, profileStatus: status, result: { riskLevel: 'insufficient_data', confidence: 'low', reasons: ['Aucun profil scientifique disponible.'], evidenceSummary: 'Données scientifiques insuffisantes.', exposureSummary: 'Exposition non déterminée.' }, profile: null, effects: [], references: [] });
      continue;
    }
    const { profile, effects, references } = adaptProfile(raw, item.names?.en ?? item.code);
    rows.push({ code: item.code, canonicalName: item.names?.en ?? profile.names?.en ?? item.code, profileStatus: status, result: evaluateAdditiveRisk(profile), profile, effects, references });
  }
  const distribution = Object.fromEntries(['safe', 'limited', 'moderate', 'high', 'insufficient_data'].map((level) => [level, count(rows, (row) => row.result.riskLevel === level)]));
  const confidenceDistribution = Object.fromEntries(['high', 'medium', 'low'].map((level) => [level, count(rows, (row) => row.result.confidence === level)]));
  const classificationByCompleteness = Object.fromEntries(['complete', 'incomplete', 'missing'].map((status) => [status, Object.fromEntries(['safe', 'limited', 'moderate', 'high', 'insufficient_data'].map((level) => [level, count(rows, (row) => row.profileStatus === status && row.result.riskLevel === level)]))]));
  const highAudit = rows.filter((row) => row.result.riskLevel === 'high').map(auditHigh);
  const safeAudit = rows.filter((row) => row.result.riskLevel === 'safe').map(auditSafe);
  const limitedModerateAudit = rows.filter((row) => row.result.riskLevel === 'limited' || row.result.riskLevel === 'moderate').map((row) => ({ code: row.code, name: row.canonicalName, riskLevel: row.result.riskLevel, reasons: row.result.reasons, effects: row.effects, evidenceLevel: row.profile?.evidenceLevel ?? 'insufficient', exposure: row.profile?.assessment?.exposureConcern ?? 'unknown', suspectedUnderclassification: row.result.riskLevel === 'limited' && row.effects.some((effect) => effect.severity === 'serious' && effect.evidenceLevel === 'strong') && row.profile?.assessment?.exposureConcern === 'concerning', insufficientEvidenceForClassification: row.profile?.evidenceLevel === 'insufficient' || row.profile?.assessment?.exposureConcern === 'unknown' }));
  const familyAssessmentAudit = rows.filter((row) => row.profile && hasFamily(row.profile)).map((row) => ({ code: row.code, name: row.canonicalName, riskLevel: row.result.riskLevel, assessmentScopes: row.profile.authorityEvaluations.filter((item) => item.assessmentScope).map((item) => ({ scope: item.assessmentScope, coveredCodes: item.coveredCodes ?? [] })), familyOnly: !row.effects.some((effect) => effect.appliesTo === 'additive') }));
  const contaminantAudit = rows.filter((row) => row.effects.some(isSecondary)).map((row) => ({ code: row.code, name: row.canonicalName, riskLevel: row.result.riskLevel, secondaryEffects: row.effects.filter(isSecondary), highFromSecondaryOnly: row.result.riskLevel === 'high' && !row.effects.some((effect) => effect.appliesTo === 'additive' && effect.severity === 'serious') }));
  const groupAdiAudit = rows.filter((row) => row.references.some((reference) => reference.type === 'group_ADI' || reference.scope === 'group')).map((row) => ({ code: row.code, name: row.canonicalName, riskLevel: row.result.riskLevel, groupValues: row.references.filter((reference) => reference.type === 'group_ADI' || reference.scope === 'group') }));
  const twoAuthorityRows = rows.filter((row) => row.profile && new Set(authorities(row.profile).map((value) => value.toLowerCase())).size >= 2);
  const anomalies = buildAnomalies(rows);
  const spotCodes = ['E150D', 'E338', 'E621', 'E951', 'E955', 'E202', 'E330', 'E407', 'E471', 'E250'];
  const spotChecks = spotCodes.map((code) => rows.find((row) => row.code === code)).filter(Boolean).map((row) => ({ code: row.code, name: row.canonicalName, profileStatus: row.profileStatus, hazard: evaluateAdditiveRisk.deriveHazardAssessment(row.profile), evidence: evaluateAdditiveRisk.deriveEvidenceAssessment(row.profile), exposure: evaluateAdditiveRisk.deriveExposureAssessment(row.profile), riskEvaluation: row.result }));
  const report = {
    schemaVersion: '2.0', auditVersion: 'v2', generatedAt: new Date().toISOString(), mode: 'offline-audit-only', engineSource: rel(ENGINE),
    summary: { totalCodes: rows.length, evaluatedCodes: rows.length, safeCount: distribution.safe, limitedCount: distribution.limited, moderateCount: distribution.moderate, highCount: distribution.high, insufficientDataCount: distribution.insufficient_data, totalAnomalies: Object.values(anomalies).reduce((sum, values) => sum + values.length, 0), noSupabaseWrites: true, noRuntimeChanges: true },
    distribution: Object.fromEntries(Object.entries(distribution).map(([key, value]) => [key, { count: value, percent: Number((value / rows.length * 100).toFixed(1)) }])),
    confidenceDistribution,
    classificationByCompleteness,
    highAudit,
    safeAudit,
    limitedModerateAudit,
    familyAssessmentAudit,
    contaminantAudit,
    groupAdiAudit,
    twoAuthorityAudit: { twoAuthorityProfiles: twoAuthorityRows.length, twoAuthorityHighConfidence: count(twoAuthorityRows, (row) => row.result.confidence === 'high'), twoAuthorityMediumConfidence: count(twoAuthorityRows, (row) => row.result.confidence === 'medium'), profiles: twoAuthorityRows.map((row) => ({ code: row.code, riskLevel: row.result.riskLevel, confidence: row.result.confidence, authorities: authorities(row.profile), reasons: row.result.reasons })) },
    spotChecks,
    missingScienceCodes: rows.filter((row) => row.profileStatus === 'missing' || row.profileStatus === 'incomplete').map((row) => ({ code: row.code, name: row.canonicalName, profileStatus: row.profileStatus, riskLevel: row.result.riskLevel })),
  };
  const auditOutput = path.resolve(arg('--output', AUDIT_OUTPUT));
  const anomalyOutput = path.resolve(arg('--anomalies-output', ANOMALY_OUTPUT));
  save(auditOutput, report);
  save(anomalyOutput, { schemaVersion: '2.0', auditVersion: 'v2', generatedAt: report.generatedAt, anomalies });
  save(path.join(ROOT, 'scripts/output/additive-risk-engine-resolved-dataset-v1.json'), { schemaVersion: '1.0', generatedAt: report.generatedAt, rows: rows.map(({ profile, effects, references, ...row }) => ({ ...row, effects, references })) });
  console.log(JSON.stringify({ audit: rel(auditOutput), anomalies: rel(anomalyOutput), summary: report.summary, distribution, confidenceDistribution, highCodes: highAudit.map((item) => item.code), safeCodes: safeAudit.map((item) => item.code), missingOrIncomplete: report.missingScienceCodes.length }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => { console.error(error.stack ?? error.message ?? String(error)); process.exitCode = 1; });
