#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASIS_PATH = path.join(ROOT, 'scripts/output/additive-hazard-evidence-basis-audit-v1.json');
const FRAMEWORK_PATH = path.join(ROOT, 'scripts/output/additive-official-hazard-evidence-framework-audit-v1.json');
const DERIVATION_OUTPUT = path.join(ROOT, 'scripts/output/additive-official-framework-derivation-audit-v1.json');
const CONCERN_OUTPUT = path.join(ROOT, 'scripts/output/additive-scientific-concern-audit-v4-framework.json');
const SEVERITIES = ['low', 'moderate', 'serious', 'unknown'];
const EVIDENCE = ['insufficient', 'limited', 'moderate', 'strong'];

const OFFICIAL_FRAMEWORK_RULES = [
  {
    id: 'SEVERITY_CLP_REPRODUCTIVE', framework: 'EU CLP / ECHA', applicableEndpointTypes: ['reproductive'],
    requiredFields: ['criticalEndpoints[].normalizedEndpointClass=reproductive', 'explicit CLP reproductive category', 'effect/result data', 'provenanceComplete'],
    optionalFields: ['studyContext', 'species', 'studyType', 'referencePoint', 'reliabilitySignals', 'uncertaintySignals'],
    blockingConditions: ['no explicit CLP category', 'endpoint name only', 'no result/effect interpretation', 'missing provenance'],
    output: ['low', 'moderate', 'serious'], rationale: 'La classe CLP reproductive toxicity exige une catégorie et des critères réglementaires documentés ; le seul nom d’endpoint ne suffit pas.',
    sourceReference: ['EU CLP Annex I', 'ECHA Guidance on the Application of the CLP Criteria'],
  },
  {
    id: 'SEVERITY_CLP_STOT_REPEATED', framework: 'EU CLP / ECHA', applicableEndpointTypes: ['general_toxicity', 'organ_toxicity'],
    requiredFields: ['criticalEndpoints[].normalizedEndpointClass', 'explicit CLP STOT category', 'target organ/system', 'duration/route', 'effect/result data', 'provenanceComplete'],
    optionalFields: ['species', 'referencePoint', 'reliabilitySignals', 'uncertaintySignals'],
    blockingConditions: ['target organ absent', 'duration/route absent', 'CLP category absent', 'reference point alone', 'missing provenance'],
    output: ['low', 'moderate', 'serious'], rationale: 'Un endpoint de toxicité répétée peut orienter vers STOT, mais la catégorie exige les éléments de danger et de pertinence prévus par CLP.',
    sourceReference: ['EU CLP Annex I', 'ECHA Guidance on the Application of the CLP Criteria'],
  },
  {
    id: 'EVIDENCE_EFSA_OECD_WOE', framework: 'EFSA / OECD', applicableEndpointTypes: ['any'],
    requiredFields: ['studyContexts', 'species', 'studyTypes', 'reliabilitySignals or uncertaintySignals', 'assessmentSources', 'provenanceComplete'],
    optionalFields: ['criticalEndpoints', 'referencePoints'],
    blockingConditions: ['no exploitable study data', 'no reliability/relevance/uncertainty signal', 'single descriptive authority source', 'missing provenance'],
    output: ['limited', 'moderate', 'strong'], rationale: 'Le poids de preuve doit intégrer pertinence, fiabilité, cohérence et incertitude ; une autorité seule ne constitue pas une preuve forte.',
    sourceReference: ['EFSA WoE guidance 2017', 'OECD WoE principles 2019'],
  },
];

function unique(values) { return [...new Set(values.filter(Boolean))]; }
function has(value) { return Array.isArray(value) ? value.length > 0 : Boolean(value); }
function endpointClasses(basis) { return unique((basis.criticalEndpoints ?? []).map((item) => item.normalizedEndpointClass)); }
function contexts(basis) { return unique((basis.studyContexts ?? []).map((item) => item.studyContext)); }
function sources(basis) { return basis.assessmentSources ?? []; }
function provenance(basis) { return basis.provenanceComplete === true; }
function explicitClpCategory(basis) { return basis.explicitClassification?.clpCategory ?? null; }
function hasEffectResult(basis) { return (basis.criticalEndpoints ?? []).some((item) => item.effectResult || item.sourceEffectConclusion || item.targetOrgan || item.duration); }
function hasQuality(basis) { return has(basis.reliabilitySignals) || has(basis.uncertaintySignals); }
function missingForSeverity(basis) {
  const missing = [];
  if (!has(basis.criticalEndpoints)) missing.push('critical endpoint');
  if (!explicitClpCategory(basis)) missing.push('explicit CLP category');
  if (!hasEffectResult(basis)) missing.push('structured effect/result or target-organ interpretation');
  if (!provenance(basis)) missing.push('complete provenance');
  return missing;
}
function missingForEvidence(basis) {
  const missing = [];
  if (!has(basis.studyContexts)) missing.push('study context');
  if (!has(basis.species)) missing.push('species');
  if (!has(basis.studyTypes)) missing.push('study type');
  if (!hasQuality(basis)) missing.push('reliability or uncertainty signal');
  if (!has(sources(basis))) missing.push('assessment source');
  if (!provenance(basis)) missing.push('complete provenance');
  return missing;
}

function severityAnomalies(basis) {
  const anomalies = [];
  if (has(basis.criticalEndpoints) && !explicitClpCategory(basis)) anomalies.push('SEVERITY_FROM_CRITICAL_ENDPOINT_ONLY');
  if (has(basis.referencePoints) && !explicitClpCategory(basis)) anomalies.push('SEVERITY_FROM_REFERENCE_VALUE_ONLY');
  if (endpointClasses(basis).some((item) => item === 'general_toxicity') && !explicitClpCategory(basis)) anomalies.push('SEVERITY_FROM_ENDPOINT_NAME_ONLY');
  if (basis.code && /^E\d/i.test(basis.code) && basis.eNumberRule) anomalies.push('E_NUMBER_SPECIFIC_RULE');
  if (!provenance(basis)) anomalies.push('RULE_WITHOUT_PROVENANCE');
  return unique(anomalies);
}
function evidenceAnomalies(basis) {
  const anomalies = [];
  if (has(sources(basis)) && !hasQuality(basis) && (basis.studyContexts ?? []).length === 0) anomalies.push('EVIDENCE_FROM_AUTHORITY_NAME_ONLY');
  if (sources(basis).length === 1 && !hasQuality(basis)) anomalies.push('EVIDENCE_FROM_SINGLE_SOURCE_WITHOUT_QUALITY');
  if (!provenance(basis)) anomalies.push('RULE_WITHOUT_PROVENANCE');
  if (basis.code && /^E\d/i.test(basis.code) && basis.eNumberRule) anomalies.push('E_NUMBER_SPECIFIC_RULE');
  return unique(anomalies);
}

export function deriveHazardSeverityFromOfficialFramework(basis) {
  const missing = missingForSeverity(basis);
  const anomalies = severityAnomalies(basis);
  const classes = endpointClasses(basis);
  const applicable = OFFICIAL_FRAMEWORK_RULES.filter((rule) => rule.id.startsWith('SEVERITY_') && (rule.applicableEndpointTypes.includes('any') || classes.some((item) => rule.applicableEndpointTypes.includes(item))));
  if (anomalies.length || !applicable.length || missing.length) return { value: 'unknown', confidence: 'low', ruleId: null, framework: null, conditionsSatisfied: [], conditionsMissing: missing, reasons: ['Aucune règle de gravité officielle ne peut être appliquée intégralement à cette base factuelle.', ...anomalies], provenance: basis.provenance ?? null, anomalies };
  return { value: 'moderate', confidence: 'conditional', ruleId: applicable[0].id, framework: applicable[0].framework, conditionsSatisfied: applicable[0].requiredFields, conditionsMissing: [], reasons: ['Prototype uniquement : critères officiels fournis et provenance complète.'], provenance: basis.provenance, anomalies: [] };
}

export function deriveEvidenceStrengthFromOfficialFramework(basis) {
  const missing = missingForEvidence(basis);
  const anomalies = evidenceAnomalies(basis);
  const enoughLines = new Set([...contexts(basis), ...(basis.studyTypes ?? []).map((item) => item.rawValue), ...(basis.species ?? []).map((item) => item.rawValue)]).size >= 3;
  if (anomalies.length || missing.length >= 3) return { value: 'insufficient', confidence: 'low', ruleId: null, framework: null, conditionsSatisfied: [], conditionsMissing: missing, reasons: ['Les données ne permettent pas d’évaluer de façon défendable le poids de preuve.', ...anomalies], provenance: basis.provenance ?? null, anomalies };
  if (!enoughLines || !hasQuality(basis)) return { value: 'limited', confidence: 'conditional', ruleId: 'EVIDENCE_EFSA_OECD_WOE', framework: 'EFSA / OECD', conditionsSatisfied: ['provenanceComplete', 'study data present'], conditionsMissing: [...missing, 'multiple convergent lines of evidence'], reasons: ['Données pertinentes mais base partielle ou convergence non démontrée.'], provenance: basis.provenance, anomalies };
  if (has(basis.consistencyAssessment) && basis.consistencyAssessment === 'convergent' && basis.provenanceComplete && !has(basis.unresolvedMajorUncertainty)) return { value: 'moderate', confidence: 'conditional', ruleId: 'EVIDENCE_EFSA_OECD_WOE', framework: 'EFSA / OECD', conditionsSatisfied: ['provenanceComplete', 'study context', 'species', 'study type', 'quality signal', 'convergence'], conditionsMissing: [], reasons: ['Plusieurs lignes de preuve convergentes dans le prototype.'], provenance: basis.provenance, anomalies: [] };
  return { value: 'limited', confidence: 'conditional', ruleId: 'EVIDENCE_EFSA_OECD_WOE', framework: 'EFSA / OECD', conditionsSatisfied: ['provenanceComplete', 'study context', 'species', 'study type', 'quality signal'], conditionsMissing: ['explicit consistency/convergence assessment'], reasons: ['La qualité est exploitable mais la cohérence inter-lignes n’est pas explicitement évaluée.'], provenance: basis.provenance, anomalies };
}

function simulateScientificConcern(severity, evidence, basis) {
  if (severity.value === 'serious' && evidence.value === 'strong' && basis.provenanceComplete && basis.criticalEndpoints.some((item) => item.appliesTo === 'additive') && !severity.anomalies.length && !evidence.anomalies.length) return { concernLevel: 'high', reason: 'Prototype: serious + strong + effet direct additif + provenance complète.' };
  if (['moderate', 'serious'].includes(severity.value) && ['moderate', 'strong'].includes(evidence.value) && basis.provenanceComplete && !severity.anomalies.length && !evidence.anomalies.length) return { concernLevel: 'moderate', reason: 'Prototype: signal de danger conditionnel avec preuve conditionnelle.' };
  if (severity.value !== 'unknown' && evidence.value !== 'insufficient') return { concernLevel: 'limited', reason: 'Prototype: données non nulles mais insuffisantes pour un niveau supérieur.' };
  return { concernLevel: 'insufficient_data', reason: 'Aucune conclusion automatique : gravité ou preuve insuffisamment établie.' };
}

function main() {
  const basisReport = JSON.parse(fs.readFileSync(BASIS_PATH, 'utf8'));
  const frameworkReport = JSON.parse(fs.readFileSync(FRAMEWORK_PATH, 'utf8'));
  const codeResults = basisReport.basisByCode.map((basis) => {
    const severity = deriveHazardSeverityFromOfficialFramework(basis);
    const evidence = deriveEvidenceStrengthFromOfficialFramework(basis);
    const concern = simulateScientificConcern(severity, evidence, basis);
    return { code: basis.code, severity, evidence, scientificConcern: concern, anomalies: unique([...(severity.anomalies ?? []), ...(evidence.anomalies ?? [])]), inputsSummary: { evidenceBasisStatus: basis.evidenceBasisStatus, endpointClasses: endpointClasses(basis), studyContexts: contexts(basis), referencePointCount: basis.referencePoints.length, provenanceComplete: basis.provenanceComplete } };
  });
  const dist = (items, field, values) => Object.fromEntries(values.map((value) => [value, items.filter((item) => item[field].value === value).length]));
  const concernDistribution = Object.fromEntries(['no_identified_concern', 'limited', 'moderate', 'high', 'insufficient_data'].map((value) => [value, codeResults.filter((item) => item.scientificConcern.concernLevel === value).length]));
  const unknownReasons = {};
  for (const item of codeResults) for (const reason of [...item.severity.conditionsMissing, ...item.evidence.conditionsMissing, ...item.anomalies]) unknownReasons[reason] = (unknownReasons[reason] ?? 0) + 1;
  const ruleUsage = {};
  for (const item of codeResults) for (const rule of [item.severity.ruleId, item.evidence.ruleId].filter(Boolean)) ruleUsage[rule] = (ruleUsage[rule] ?? 0) + 1;
  const anomalies = {}; for (const item of codeResults) for (const anomaly of item.anomalies) anomalies[anomaly] = (anomalies[anomaly] ?? 0) + 1;
  const both = codeResults.filter((item) => item.severity.value !== 'unknown' && item.evidence.value !== 'insufficient').length;
  const on79 = basisReport.basisByCode.filter((basis) => basis.criticalEndpoints.length && basis.referencePoints.length && basis.studyContexts.length && basis.species.length).map((basis) => codeResults.find((item) => item.code === basis.code));
  const concernReport = { schemaVersion: 'additive-scientific-concern-audit-v4-framework', mode: 'offline-simulation-only', distribution: concernDistribution, highCodes: codeResults.filter((item) => item.scientificConcern.concernLevel === 'high').map((item) => item.code), moderateCodes: codeResults.filter((item) => item.scientificConcern.concernLevel === 'moderate').map((item) => item.code), limitedCodes: codeResults.filter((item) => item.scientificConcern.concernLevel === 'limited').map((item) => item.code), rows: codeResults, validation: { runtimeProfilesModified: false, evaluateAdditiveScientificConcernModified: false, supabaseUpsertPerformed: false, uiModified: false } };
  const report = { schemaVersion: 'additive-official-framework-derivation-audit-v1', mode: 'offline-prototype-only', officialFrameworkRules: OFFICIAL_FRAMEWORK_RULES, distributionOn79: { evaluatedCodes: on79.length, severityDistribution: dist(on79, 'severity', SEVERITIES), evidenceDistribution: dist(on79, 'evidence', EVIDENCE), bothUsableCount: on79.filter((item) => item.severity.value !== 'unknown' && item.evidence.value !== 'insufficient').length }, severityDistribution: dist(codeResults, 'severity', SEVERITIES), evidenceDistribution: dist(codeResults, 'evidence', EVIDENCE), bothUsableCount: both, unknownReasons, ruleUsage, anomalies, codeResults, scientificConcernSimulation: { distribution: concernDistribution, limited: concernReport.limitedCodes, moderate: concernReport.moderateCodes, high: concernReport.highCodes, highAndModerateJustifications: codeResults.filter((item) => ['high', 'moderate'].includes(item.scientificConcern.concernLevel)).map((item) => ({ code: item.code, concern: item.scientificConcern, severity: item.severity, evidence: item.evidence, anomalies: item.anomalies })) }, sourceFrameworkAudit: frameworkReport.source?.structureAudit ?? '17G', validation: { runtimeProfilesModified: false, basisModified: false, potentialEffectsModified: false, riskEngineModified: false, supabaseUpsertPerformed: false, uiModified: false, eNumberSpecificRules: false } };
  fs.writeFileSync(DERIVATION_OUTPUT, `${JSON.stringify(report, null, 2)}\n`, 'utf8'); fs.writeFileSync(CONCERN_OUTPUT, `${JSON.stringify(concernReport, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ derivationOutput: path.relative(ROOT, DERIVATION_OUTPUT), concernOutput: path.relative(ROOT, CONCERN_OUTPUT), severity: report.severityDistribution, evidence: report.evidenceDistribution, on79: report.distributionOn79, concern: concernDistribution, bothUsableCount: both, anomalies }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
