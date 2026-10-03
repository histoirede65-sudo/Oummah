#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLP_AUDIT = path.join(ROOT, 'scripts/output/additive-official-substance-hazard-classification-audit-v3.json');
const PROFILES = path.join(ROOT, 'scripts/data/additives-scientific-master-v3-effects.json');
const OUTPUT = path.join(ROOT, 'scripts/output/additive-clp-food-relevance-audit-v1.json');
const LEVELS = ['directly_relevant', 'conditionally_relevant', 'route_specific', 'concentration_dependent', 'occupational_or_handling_only', 'insufficient_context', 'not_relevant_to_food_score'];

function text(value) { return String(value ?? '').trim(); }
function array(value) { return Array.isArray(value) ? value : []; }
function unique(values) { return [...new Set(values.map(text).filter(Boolean))]; }
function load(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function uniqueEvidence(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function classFamily(hazardClass) {
  const value = text(hazardClass);
  if (/^Carc\./.test(value)) return 'carcinogenicity';
  if (/^Muta\./.test(value)) return 'mutagenicity';
  if (/^Repr\./.test(value)) return 'reproductive_toxicity';
  if (/^STOT RE/.test(value)) return 'stot_repeated';
  if (/^STOT SE/.test(value)) return 'stot_single';
  if (/^Acute Tox\./.test(value)) return 'acute_toxicity';
  if (/^Resp\. Sens\./.test(value)) return 'respiratory_sensitisation';
  if (/^Skin\s*\.??\s*Sens\./.test(value)) return 'skin_sensitisation';
  if (/^Skin\s*\.??\s*Corr\./.test(value)) return 'skin_corrosion';
  if (/^Skin\s*\.??\s*Irrit\./.test(value)) return 'skin_irritation';
  if (/^Eye Dam\./.test(value)) return 'eye_damage';
  if (/^Eye Irrit\./.test(value)) return 'eye_irritation';
  if (/^Aquatic|Ozone/.test(value)) return 'environmental';
  if (/^Flam\.|^Press\.|^Ox\.|^Water-react\.|^Explos\.|^Self-react\.|^Org\. Perox\./.test(value)) return 'physical';
  return 'other';
}

function routeFor(family, hazardStatement) {
  const statement = text(hazardStatement);
  if (family === 'skin_corrosion' || family === 'skin_sensitisation' || family === 'skin_irritation' || family === 'eye_damage' || family === 'eye_irritation') return 'contact_cutaneous_or_ocular';
  if (family === 'acute_toxicity') {
    const routes = [];
    if (/H30[12]/.test(statement)) routes.push('ingestion');
    if (/H31[12]/.test(statement)) routes.push('contact_cutaneous');
    if (/H33[12]/.test(statement)) routes.push('inhalation');
    return routes.length === 1 ? routes[0] : routes.length > 1 ? routes.join('|') : 'unknown';
  }
  if (family === 'stot_repeated') return routeFromText(statement, 'repeated_exposure_route_unspecified');
  if (family === 'stot_single') return routeFromText(statement, 'acute_exposure_route_unspecified');
  if (family === 'carcinogenicity' || family === 'mutagenicity' || family === 'reproductive_toxicity') return routeFromText(statement, 'systemic_route_unspecified');
  return 'not_applicable';
}

function routeFromText(statement, fallback) {
  const routes = [];
  if (/\b(inhalation|respiratory)\b/i.test(statement)) routes.push('inhalation');
  if (/\b(oral|ingestion)\b/i.test(statement)) routes.push('ingestion');
  if (/\b(dermal|skin)\b/i.test(statement)) routes.push('contact_cutaneous');
  return routes.length === 1 ? routes[0] : routes.length > 1 ? routes.join('|') : fallback;
}

function concentrationContext(hazard, record) {
  const limits = [...array(hazard.specificConcentrationLimit), ...array(record.specificConcentrationLimits)].filter((value) => text(value));
  const raw = `${hazard.hazardStatement ?? ''} ${hazard.hazardClass ?? ''} ${array(record.notes).join(' ')}`;
  if (limits.length) return { value: 'specific_limit_available', values: unique(limits) };
  if (/\bATE\b|\bM-factor\b|\*/i.test(raw)) return { value: 'concentration_dependent', values: [] };
  if (record.clpIdentity?.substanceName) return { value: 'intrinsic', values: [] };
  return { value: 'unknown', values: [] };
}

function profileEvidence(profile) {
  if (!profile) return { supporting: [], limiting: ['Aucun profil scientifique local lié par code.'] };
  const supporting = [];
  const limiting = [];
  for (const ref of array(profile.referenceValues)) {
    if (['ADI', 'TDI', 'MTDI', 'PMTDI', 'ARfD'].includes(text(ref.type)) && text(ref.scope).includes('food_additive_human')) supporting.push({ type: ref.type, authority: ref.authority ?? null, year: ref.year ?? null, rawText: ref.rawText ?? null, source: ref.source ?? null });
  }
  for (const evaluation of array(profile.authorityEvaluations)) {
    if (text(evaluation.scope).includes('food_additive_human')) supporting.push({ authority: evaluation.authority, year: evaluation.year, assessmentIdentifier: evaluation.assessmentIdentifier, source: evaluation.url ?? null });
  }
  if (!supporting.length) limiting.push('Aucune ADI/TDI/MTDI/ARfD ou évaluation alimentaire structurée exploitable dans le profil local.');
  if (!array(profile.exposureAssessments).length) limiting.push('Aucune exposition alimentaire individuelle liée dans les données locales.');
  if (profile.completeness?.reviewReasons?.length) limiting.push(...profile.completeness.reviewReasons);
  return { supporting: uniqueEvidence(supporting), limiting: unique(limiting) };
}

function evaluateRelevance(hazard, record, profile) {
  const family = classFamily(hazard.hazardClass);
  const route = routeFor(family, hazard.hazardStatement);
  const concentration = concentrationContext(hazard, record);
  const evidence = profileEvidence(profile);
  let relevance = 'insufficient_context';
  const reasons = [];
  if (family === 'environmental' || family === 'physical') {
    relevance = 'not_relevant_to_food_score';
    reasons.push('La classe CLP est environnementale ou physique, pas un signal de danger alimentaire humain.');
  } else if (['skin_corrosion', 'skin_sensitisation', 'skin_irritation', 'eye_damage', 'eye_irritation'].includes(family)) {
    relevance = 'occupational_or_handling_only';
    reasons.push('Le signal décrit principalement un danger de contact avec la substance concentrée.');
    reasons.push('Aucune extrapolation automatique vers le risque alimentaire.');
  } else if (family === 'acute_toxicity') {
    relevance = route === 'ingestion' ? 'conditionally_relevant' : 'route_specific';
    reasons.push(route === 'ingestion' ? 'La voie orale est explicitement présente, mais la pertinence alimentaire dépend de l’exposition et de la dose.' : 'La voie orale n’est pas établie comme voie unique par les données CLP disponibles.');
  } else if (['carcinogenicity', 'mutagenicity', 'reproductive_toxicity', 'stot_repeated', 'stot_single', 'respiratory_sensitisation'].includes(family)) {
    relevance = route === 'systemic_route_unspecified' ? 'conditionally_relevant' : 'route_specific';
    reasons.push('Classe potentiellement systémique, mais la classification intrinsèque ne démontre pas un risque alimentaire aux usages autorisés.');
  } else {
    reasons.push('Contexte d’exposition alimentaire insuffisant pour une qualification plus précise.');
  }
  if (concentration.value === 'specific_limit_available' || concentration.value === 'concentration_dependent') {
    if (relevance === 'conditionally_relevant') relevance = 'concentration_dependent';
    reasons.push('La classification comporte un contexte de concentration/limite à conserver sans créer de seuil.');
  }
  if (!record.provenance) reasons.push('Provenance CLP absente : le signal doit être rejeté.');
  return { hazardClass: hazard.hazardClass, category: hazard.category || null, relevance, exposureRoute: route, concentrationContext: concentration, supportingFoodSafetyData: evidence.supporting, conflictingOrLimitingData: evidence.limiting, reasons, provenance: record.provenance ? [record.provenance] : [] };
}

function audit() {
  const clp = load(CLP_AUDIT);
  const profiles = load(PROFILES).profiles ?? [];
  const profileByCode = new Map(profiles.map((profile) => [text(profile.code).toUpperCase(), profile]));
  const matched = clp.harmonisedClassifications;
  const codeResults = matched.map((record) => ({ code: record.code, eNumber: record.code, additiveName: record.substanceName, clpHazards: record.hazardClasses, foodAdditiveRelevance: record.hazardClasses.map((hazard) => evaluateRelevance(hazard, record, profileByCode.get(record.code))) }));
  const distribution = Object.fromEntries(LEVELS.map((level) => [level, codeResults.flatMap((record) => record.foodAdditiveRelevance).filter((item) => item.relevance === level).length]));
  const usable = codeResults.flatMap((record) => record.foodAdditiveRelevance).filter((item) => ['directly_relevant', 'conditionally_relevant', 'concentration_dependent'].includes(item.relevance));
  const contextual = codeResults.flatMap((record) => record.foodAdditiveRelevance).filter((item) => ['route_specific', 'insufficient_context'].includes(item.relevance));
  const excluded = codeResults.flatMap((record) => record.foodAdditiveRelevance).filter((item) => ['occupational_or_handling_only', 'not_relevant_to_food_score'].includes(item.relevance));
  const report = { schemaVersion: 'additive-clp-food-relevance-audit-v1', mode: 'offline-audit-only', source: { clpAudit: 'scripts/output/additive-official-substance-hazard-classification-audit-v3.json', profiles: 'scripts/data/additives-scientific-master-v3-effects.json', methodology: 'generic class/route/concentration rules; no E-number-specific rules' }, counts: { matchedClpCodes: matched.length, matchedHumanHealthCodes: new Set(codeResults.flatMap((record) => record.foodAdditiveRelevance.filter((item) => item.relevance !== 'not_relevant_to_food_score').map(() => record.code))).size, directlyRelevantCount: distribution.directly_relevant, conditionallyRelevantCount: distribution.conditionally_relevant, routeSpecificCount: distribution.route_specific, concentrationDependentCount: distribution.concentration_dependent, handlingOnlyCount: distribution.occupational_or_handling_only, insufficientContextCount: distribution.insufficient_context, notRelevantCount: distribution.not_relevant_to_food_score, usableHazardSignalCount: usable.length, contextualOnlyCount: contextual.length, doNotUseForFoodConcernCount: excluded.length }, distribution, signalGroups: { USABLE_HAZARD_SIGNAL: usable.map((item) => ({ hazardClass: item.hazardClass, relevance: item.relevance })), CONTEXTUAL_ONLY: contextual.map((item) => ({ hazardClass: item.hazardClass, relevance: item.relevance })), DO_NOT_USE_FOR_FOOD_CONCERN: excluded.map((item) => ({ hazardClass: item.hazardClass, relevance: item.relevance })) }, codeResults, safeguards: { noENumberRules: true, noSeverityCreated: true, noScientificConcernLevelsCreated: true, noScoreCreated: true, noColourCreated: true, noRuntimeChanges: true }, provenance: { required: true, allResultsHaveProvenance: codeResults.flatMap((record) => record.foodAdditiveRelevance).every((item) => item.provenance.length > 0) } };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), matchedCodes: matched.length, distribution, usable: usable.length, contextual: contextual.length, excluded: excluded.length }, null, 2));
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) audit();
export { audit, classFamily, evaluateRelevance, routeFor, concentrationContext };
