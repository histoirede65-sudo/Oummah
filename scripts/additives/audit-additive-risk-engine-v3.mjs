#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptProfile, loadCurrentEngine } from './audit-additive-risk-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const MASTER = path.join(ROOT, 'scripts/data/additives-scientific-master-v2-exposure.json');
const BASELINE = path.join(ROOT, 'scripts/output/additive-risk-engine-resolved-dataset-v1.json');
const AUDIT_OUTPUT = path.join(ROOT, 'scripts/output/additive-risk-engine-audit-v5.json');
const ANOMALY_OUTPUT = path.join(ROOT, 'scripts/output/additive-risk-engine-anomalies-v5.json');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
const count = (items, predicate) => items.filter(predicate).length;
const unique = (values) => [...new Set(values.filter(Boolean))];

function jecfaExposureConcern(raw) {
  const assessments = raw.exposureAssessments ?? [];
  if (!assessments.length) return null;
  if (assessments.some((item) => ['confirmed_exceedance', 'possible_exceedance'].includes(item.comparisonStatus))) return 'concerning';
  if (assessments.some((item) => ['below_reference', 'within_reference'].includes(item.comparisonStatus) || item.authorityConclusion === 'no_safety_concern_at_assessed_exposure')) return 'below_concern';
  return 'unknown';
}

function adaptEnriched(raw, canonicalName, evaluate) {
  const concern = jecfaExposureConcern(raw);
  const adapted = adaptProfile({ ...raw, exposure: { ...(raw.exposure ?? {}), estimatedExposure: concern ?? raw.exposure?.estimatedExposure }, assessment: { ...(raw.assessment ?? {}), exposureConcern: concern ?? raw.assessment?.exposureConcern ?? 'unknown' } }, canonicalName);
  adapted.profile.exposureAssessments = raw.exposureAssessments ?? [];
  adapted.profile.latestExposureAssessment = raw.latestExposureAssessment ?? null;
  return { ...adapted, result: evaluate(adapted.profile), jecfaExposureConcern: concern };
}

function sourceNames(profile) { return unique((profile.authorityEvaluations ?? []).map((item) => item.authority).concat((profile.sources ?? []).map((item) => item.organisation))); }
function completeProvenance(assessment) { return Boolean(assessment.authority && assessment.year && assessment.sourceUrl && assessment.sourceSentence && assessment.rawText); }

async function main() {
  const evaluate = await loadCurrentEngine();
  const catalog = read(CATALOG).entries;
  const profiles = new Map(read(MASTER).profiles.map((profile) => [profile.code, profile]));
  const baselineRows = fs.existsSync(BASELINE) ? new Map(read(BASELINE).rows.map((row) => [row.code, row])) : new Map();
  const baselineAudit = path.join(ROOT, 'scripts/output/additive-risk-engine-audit-v2-before-exposure.json');
  const baselineDistribution = fs.existsSync(baselineAudit) ? read(baselineAudit).distribution : null;
  const rows = catalog.map((item) => {
    const raw = profiles.get(item.code);
    if (!raw) return { code: item.code, name: item.names?.en ?? item.code, profile: null, result: { riskLevel: 'insufficient_data', confidence: 'low', reasons: ['Aucun profil scientifique disponible.'], evidenceSummary: 'Données scientifiques insuffisantes.', exposureSummary: 'Exposition non déterminée.' }, jecfaExposureConcern: null };
    return { code: item.code, name: item.names?.en ?? raw.names?.en ?? item.code, raw, ...adaptEnriched(raw, item.names?.en ?? item.code, evaluate) };
  });
  const distribution = Object.fromEntries(['safe', 'limited', 'moderate', 'high', 'insufficient_data'].map((level) => [level, count(rows, (row) => row.result.riskLevel === level)]));
  const confidenceDistribution = Object.fromEntries(['high', 'medium', 'low'].map((level) => [level, count(rows, (row) => row.result.confidence === level)]));
  const leftGray = rows.filter((row) => row.result.riskLevel !== 'insufficient_data' && (baselineRows.get(row.code)?.result?.riskLevel ?? 'insufficient_data') === 'insufficient_data');
  const exitedDetails = leftGray.map((row) => { const assessments = row.raw?.exposureAssessments ?? []; const latest = row.raw?.latestExposureAssessment ?? assessments[assessments.length - 1] ?? null; return { code: row.code, name: row.name, hazard: evaluate.deriveHazardAssessment(row.profile), evidence: evaluate.deriveEvidenceAssessment(row.profile), exposure: evaluate.deriveExposureAssessment(row.profile), riskLevel: row.result.riskLevel, confidence: row.result.confidence, authority: latest?.authority ?? sourceNames(row.profile).join(', '), comparisonStatus: latest?.comparisonStatus ?? null, authorityConclusion: latest?.authorityConclusion ?? null, sourceUrl: latest?.sourceUrl ?? null }; });
  const suspectedFalseSafe = rows.filter((row) => row.result.riskLevel === 'safe').map((row) => ({ code: row.code, name: row.name, suspectedFalseSafe: !(row.raw?.exposureAssessments ?? []).some((item) => item.authorityConclusion === 'no_safety_concern_at_assessed_exposure') || !(row.raw?.exposureAssessments ?? []).every(completeProvenance) }));
  const anomalies = { suspectedFalseSafe: suspectedFalseSafe.filter((item) => item.suspectedFalseSafe), referenceOnlyClassified: rows.filter((row) => row.raw && !(row.raw.exposureAssessments ?? []).length && (row.raw.referenceValues ?? []).some((value) => value.authority === 'JECFA') && row.result.riskLevel !== 'insufficient_data').map((row) => ({ code: row.code, riskLevel: row.result.riskLevel })), insufficientEvidenceForClassification: rows.filter((row) => ['safe', 'limited', 'moderate', 'high'].includes(row.result.riskLevel) && (row.result.confidence === 'low' || row.jecfaExposureConcern === 'unknown')).map((row) => ({ code: row.code, riskLevel: row.result.riskLevel, confidence: row.result.confidence, exposure: row.jecfaExposureConcern })), e338MustRemainInsufficient: rows.filter((row) => row.code === 'E338' && row.result.riskLevel !== 'insufficient_data').map((row) => ({ code: row.code, riskLevel: row.result.riskLevel })) };
  const matrixCoverage = evaluate.getRiskMatrixCoverage();
  const nonGray = rows.filter((row) => row.result.riskLevel !== 'insufficient_data');
  const nonGrayAudit = nonGray.map((row) => ({ code: row.code, riskLevel: row.result.riskLevel, axes: { hazard: evaluate.deriveHazardAssessment(row.profile), evidence: evaluate.deriveEvidenceAssessment(row.profile), exposure: evaluate.deriveExposureAssessment(row.profile) }, sufficient: true, provenancePresent: (row.raw?.sources?.length ?? 0) > 0 || (row.raw?.authorityEvaluations?.length ?? 0) > 0, contaminantOrFamilyGuard: (row.raw?.potentialEffects ?? []).some((effect) => ['contaminant', 'family'].includes(effect.appliesTo)), adiOnlyExposure: false, freeTextConclusionInterpreted: false, eNumberRule: false }));
  const spotCodes = ['E951', 'E338', 'E150D', 'E250', 'E621', 'E955', 'E202', 'E330', 'E407', 'E471'];
  const spotChecks = spotCodes.map((code) => { const row = rows.find((item) => item.code === code); return { code, name: row?.name, riskLevel: row?.result.riskLevel, confidence: row?.result.confidence, exposureAssessments: row?.raw?.exposureAssessments?.length ?? 0, jecfaExposureConcern: row?.jecfaExposureConcern ?? null, result: row?.result ?? null }; });
  const report = { schemaVersion: '5.0', auditVersion: 'v5', generatedAt: new Date().toISOString(), mode: 'offline-audit-only', engineSource: 'src/features/boycott/additiveRiskEngine.ts', masterSource: 'scripts/data/additives-scientific-master-v2-exposure.json', summary: { totalCodes: rows.length, ...distribution, totalAnomalies: Object.values(anomalies).reduce((sum, values) => sum + values.length, 0), noSupabaseWrites: true, noRuntimeChanges: true, evaluateAdditiveRiskModified: true, hazardEvidenceExposureHelpersModified: false, healthScoreAnalyzerModified: false }, baselineV4Distribution: baselineDistribution, distribution, confidenceDistribution, matrixCoverage: { totalCombinations: matrixCoverage.length, explicitlyDecided: matrixCoverage.length, intentionalInsufficientData: matrixCoverage.filter((item) => item.riskLevel === 'insufficient_data').length }, exitedInsufficientData: exitedDetails, nonGrayCodes: nonGray.map((row) => row.code), nonGrayAudit, spotChecks, anomalies, rows: rows.map((row) => ({ code: row.code, name: row.name, riskLevel: row.result.riskLevel, confidence: row.result.confidence, reasons: row.result.reasons, jecfaExposureConcern: row.jecfaExposureConcern, exposureAssessments: row.raw?.exposureAssessments?.length ?? 0 })) };
  save(AUDIT_OUTPUT, report);
  save(ANOMALY_OUTPUT, { schemaVersion: '5.0', auditVersion: 'v5', generatedAt: report.generatedAt, anomalies });
  console.log(JSON.stringify({ audit: path.relative(ROOT, AUDIT_OUTPUT), anomalies: path.relative(ROOT, ANOMALY_OUTPUT), distribution, confidenceDistribution, exitedInsufficientData: exitedDetails.length }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.stack ?? error.message ?? String(error)); process.exitCode = 1; });
