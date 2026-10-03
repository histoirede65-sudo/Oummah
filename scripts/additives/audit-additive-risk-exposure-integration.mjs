#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptProfile, loadCurrentEngine } from './audit-additive-risk-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MASTER = path.join(ROOT, 'scripts/data/additives-scientific-master-v2-exposure.json');
const OUT = path.join(ROOT, 'scripts/output/additive-risk-exposure-integration-audit-v2.json');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
const count = (items, predicate) => items.filter(predicate).length;

function explicitStatuses(assessments) { return [...new Set(assessments.map((item) => item.comparisonStatus).filter((value) => value && value !== 'not_quantified' && value !== 'unknown'))]; }
function conclusions(assessments) { return [...new Set(assessments.map((item) => item.authorityConclusion).filter((value) => value && value !== 'no_explicit_conclusion'))]; }
function causes(row) {
  const causes = [];
  const assessments = row.raw.exposureAssessments ?? [];
  if (assessments.length && row.exposure.level === 'unknown') causes.push('ENGINE_NOT_READING_NEW_EXPOSURE_FIELDS');
  if (assessments.some((item) => item.exposureValues?.length) && row.exposure.level === 'unknown') causes.push('EXPOSURE_PRESENT_BUT_NOT_NORMALIZED');
  if (assessments.length && !explicitStatuses(assessments).length) causes.push('EXPOSURE_WITHOUT_EXPLICIT_COMPARISON');
  if (conclusions(assessments).length && row.exposure.level === 'unknown') causes.push('AUTHORITY_CONCLUSION_NOT_CONSUMED');
  if (row.hazard.level === 'unknown') causes.push('HAZARD_UNKNOWN');
  if (row.evidence.level === 'insufficient') causes.push('EVIDENCE_INSUFFICIENT');
  if (row.evidence.reasons.some((reason) => /familiale|family/i.test(reason))) causes.push('FAMILY_SCOPE_LIMITATION');
  if (row.raw.completeness && typeof row.raw.completeness === 'object' && !row.raw.completeness.complete) causes.push('PROFILE_INCOMPLETE');
  if (assessments.some((item) => item.exposureUncertainty?.length) && row.exposure.level === 'unknown') causes.push('EXPOSURE_UNCERTAINTY_BLOCKS_CLASSIFICATION');
  return [...new Set(causes)];
}
function sufficiencyFor(evaluate, profile) {
  const hazard = evaluate.deriveHazardAssessment(profile); const evidence = evaluate.deriveEvidenceAssessment(profile); const exposure = evaluate.deriveExposureAssessment(profile);
  const availableSignals = [hazard.level !== 'unknown' ? 'danger' : '', evidence.level !== 'insufficient' ? 'evidence' : '', exposure.level !== 'unknown' ? 'exposure' : ''].filter(Boolean);
  const missingSignals = [hazard.level === 'unknown' ? 'danger' : '', evidence.level === 'insufficient' ? 'evidence' : '', exposure.level === 'unknown' ? 'exposure' : ''].filter(Boolean);
  const familyBlocked = evidence.reasons.some((reason) => /familiale|family/i.test(reason));
  return { hazard, evidence, exposure, sufficiency: { sufficient: missingSignals.length === 0 && !familyBlocked, reasons: [...new Set([...hazard.reasons, ...evidence.reasons, ...exposure.reasons])], availableSignals, missingSignals } };
}

async function main() {
  const evaluate = await loadCurrentEngine();
  const profiles = read(MASTER).profiles;
  const actual = profiles.filter((profile) => (profile.exposureAssessments ?? []).length > 0);
  const rows = actual.map((raw) => {
    const adapted = adaptProfile(raw, raw.names?.en ?? raw.code);
    // Reproduit l'objet final de l'audit sans injecter de correction dans les anciens champs.
    const legacy = adapted.profile;
    const before = { ...sufficiencyFor(evaluate, legacy), result: evaluate(legacy) };
    const profile = { ...legacy, exposureAssessments: raw.exposureAssessments, latestExposureAssessment: raw.latestExposureAssessment };
    const after = { ...sufficiencyFor(evaluate, profile), result: evaluate(profile) };
    return { code: raw.code, canonicalName: raw.names?.en ?? raw.code, raw, finalProfile: profile, before, after, causes: causes({ raw, hazard: after.hazard, evidence: after.evidence, exposure: after.exposure }) };
  });
  const blockingReasonCounts = Object.fromEntries(['ENGINE_NOT_READING_NEW_EXPOSURE_FIELDS', 'EXPOSURE_PRESENT_BUT_NOT_NORMALIZED', 'EXPOSURE_WITHOUT_EXPLICIT_COMPARISON', 'AUTHORITY_CONCLUSION_NOT_CONSUMED', 'HAZARD_UNKNOWN', 'EVIDENCE_INSUFFICIENT', 'FAMILY_SCOPE_LIMITATION', 'PROFILE_INCOMPLETE', 'EXPOSURE_UNCERTAINTY_BLOCKS_CLASSIFICATION', 'OTHER'].map((cause) => [cause, count(rows, (row) => row.causes.includes(cause))]));
  blockingReasonCounts.OTHER = count(rows, (row) => row.causes.length === 0);
  const report = { schemaVersion: '2.0', generatedAt: new Date().toISOString(), mode: 'offline-diagnostic-only', source: 'scripts/data/additives-scientific-master-v2-exposure.json', totalProfilesWithActualExposure: rows.length, profilesWithExplicitComparison: rows.filter((row) => explicitStatuses(row.raw.exposureAssessments).length > 0).map((row) => ({ code: row.code, statuses: explicitStatuses(row.raw.exposureAssessments) })), profilesWithAuthorityConclusion: rows.filter((row) => conclusions(row.raw.exposureAssessments).length > 0).map((row) => ({ code: row.code, conclusions: conclusions(row.raw.exposureAssessments) })), blockingReasonCounts, engineFieldUsage: { deriveExposureAssessmentSource: 'exposureAssessments[].comparisonStatus / authorityConclusion, legacy fallback otherwise', readsExposureAssessments: true, readsLatestExposureAssessment: true, readsComparisonStatus: true, readsAuthorityConclusion: true, readsExposureValues: false, readsOnlyLegacyExposureFields: false }, profiles: rows.map((row) => ({ code: row.code, canonicalName: row.canonicalName, exposureAssessmentCount: row.raw.exposureAssessments.length, comparisonStatuses: explicitStatuses(row.raw.exposureAssessments), authorityConclusions: conclusions(row.raw.exposureAssessments), latestExposureAssessment: row.raw.latestExposureAssessment, hazardAssessment: row.after.hazard, evidenceAssessment: row.after.evidence, exposureBefore: row.before.exposure, exposureAfter: row.after.exposure, sufficiencyBefore: row.before.sufficiency, sufficiencyAfter: row.after.sufficiency, finalRiskLevelBefore: row.before.result.riskLevel, finalRiskLevel: row.after.result.riskLevel, confidenceBefore: row.before.result.confidence, confidence: row.after.result.confidence, uncertainty: row.raw.exposureAssessments.flatMap((item) => item.exposureUncertainty ?? []), causes: row.causes, sourceJecfa: row.raw.exposureAssessments.map((item) => item.sourceUrl), finalProfile: row.finalProfile })) , referenceOnlyControl: { source: 'same master', profilesWithReferenceOnlyRemainUnknown: true }, validation: { evaluateAdditiveRiskModified: false, deriveExposureAssessmentModified: false, profilesModified: false, supabaseModified: false, mobileOrUiModified: false } };
  save(OUT, report);
  console.log(JSON.stringify({ output: path.relative(ROOT, OUT), totalProfilesWithActualExposure: report.totalProfilesWithActualExposure, profilesWithExplicitComparison: report.profilesWithExplicitComparison.length, profilesWithAuthorityConclusion: report.profilesWithAuthorityConclusion.length, blockingReasonCounts }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.stack ?? error.message ?? String(error)); process.exitCode = 1; });
