#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASIS_PATH = path.join(ROOT, 'scripts/output/additive-hazard-evidence-basis-audit-v1.json');
const OUTPUT = path.join(ROOT, 'scripts/output/additive-official-hazard-evidence-framework-audit-v1.json');
const CONTROL_CODES = ['E102', 'E122', 'E124', 'E129', 'E132', 'E133', 'E171'];
const ALLOWED_CLASSES = new Set(['carcinogenicity', 'genotoxicity', 'reproductive', 'developmental', 'neurotoxicity', 'organ_toxicity', 'haematological', 'immunological', 'endocrine_related', 'gastrointestinal', 'metabolic', 'general_toxicity', 'other', 'unknown']);

const methodologySources = [
  { organisation: 'EFSA', documentTitle: 'Guidance on the use of the weight of evidence approach in scientific assessments', year: 2017, url: 'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2017.4971', methodologyArea: 'weight of evidence; relevance; reliability; consistency; lines of evidence' },
  { organisation: 'EFSA', documentTitle: 'Guidance on the assessment of the biological relevance of data in scientific assessments', year: 2017, url: 'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2017.4970', methodologyArea: 'biological relevance; adverse effect; uncertainty' },
  { organisation: 'EFSA', documentTitle: 'Uncertainty in scientific assessments', year: 2022, url: 'https://www.efsa.europa.eu/en/topics/topic/uncertainty-scientific-assessments', methodologyArea: 'uncertainty analysis and communication' },
  { organisation: 'ECHA', documentTitle: 'Guidance on the Application of the CLP Criteria', year: null, url: 'https://echa.europa.eu/guidance-documents/guidance-on-clp-application-criteria', methodologyArea: 'health hazard classification criteria' },
  { organisation: 'European Union', documentTitle: 'Regulation (EC) No 1272/2008 (CLP), Annex I', year: 2008, url: 'https://eur-lex.europa.eu/eli/reg/2008/1272/2017-06-01', methodologyArea: 'carcinogenicity; germ cell mutagenicity; reproductive toxicity; STOT' },
  { organisation: 'OECD', documentTitle: 'Guiding Principles and Key Elements for Establishing a Weight of Evidence for Chemical Assessment', year: 2019, url: 'https://www.oecd.org/en/publications/guiding-principles-and-key-elements-for-establishing-a-weight-of-evidence-for-chemical-assessment_69b366a9-en.html', methodologyArea: 'transparent weight-of-evidence process' },
  { organisation: 'IARC', documentTitle: 'Preamble to the IARC Monographs', year: 2019, url: 'https://monographs.iarc.who.int/iarc-monographs-preamble-preamble-to-the-iarc-monographs/', methodologyArea: 'carcinogenic hazard only; human, animal and mechanistic evidence' },
];

function unique(values) { return [...new Set(values.filter(Boolean))]; }
function count(items, predicate) { return items.filter(predicate).length; }
function rawLabels(item) { return unique(item.criticalEndpoints.flatMap((endpoint) => endpoint.sourceEndpointLabels ?? [])); }
function hasStructuredEvidence(item) { return item.provenanceComplete && item.studyContexts.length > 0 && item.species.length > 0 && (item.reliabilitySignals.length > 0 || item.uncertaintySignals.length > 0); }
function hasConditionalSeverityBasis(item) { return item.criticalEndpoints.length > 0 && item.referencePoints.length > 0 && item.studyContexts.length > 0 && item.species.length > 0; }

function frameworkForLabel(rawEndpointType, currentNormalizedClass) {
  const value = rawEndpointType.toLowerCase();
  if (/reproduction|reproductive/.test(value)) return { framework: 'EU CLP / ECHA', hazardClass: 'reproductive toxicity', categorySystem: '1A / 1B / 2', criteriaAvailable: true, mappingFeasibility: 'conditional', reason: 'Le libellé indique un domaine CLP pertinent, mais les critères complets et la classification officielle ne sont pas présents dans la base.' };
  if (/chronic toxicity|sub-chronic toxicity|repeated dose/.test(value)) return { framework: 'EU CLP / ECHA', hazardClass: 'STOT repeated exposure', categorySystem: '1 / 2', criteriaAvailable: true, mappingFeasibility: 'conditional', reason: 'Le type d’étude est pertinent pour STOT, mais il manque les éléments complets de classification : organe cible, pertinence, dose et critères CLP.' };
  if (/additional toxicological information|livestock|pets/.test(value)) return { framework: 'EFSA / OpenFoodTox', hazardClass: null, categorySystem: null, criteriaAvailable: false, mappingFeasibility: 'not_supported', reason: 'Le libellé ne constitue pas une classe de danger réglementaire directement transposable.' };
  return { framework: currentNormalizedClass === 'unknown' ? null : 'EFSA / ECHA', hazardClass: null, categorySystem: null, criteriaAvailable: false, mappingFeasibility: 'not_supported', reason: 'Le libellé brut ne permet pas d’identifier une classe réglementaire applicable sans données supplémentaires.' };
}

function buildMappings(basis) {
  const entries = new Map();
  for (const item of basis.basisByCode) for (const endpoint of item.criticalEndpoints) for (const raw of endpoint.sourceEndpointLabels ?? []) {
    const key = `${raw}::${endpoint.normalizedEndpointClass}`;
    if (!entries.has(key)) entries.set(key, { rawEndpointType: raw, currentNormalizedClass: endpoint.normalizedEndpointClass, officialFrameworkMatch: frameworkForLabel(raw, endpoint.normalizedEndpointClass) });
  }
  return [...entries.values()].sort((a, b) => a.rawEndpointType.localeCompare(b.rawEndpointType));
}

function controlCheck(item, mappings) {
  const labels = rawLabels(item);
  return { code: item.code, rawEndpointLabels: labels, currentNormalizedClasses: unique(item.criticalEndpoints.map((endpoint) => endpoint.normalizedEndpointClass)), officialFrameworks: mappings.filter((mapping) => labels.includes(mapping.rawEndpointType)).map((mapping) => mapping.officialFrameworkMatch), severityDerivable: hasConditionalSeverityBasis(item) ? 'CONDITIONAL' : 'NO', evidenceDerivable: hasStructuredEvidence(item) ? 'CONDITIONAL' : 'NO', missingInformation: unique([
    item.criticalEndpoints.length ? null : 'critical endpoint structuré',
    item.referencePoints.length ? null : 'point de référence exploitable',
    item.studyContexts.length ? null : 'contexte d’étude',
    item.species.length ? null : 'espèce',
    item.reliabilitySignals.length || item.uncertaintySignals.length ? null : 'reliability/incertitude',
    item.assessmentSources.length ? null : 'source d’évaluation',
  ]) };
}

function main() {
  const basis = JSON.parse(fs.readFileSync(BASIS_PATH, 'utf8'));
  const items = basis.basisByCode;
  const mappings = buildMappings(basis);
  const severityConditional = items.filter(hasConditionalSeverityBasis);
  const evidenceConditional = items.filter(hasStructuredEvidence);
  const rawLabelCounts = new Map(); for (const item of items) for (const label of rawLabels(item)) rawLabelCounts.set(label, (rawLabelCounts.get(label) ?? 0) + 1);
  const rawEndpointAudit = { rawEndpointLabelsDistinct: rawLabelCounts.size, labelsMostFrequent: [...rawLabelCounts.entries()].sort((a, b) => b[1] - a[1]).map(([label, occurrences]) => ({ label, occurrences })), currentClassDistribution: basis.endpointClassDistribution, taxonomyAssessment: { directClassesObserved: ['reproductive', 'general_toxicity', 'unknown'], absentInCurrentLabels: ['carcinogenicity', 'genotoxicity', 'developmental', 'neurotoxicity', 'organ_toxicity', 'haematological', 'immunological', 'endocrine_related', 'gastrointestinal', 'metabolic'], conclusion: 'La taxonomie actuelle couvre peu de libellés bruts : elle reste descriptive et ne doit pas être traitée comme une gravité.' } };
  const report = { schemaVersion: 'additive-official-hazard-evidence-framework-audit-v1', mode: 'methodology-audit-only', officialFrameworks: [
    { organisation: 'EFSA', scope: 'weight of evidence, relevance, biological relevance and uncertainty', finding: 'Le poids de preuve intègre pertinence, fiabilité, cohérence et jugement expert ; il ne fournit pas une échelle universelle automatique.', sourceUrls: methodologySources.filter((source) => source.organisation === 'EFSA').map((source) => source.url) },
    { organisation: 'ECHA / EU CLP', scope: 'classification of intrinsic health hazards', finding: 'Le CLP fournit des classes et catégories avec critères explicites pour certains dangers, notamment CMR et STOT ; il ne transforme pas un endpoint OpenFoodTox incomplet en classification.', sourceUrls: methodologySources.filter((source) => ['ECHA', 'European Union'].includes(source.organisation)).map((source) => source.url) },
    { organisation: 'OECD', scope: 'weight of evidence for chemical assessment', finding: 'Le WoE est un processus transparent d’intégration de lignes de preuve ; il dépend de la question, de la pertinence, de la fiabilité et de la cohérence.', sourceUrls: methodologySources.filter((source) => source.organisation === 'OECD').map((source) => source.url) },
    { organisation: 'IARC', scope: 'carcinogenic hazard identification only', finding: 'IARC distingue la force des preuves humaines, animales et mécanistiques pour l’identification du danger cancérogène ; ce cadre ne doit pas être généralisé aux autres endpoints.', sourceUrls: methodologySources.filter((source) => source.organisation === 'IARC').map((source) => source.url) },
  ],
  criticalEndpointMeaning: { conclusion: 'CriticalEndpoint désigne un endpoint retenu comme déterminant ou relié à une valeur toxicologique de référence dans le dossier ; il ne signifie pas automatiquement effet grave.', severityInference: 'NOT_SUPPORTED without the linked endpoint interpretation, study results, relevance and official classification criteria.' },
  referencePointMeaning: { NOAEL: 'dose sans effet indésirable observé dans les conditions de l’étude ; ne mesure pas à elle seule la gravité intrinsèque.', LOAEL: 'dose minimale avec effet indésirable observé dans les conditions de l’étude ; ne constitue pas une catégorie de danger.', BMD: 'dose issue d’un modèle dose-réponse à partir d’un niveau de réponse défini ; dépend du modèle et du point de réponse.', BMDL: 'borne inférieure de confiance de la BMD ; exprime l’incertitude statistique du point de départ, pas une gravité.', conclusion: 'Aucun de ces points de départ ne doit être converti directement en severity.' },
  evidenceMethodology: { dimensions: ['relevance', 'reliability', 'consistency', 'uncertainty', 'biological relevance', 'convergence of lines of evidence'], humanAnimalInVitro: 'Les cadres officiels n’assignent pas automatiquement human=strong, animal=moderate ou in_vitro=limited ; le poids dépend de la question, de la pertinence, de la qualité, de la cohérence et de l’extrapolation.', possibleOummahScale: 'Une échelle OUMMAH limited/moderate/strong serait au minimum CONDITIONAL et nécessiterait une règle documentée de WoE, pas un simple comptage des types d’études.' },
  rawEndpointAudit,
  frameworkMappings: mappings,
  severityFeasibility: { direct: 0, conditional: severityConditional.length, notSupported: items.length - severityConditional.length, signal: 'CONDITIONAL', rationale: 'Les cadres CLP/ECHA sont utilisables conditionnellement pour certains types, mais aucun code ne possède une classification réglementaire complète dans HazardEvidenceBasis.' },
  evidenceFeasibility: { direct: 0, conditional: evidenceConditional.length, notSupported: items.length - evidenceConditional.length, signal: 'CONDITIONAL', rationale: 'EFSA/OECD définissent un processus WoE, mais la base ne contient pas encore toutes les évaluations de pertinence, fiabilité, cohérence et incertitude nécessaires à une attribution automatique.' },
  potentialCoverage: { codesPotentiallyClassifiableForSeverity: severityConditional.length, codesPotentiallyClassifiableForEvidence: evidenceConditional.length, codesPotentiallyClassifiableForBoth: items.filter((item) => hasConditionalSeverityBasis(item) && hasStructuredEvidence(item)).length, codesStillInsufficient: items.filter((item) => item.evidenceBasisStatus === 'insufficient').length, interpretation: 'Ces nombres désignent des candidats à une évaluation méthodologique conditionnelle, pas des classifications produites.' },
  sevenCodeChecks: CONTROL_CODES.map((code) => controlCheck(items.find((item) => item.code === code), mappings)),
  methodologySources,
  recommendedArchitecture: { deriveHazardSeverityFromOfficialFramework: { status: 'PAPER_ONLY', inputs: ['criticalEndpoints', 'sourceEndpointLabels', 'linked study results', 'study context', 'species', 'reference points', 'official classification fields', 'relevance and uncertainty'], frameworks: ['EU CLP / ECHA for applicable hazard classes', 'EFSA biological relevance and uncertainty guidance', 'IARC only for carcinogenicity'], conditions: ['require explicit class-relevant data', 'keep hazard separate from exposure and risk', 'return unknown when criteria or provenance are incomplete'], forbiddenShortcuts: ['CriticalEndpoint -> serious', 'NOAEL/BMDL -> severity', 'human/animal/in_vitro -> fixed evidence level'] }, deriveEvidenceStrengthFromOfficialFramework: { status: 'PAPER_ONLY', inputs: ['lines of evidence', 'relevance', 'reliability', 'consistency', 'uncertainty', 'biological relevance', 'study context'], frameworks: ['EFSA WoE guidance', 'OECD WoE principles', 'IARC only for carcinogenic evidence'], conditions: ['formulate the assessment question', 'document included and excluded evidence', 'integrate lines of evidence transparently', 'return unknown when reliability/relevance/consistency are not assessable'] }, unknownPolicy: 'Toute donnée insuffisante, ambiguë ou non reliée conserve unknown et ne reçoit aucune gravité ou preuve automatique.' },
  conclusion: { scientificConcernRule: 'PARTIALLY', reason: 'Les cadres officiels existent et permettent une méthode conditionnelle, mais OpenFoodTox ne fournit pas encore systématiquement les critères de classification, la pertinence biologique, la cohérence et la qualité détaillée nécessaires à une règle générale automatique.' },
  validation: { basisModified: false, profilesModified: false, potentialEffectsModified: false, severityCreated: false, evidenceLevelCreated: false, riskEngineModified: false, supabaseUpsertPerformed: false, uiModified: false } };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true }); fs.writeFileSync(OUTPUT, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: path.relative(ROOT, OUTPUT), rawLabels: rawLabelCounts.size, mappings: mappings.length, severityConditional: severityConditional.length, evidenceConditional: evidenceConditional.length, both: report.potentialCoverage.codesPotentiallyClassifiableForBoth }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
