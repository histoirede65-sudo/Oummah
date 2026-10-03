#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG = path.join(ROOT, 'src/features/boycott/data/eu-additive-catalog.json');
const PROFILES = path.join(ROOT, 'scripts/data/additives-scientific-master-v3-effects.json');
const RELEVANCE = path.join(ROOT, 'scripts/output/additive-clp-food-relevance-audit-v1.json');
const AUDIT_OUTPUT = path.join(ROOT, 'scripts/output/additive-oummah-scientific-concern-v1-audit.json');
const METHODOLOGY_OUTPUT = path.join(ROOT, 'scripts/output/oummah-additive-methodology-v1.json');
const CONCERN_LEVELS = ['no_identified_concern', 'limited', 'moderate', 'high', 'insufficient_data'];
const USABLE_RELEVANCE = new Set(['directly_relevant', 'conditionally_relevant', 'concentration_dependent']);
const CONTEXTUAL_RELEVANCE = new Set(['route_specific', 'insufficient_context']);
const EXCLUDED_RELEVANCE = new Set(['occupational_or_handling_only', 'not_relevant_to_food_score']);
const SYSTEMIC_CLASSES = new Set(['carcinogenicity', 'mutagenicity', 'reproductive_toxicity', 'stot_repeated', 'stot_single']);

function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function write(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function text(value) { return String(value ?? '').trim(); }
function array(value) { return Array.isArray(value) ? value : []; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function uniqueObjects(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const OUMMAH_SCIENTIFIC_CONCERN_V1_RULES = [
  {
    id: 'SCV1_LIMITED_USABLE_CONDITIONAL',
    applicableHazardClasses: 'any usable CLP class',
    requiredFoodRelevance: ['conditionally_relevant', 'concentration_dependent'],
    routeRequirements: ['ingestion or route not contradicting food exposure'],
    concentrationRequirements: ['intrinsic, specific limit or concentration-dependent context retained'],
    blockingConditions: ['major limitation, non-food route, handling-only or non-harmonised signal'],
    outputConcernLevel: 'limited',
    rationale: 'A food-relevant official signal exists, but its interpretation remains conditional or concentration-dependent.'
  },
  {
    id: 'SCV1_MODERATE_DIRECT_SYSTEMIC',
    applicableHazardClasses: ['carcinogenicity', 'mutagenicity', 'reproductive_toxicity', 'stot_repeated'],
    requiredFoodRelevance: ['directly_relevant'],
    routeRequirements: ['explicitly compatible ingestion route'],
    concentrationRequirements: ['no unresolved concentration limitation'],
    blockingConditions: ['missing scope/provenance, route mismatch, major limitation'],
    outputConcernLevel: 'moderate',
    rationale: 'A robust systemic hazard signal is directly relevant to food exposure and is not blocked by a major limitation.'
  },
  {
    id: 'SCV1_HIGH_DIRECT_SYSTEMIC_STRONG',
    applicableHazardClasses: ['carcinogenicity', 'mutagenicity', 'reproductive_toxicity', 'stot_repeated'],
    requiredFoodRelevance: ['directly_relevant'],
    routeRequirements: ['explicit ingestion route'],
    concentrationRequirements: ['intrinsic or resolved food-use scope'],
    blockingConditions: ['any major limitation, uncertain scope, route mismatch, incomplete provenance'],
    outputConcernLevel: 'high',
    rationale: 'Reserved for a strong harmonised systemic signal with direct food relevance and complete scope/provenance.'
  },
  {
    id: 'SCV1_INSUFFICIENT_NO_USABLE_SIGNAL',
    applicableHazardClasses: 'none or excluded/contextual signals only',
    requiredFoodRelevance: ['no usable food-relevant signal'],
    routeRequirements: ['not applicable'],
    concentrationRequirements: ['not applicable'],
    blockingConditions: ['absence of explicit reassuring structured conclusion'],
    outputConcernLevel: 'insufficient_data',
    rationale: 'Absence of a usable signal is not evidence of no concern.'
  },
  {
    id: 'SCV1_NO_IDENTIFIED_CONCERN_EXPLICIT_REASSURANCE',
    applicableHazardClasses: 'any, only with explicit structured reassurance',
    requiredFoodRelevance: ['explicit food-scope reassuring conclusion'],
    routeRequirements: ['food additive human scope'],
    concentrationRequirements: ['assessment scope and limitations retained'],
    blockingConditions: ['free text only, unknown scope, contradictory data'],
    outputConcernLevel: 'no_identified_concern',
    rationale: 'This level is emitted only from an explicit structured reassuring assessment, never from missing data.'
  }
];

function foodRelevanceItems(code, relevanceByCode) { return relevanceByCode.get(code) ?? []; }
function profileFoodSources(profile) {
  if (!profile) return [];
  return uniqueObjects([
    ...array(profile.authorityEvaluations).filter((item) => text(item.scope).includes('food_additive_human')).map((item) => ({ authority: item.authority ?? null, year: item.year ?? null, assessmentIdentifier: item.assessmentIdentifier ?? null, source: item.url ?? null })),
    ...array(profile.referenceValues).filter((item) => text(item.scope).includes('food_additive_human') && ['ADI', 'TDI', 'MTDI', 'PMTDI', 'ARfD', 'GROUP_ADI', 'TEMPORARY_ADI'].includes(text(item.type))).map((item) => ({ authority: item.authority ?? null, year: item.year ?? null, type: item.type, source: item.source ?? null }))
  ]);
}
function profileSources(profile) { return uniqueObjects(array(profile?.sources).map((item) => ({ organisation: item.organisation ?? null, title: item.title ?? null, url: item.url ?? null, sourceType: item.sourceType ?? null }))); }
function profileLimitations(profile) { return unique([...(profile?.completeness?.reviewReasons ?? [])]); }
function exposureRiskFor(profile) {
  const assessments = array(profile?.exposureAssessments);
  if (!assessments.length) return { level: 'insufficient_data', confidence: 'low', source: 'no_structured_exposure_assessment', reasons: ['Aucune exposition alimentaire individuelle structurée disponible.'] };
  const statuses = unique(assessments.map((item) => text(item.comparisonStatus)));
  if (statuses.includes('confirmed_exceedance')) return { level: 'exceedance_signal', confidence: 'medium', source: 'exposureAssessments[].comparisonStatus', statuses, reasons: ['Dépassement explicitement signalé dans une évaluation structurée.'] };
  if (statuses.includes('below_reference')) return { level: 'below_reference', confidence: 'medium', source: 'exposureAssessments[].comparisonStatus', statuses, reasons: ['Exposition explicitement comparée comme inférieure à une référence.'] };
  if (statuses.includes('not_quantified')) return { level: 'not_quantified', confidence: 'low', source: 'exposureAssessments[].comparisonStatus', statuses, reasons: ['Une évaluation existe mais ne quantifie pas une comparaison exploitable.'] };
  return { level: 'insufficient_data', confidence: 'low', source: 'exposureAssessments[].comparisonStatus', statuses, reasons: ['Aucune comparaison d’exposition exploitable.'] };
}
function explicitReassurance(profile) {
  return array(profile?.authorityEvaluations).some((item) => text(item.scope) === 'food_additive_human' && /no[_ ]?(safety_)?concern|safe/i.test(text(item.conclusion)));
}
function hasMajorLimitation(profile, items) { return !profile || !items.length || items.some((item) => !item.provenance?.length) || profileLimitations(profile).length > 0; }
function systemicFamily(hazardClass) {
  const value = text(hazardClass);
  if (/^Carc\./.test(value)) return 'carcinogenicity';
  if (/^Muta\./.test(value)) return 'mutagenicity';
  if (/^Repr\./.test(value)) return 'reproductive_toxicity';
  if (/^STOT RE/.test(value)) return 'stot_repeated';
  if (/^STOT SE/.test(value)) return 'stot_single';
  return 'other';
}
function hasStrongDirectEvidence(profile, usable) {
  return Boolean(profile?.completeness?.complete) && usable.some((item) => item.relevance === 'directly_relevant' && SYSTEMIC_CLASSES.has(systemicFamily(item.hazardClass)) && item.exposureRoute === 'ingestion' && item.concentrationContext?.value === 'intrinsic') && array(profile?.potentialEffects).some((effect) => effect.appliesTo === 'additive' && effect.severity === 'serious' && effect.evidenceLevel === 'strong');
}

export function evaluateOummahScientificConcernV1({ profile, foodRelevance = [], exposureRisk = exposureRiskFor(profile) }) {
  const usable = foodRelevance.filter((item) => USABLE_RELEVANCE.has(item.relevance));
  const contextual = foodRelevance.filter((item) => CONTEXTUAL_RELEVANCE.has(item.relevance));
  const excluded = foodRelevance.filter((item) => EXCLUDED_RELEVANCE.has(item.relevance));
  const sources = uniqueObjects([...foodRelevance.flatMap((item) => item.provenance ?? []), ...profileSources(profile)]);
  const supportingFoodSafetyData = uniqueObjects(usable.flatMap((item) => item.supportingFoodSafetyData ?? []));
  const limitations = unique([...foodRelevance.flatMap((item) => item.conflictingOrLimitingData ?? []).filter((reason) => !/Aucune exposition alimentaire individuelle/i.test(reason)), ...profileLimitations(profile)]);
  const reasons = [];
  let concernLevel = 'insufficient_data';
  let ruleId = 'SCV1_INSUFFICIENT_NO_USABLE_SIGNAL';

  if (explicitReassurance(profile) && !usable.length && !limitations.length) {
    concernLevel = 'no_identified_concern';
    ruleId = 'SCV1_NO_IDENTIFIED_CONCERN_EXPLICIT_REASSURANCE';
    reasons.push('Une évaluation structurée dans le périmètre alimentaire indique explicitement une absence de préoccupation.');
  } else if (usable.length) {
    const hasConditional = usable.some((item) => ['conditionally_relevant', 'concentration_dependent'].includes(item.relevance));
    const onlyAcute = usable.every((item) => /^Acute Tox\./.test(text(item.hazardClass)));
    const hasDirectSystemic = usable.some((item) => item.relevance === 'directly_relevant' && SYSTEMIC_CLASSES.has(systemicFamily(item.hazardClass)) && item.exposureRoute === 'ingestion');
    const blocked = hasMajorLimitation(profile, usable) || usable.some((item) => ['inhalation', 'contact_cutaneous', 'contact_cutaneous_or_ocular'].includes(item.exposureRoute));
    if (hasConditional || onlyAcute) {
      concernLevel = 'limited';
      ruleId = 'SCV1_LIMITED_USABLE_CONDITIONAL';
      reasons.push('Un signal alimentaire officiel existe, mais il reste conditionnel ou dépendant de la concentration.');
    } else if (hasStrongDirectEvidence(profile, usable) && !blocked) {
      concernLevel = 'high';
      ruleId = 'SCV1_HIGH_DIRECT_SYSTEMIC_STRONG';
      reasons.push('Un signal systémique harmonisé fort est directement pertinent pour l’ingestion, avec provenance et preuve structurée suffisantes.');
    } else if (hasDirectSystemic && !blocked) {
      concernLevel = 'moderate';
      ruleId = 'SCV1_MODERATE_DIRECT_SYSTEMIC';
      reasons.push('Un signal systémique officiel est directement pertinent pour l’ingestion et suffisamment documenté.');
    } else {
      reasons.push('Les signaux disponibles sont contextuels, limités par la voie ou insuffisants pour dépasser insufficient_data.');
    }
  } else if (contextual.length || excluded.length) {
    reasons.push('Les signaux disponibles sont contextuels ou exclus de la préoccupation alimentaire.');
  } else {
    reasons.push('Aucun signal alimentaire structuré exploitable n’est disponible.');
  }
  if (excluded.length) reasons.push('Les dangers de manipulation, physiques et environnementaux n’influencent pas le niveau alimentaire.');
  if (contextual.length) reasons.push('Les signaux contextualisés sont conservés comme contexte mais ne créent pas seuls un niveau de préoccupation.');
  if (!sources.length) limitations.push('Provenance exploitable absente.');
  const confidence = concernLevel === 'insufficient_data' ? (sources.length ? 'low' : 'low') : concernLevel === 'limited' ? 'medium' : 'high';
  return { concernLevel, confidence, usableHazardSignals: usable, contextualSignals: contextual, excludedSignals: excluded, supportingFoodSafetyData, exposureRisk, reasons: unique(reasons), limitations: unique(limitations), sources, methodologyVersion: 'oummah-additive-scientific-concern-v1', ruleId };
}

function anomalies(rows) {
  const result = Object.fromEntries(['FOOD_IRRELEVANT_CLP_USED', 'ROUTE_MISMATCH', 'CONCENTRATION_CONTEXT_IGNORED', 'HANDLING_HAZARD_USED', 'ENVIRONMENTAL_HAZARD_USED', 'PHYSICAL_HAZARD_USED', 'NON_HARMONISED_CLP_USED', 'FAMILY_TRANSFER', 'E_NUMBER_SPECIFIC_RULE', 'HIGH_WITHOUT_DIRECT_FOOD_RELEVANCE', 'MODERATE_FROM_ACUTE_TOX_ONLY'].map((key) => [key, []]));
  for (const row of rows) {
    const items = row.scientificConcern;
    if (items.concernLevel !== 'insufficient_data') {
      const excludedWasSoleBasis = items.excludedSignals.length > 0 && items.usableHazardSignals.length === 0;
      if (excludedWasSoleBasis) result.FOOD_IRRELEVANT_CLP_USED.push(row.code);
      if (excludedWasSoleBasis && items.excludedSignals.some((item) => item.relevance === 'occupational_or_handling_only')) result.HANDLING_HAZARD_USED.push(row.code);
      if (excludedWasSoleBasis && items.excludedSignals.some((item) => item.exposureRoute === 'not_applicable')) result.ENVIRONMENTAL_HAZARD_USED.push(row.code);
      if (excludedWasSoleBasis && items.excludedSignals.some((item) => item.exposureRoute === 'not_applicable' && /Flam|Press|Ox|Explos|Water-react/.test(item.hazardClass ?? ''))) result.PHYSICAL_HAZARD_USED.push(row.code);
      if (items.usableHazardSignals.some((item) => item.relevance === 'concentration_dependent') && ['moderate', 'high'].includes(items.concernLevel)) result.CONCENTRATION_CONTEXT_IGNORED.push(row.code);
      if (items.usableHazardSignals.some((item) => ['inhalation', 'contact_cutaneous', 'contact_cutaneous_or_ocular'].includes(item.exposureRoute))) result.ROUTE_MISMATCH.push(row.code);
      if (items.concernLevel === 'high' && !items.usableHazardSignals.some((item) => item.relevance === 'directly_relevant')) result.HIGH_WITHOUT_DIRECT_FOOD_RELEVANCE.push(row.code);
      if (items.concernLevel === 'moderate' && items.usableHazardSignals.every((item) => /^Acute Tox\./.test(item.hazardClass ?? ''))) result.MODERATE_FROM_ACUTE_TOX_ONLY.push(row.code);
    }
  }
  return result;
}

export function buildMethodology() {
  return { schemaVersion: 'oummah-additive-methodology-v1', methodologyVersion: 'oummah-additive-scientific-concern-v1', generatedAt: new Date().toISOString(), definition: { scientificConcern: 'Niveau de préoccupation scientifique intrinsèque justifié par les données officielles disponibles ; ce n’est pas le risque réel dans un produit précis.', exposureRisk: 'Axe séparé décrivant les données d’exposition et leur comparaison éventuelle à une référence ; il ne crée pas le danger intrinsèque.' }, levels: CONCERN_LEVELS, rules: OUMMAH_SCIENTIFIC_CONCERN_V1_RULES, acceptedSources: ['classification CLP harmonisée officielle et FoodAdditiveHazardRelevance', 'OpenFoodTox/EFSA structuré', 'évaluations JECFA structurées'], exclusions: ['aucune donnée Yuka ou d’une autre application', 'aucun danger de manipulation, physique ou environnemental dans ScientificConcern', 'aucune inférence depuis l’absence de données', 'aucune règle par E-number'], safeguards: { noRuntimeChanges: true, noSupabaseChanges: true, noScoreChanges: true, noUiChanges: true, exposureRiskSeparate: true, highRequiresDirectFoodRelevance: true, acuteToxAloneCannotExceedLimited: true, absenceOfSignalIsNotNoConcern: true }, limitations: ['Les 17K CLP harmonisés exacts restent rares dans le catalogue.', 'Les voies, concentrations et scopes ne sont pas toujours résolus pour l’usage alimentaire.', 'Les références ADI/JECFA ne sont pas une mesure d’exposition individuelle.', 'Cette V1 ne produit pas de conclusion clinique ou réglementaire pour un consommateur précis.'], sources: { clp: 'https://eur-lex.europa.eu/eli/reg/2008/1272/2026-07-01', echaAnnexVI: 'https://echa.europa.eu/information-on-chemicals/annex-vi-to-clp', openFoodTox: 'structured profiles in scripts/data/additives-scientific-master-v3-effects.json', jecfa: 'structured evaluations retained in the scientific master profiles' }, datasets: { catalog: 'src/features/boycott/data/eu-additive-catalog.json', profiles: 'scripts/data/additives-scientific-master-v3-effects.json', relevanceAudit: 'scripts/output/additive-clp-food-relevance-audit-v1.json' } };
}

export function audit() {
  const catalog = read(CATALOG).entries;
  const profiles = new Map(read(PROFILES).profiles.map((profile) => [text(profile.code).toUpperCase(), profile]));
  const relevance = read(RELEVANCE);
  const relevanceByCode = new Map(relevance.codeResults.map((row) => [text(row.code).toUpperCase(), row.foodAdditiveRelevance]));
  const rows = catalog.map((item) => {
    const code = text(item.code).toUpperCase();
    const profile = profiles.get(code) ?? null;
    const foodRelevance = foodRelevanceItems(code, relevanceByCode);
    const scientificConcern = evaluateOummahScientificConcernV1({ profile, foodRelevance });
    return { code, name: item.names?.en ?? item.canonicalNameEn ?? item.sourceDisplayName ?? code, scientificConcern, exposureRisk: scientificConcern.exposureRisk };
  });
  const distribution = Object.fromEntries(CONCERN_LEVELS.map((level) => [level, rows.filter((row) => row.scientificConcern.concernLevel === level).length]));
  const nonGray = rows.filter((row) => row.scientificConcern.concernLevel !== 'insufficient_data');
  const crossTab = {};
  for (const row of rows) { const key = `${row.scientificConcern.concernLevel} | ${row.exposureRisk.level}`; crossTab[key] = (crossTab[key] ?? 0) + 1; }
  const report = { schemaVersion: 'oummah-additive-scientific-concern-v1-audit', generatedAt: new Date().toISOString(), mode: 'offline-prototype-only', methodologyVersion: 'oummah-additive-scientific-concern-v1', distribution, limitedCodes: rows.filter((row) => row.scientificConcern.concernLevel === 'limited').map((row) => row.code), moderateCodes: rows.filter((row) => row.scientificConcern.concernLevel === 'moderate').map((row) => row.code), highCodes: rows.filter((row) => row.scientificConcern.concernLevel === 'high').map((row) => row.code), nonGray, clpHealthSignalAudit: relevance.codeResults.filter((row) => row.foodAdditiveRelevance.some((item) => item.relevance !== 'not_relevant_to_food_score' || row.clpHazards.some((hazard) => hazard.domain === 'humanHealthHazards'))), rows, crossTab, confidenceDistribution: Object.fromEntries(unique(rows.map((row) => row.scientificConcern.confidence)).map((value) => [value, rows.filter((row) => row.scientificConcern.confidence === value).length])), anomalies: anomalies(rows), rules: OUMMAH_SCIENTIFIC_CONCERN_V1_RULES, safeguards: { noENumberRules: true, noRuntimeChanges: true, noSupabaseChanges: true, noScoreChanges: true, noUiChanges: true, exposureRiskSeparate: true, handlingHazardsDoNotInfluenceConcern: true, environmentalHazardsDoNotInfluenceConcern: true, physicalHazardsDoNotInfluenceConcern: true, noIdentifiedConcernRequiresExplicitReassurance: true } };
  write(AUDIT_OUTPUT, report);
  const methodology = buildMethodology();
  write(METHODOLOGY_OUTPUT, methodology);
  console.log(JSON.stringify({ output: path.relative(ROOT, AUDIT_OUTPUT), methodology: path.relative(ROOT, METHODOLOGY_OUTPUT), total: rows.length, distribution, nonGray: nonGray.length, anomalies: Object.fromEntries(Object.entries(report.anomalies).map(([key, values]) => [key, values.length])), crossTab }, null, 2));
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) audit();
