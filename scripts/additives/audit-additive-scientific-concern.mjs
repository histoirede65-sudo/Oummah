#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptProfile, loadCurrentEngine } from './audit-additive-risk-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const masterArgument = process.argv.indexOf('--master');
const outputArgument = process.argv.indexOf('--output');
const MASTER = masterArgument >= 0 ? path.resolve(ROOT, process.argv[masterArgument + 1]) : path.join(ROOT, 'scripts/data/additives-scientific-master-v2-exposure.json');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const OUTPUT = outputArgument >= 0 ? path.resolve(ROOT, process.argv[outputArgument + 1]) : path.join(ROOT, 'scripts/output/additive-scientific-concern-audit-v1.json');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const save = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const unique = (values) => [...new Set(values.filter(Boolean))];
const EVIDENCE_RANK = { insufficient: 0, limited: 1, moderate: 2, strong: 3 };
const SOURCE_AUTHORITIES = new Set(['EFSA', 'JECFA', 'WHO', 'OMS', 'ANSES', 'ECHA', 'IARC', 'CIRC', 'FDA', 'OEHHA']);

function rawEffects(raw) { return Array.isArray(raw?.potentialEffects) ? raw.potentialEffects : []; }
function authorityEvaluations(raw) { return raw?.authorityEvaluations ?? []; }
function hasIndividualOfficialEvaluation(raw) { return authorityEvaluations(raw).some((item) => item.assessmentScope === 'individual' && SOURCE_AUTHORITIES.has(String(item.authority).toUpperCase())); }
function sourceRecords(raw) { return (raw?.sources ?? []).map((source) => ({ organisation: source.organisation ?? null, title: source.title ?? null, url: source.url ?? null, sourceType: source.sourceType ?? null })); }
function authoritySignals(raw) {
  const signals = [];
  const recommendation = raw?.officialRecommendation?.strength;
  if (recommendation === 'strong') signals.push('strong_structured_recommendation');
  else if (recommendation === 'notable') signals.push('significant_structured_recommendation');
  if (raw?.authorityDisagreement) signals.push('limited_authority_disagreement');
  return signals;
}

function evaluateAdditiveScientificConcern(raw, engine) {
  if (!raw) return { concernLevel: 'insufficient_data', confidence: 'low', reasons: ['Profil scientifique absent.'], hazard: 'unknown', evidence: 'insufficient', effectsUsed: [], authoritySignals: [], sources: [] };
  const adapted = adaptProfile(raw, raw.names?.en ?? raw.code).profile;
  const hazard = engine.deriveHazardAssessment(adapted);
  const evidence = engine.deriveEvidenceAssessment(adapted);
  const effects = rawEffects(raw);
  const directEffects = effects.filter((effect) => effect.appliesTo === 'additive');
  const secondaryEffects = effects.filter((effect) => ['contaminant', 'metabolite', 'degradation_product', 'family'].includes(effect.appliesTo));
  const authority = authoritySignals(raw);
  const provenance = sourceRecords(raw).length > 0 || hasIndividualOfficialEvaluation(raw);
  const reasons = [...hazard.reasons, ...evidence.reasons];
  if (secondaryEffects.length) reasons.push('Les effets secondaires ou de périmètre externe ne sont pas transformés en danger individuel automatique.');
  if (authority.length === 0 && authorityEvaluations(raw).length) reasons.push('EFSA/JECFA seuls ne créent pas un niveau de préoccupation sans signal structuré supplémentaire.');
  if (!provenance) reasons.push('Provenance scientifique exploitable insuffisante.');

  let concernLevel = 'insufficient_data';
  if (hazard.level === 'unknown' || evidence.level === 'insufficient' || !provenance) {
    concernLevel = 'insufficient_data';
  } else if (hazard.level === 'serious' && evidence.level === 'strong' && directEffects.some((effect) => effect.severity === 'serious' && effect.evidenceLevel === 'strong')) {
    concernLevel = 'high';
  } else if ((hazard.level === 'moderate' && EVIDENCE_RANK[evidence.level] >= EVIDENCE_RANK.moderate) || (hazard.level === 'serious' && EVIDENCE_RANK[evidence.level] >= EVIDENCE_RANK.limited)) {
    concernLevel = 'moderate';
  } else if (hazard.level === 'low' && EVIDENCE_RANK[evidence.level] >= EVIDENCE_RANK.limited) {
    concernLevel = 'limited';
  } else if (hazard.level === 'none_identified' && EVIDENCE_RANK[evidence.level] >= EVIDENCE_RANK.moderate && (directEffects.length === 0 || directEffects.every((effect) => effect.severity === 'none'))) {
    concernLevel = 'no_identified_concern';
  } else if (hazard.level === 'none_identified' && evidence.level === 'limited' && directEffects.length > 0) {
    concernLevel = 'limited';
  }

  const confidence = concernLevel === 'insufficient_data' ? (provenance ? 'medium' : 'low') : (authorityEvaluations(raw).length >= 2 && raw.completeness?.complete ? 'high' : 'medium');
  if (concernLevel === 'no_identified_concern') reasons.push('Aucune préoccupation scientifique significative identifiée dans les données évaluées ; cela ne signifie pas absence absolue de danger.');
  if (concernLevel === 'high') reasons.push('Effet grave additif avec preuve forte et provenance scientifique structurée.');
  return { concernLevel, confidence, hazard: hazard.level, evidence: evidence.level, effectsUsed: effects.map((effect) => ({ effect: effect.effect ?? null, severity: effect.severity ?? null, evidenceLevel: effect.evidenceLevel ?? null, appliesTo: effect.appliesTo ?? null })), authoritySignals: authority, authorityEvaluations: authorityEvaluations(raw).map((item) => ({ authority: item.authority ?? null, assessmentScope: item.assessmentScope ?? null, coveredCodes: item.coveredCodes ?? [] })), sources: sourceRecords(raw), provenance, reasons: unique(reasons) };
}

async function main() {
  const engine = await loadCurrentEngine();
  const profiles = new Map(read(MASTER).profiles.map((profile) => [profile.code, profile]));
  const catalog = read(CATALOG).entries;
  const rows = catalog.map((item) => {
    const raw = profiles.get(item.code);
    const scientificConcern = evaluateAdditiveScientificConcern(raw, engine);
    let exposureRisk = { riskLevel: 'insufficient_data', confidence: 'low', reasons: ['Profil scientifique absent.'] };
    if (raw) {
      const adapted = adaptProfile(raw, item.names?.en ?? raw.names?.en ?? item.code).profile;
      adapted.exposureAssessments = raw.exposureAssessments ?? [];
      adapted.latestExposureAssessment = raw.latestExposureAssessment ?? null;
      exposureRisk = engine(adapted);
    }
    return { code: item.code, name: item.names?.en ?? raw?.names?.en ?? item.code, scientificConcern, exposureRisk };
  });
  const countBy = (value) => rows.filter((row) => row.scientificConcern.concernLevel === value).length;
  const concernLevels = ['no_identified_concern', 'limited', 'moderate', 'high', 'insufficient_data'];
  const cross = {};
  for (const row of rows) {
    const key = `${row.scientificConcern.concernLevel}|${row.exposureRisk.riskLevel}`;
    cross[key] = (cross[key] ?? 0) + 1;
  }
  const nonGray = rows.filter((row) => row.scientificConcern.concernLevel !== 'insufficient_data');
  const high = rows.filter((row) => row.scientificConcern.concernLevel === 'high');
  const anomalies = {
    suspectedOverclassification: high.filter((row) => row.scientificConcern.hazard !== 'serious' || row.scientificConcern.evidence !== 'strong' || !row.scientificConcern.effectsUsed.some((effect) => effect.appliesTo === 'additive' && effect.severity === 'serious' && effect.evidenceLevel === 'strong') || !row.scientificConcern.provenance).map((row) => row.code),
    suspectedFalseNoIdentifiedConcern: rows.filter((row) => row.scientificConcern.concernLevel === 'no_identified_concern' && (row.scientificConcern.evidence === 'insufficient' || !row.scientificConcern.provenance || row.scientificConcern.effectsUsed.some((effect) => effect.severity && effect.severity !== 'none' && effect.appliesTo === 'additive'))).map((row) => row.code),
  };
  const spotCodes = ['E150D', 'E338', 'E621', 'E951', 'E955', 'E202', 'E330', 'E407', 'E471', 'E250'];
  const spotChecks = spotCodes.map((code) => rows.find((row) => row.code === code)).filter(Boolean);
  const report = { schemaVersion: '1.0', auditVersion: '17A-v1', generatedAt: new Date().toISOString(), mode: 'offline-prototype-only', runtimeEngineModified: false, healthScoreAnalyzerModified: false, matrixModified: false, distribution: Object.fromEntries(concernLevels.map((level) => [level, countBy(level)])), highCodes: high.map((row) => row.code), moderateCodes: rows.filter((row) => row.scientificConcern.concernLevel === 'moderate').map((row) => row.code), limitedCodes: rows.filter((row) => row.scientificConcern.concernLevel === 'limited').map((row) => row.code), rows, crossTab: cross, spotChecks, examplesConcernWithUnknownExposure: rows.filter((row) => row.scientificConcern.concernLevel !== 'insufficient_data' && row.exposureRisk.riskLevel === 'insufficient_data').slice(0, 30), anomalies, prototypeRules: { noIdentifiedConcern: 'hazard none_identified + evidence moderate/strong + provenance + no unresolved direct effect', high: 'serious + strong + direct additive serious/strong effect + provenance', secondaryScopesNotIndividualHazard: ['family', 'contaminant', 'metabolite', 'degradation_product'], authorityPresenceAloneNotEnough: true, noExposureRequired: true } };
  save(OUTPUT, report);
  console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), distribution: report.distribution, high: report.highCodes.length, moderate: report.moderateCodes.length, limited: report.limitedCodes.length, anomalies: Object.fromEntries(Object.entries(anomalies).map(([key, values]) => [key, values.length])), crossTab: report.crossTab }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.stack ?? error.message ?? String(error)); process.exitCode = 1; });
