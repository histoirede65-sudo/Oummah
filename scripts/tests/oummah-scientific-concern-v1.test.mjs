import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMethodology, evaluateOummahScientificConcernV1 } from '../additives/audit-oummah-scientific-concern-v1.mjs';

const provenance = [{ sourceLocation: 'Annex VI / Part 3 / Table 3' }];
const profile = (overrides = {}) => ({ code: 'E000', completeness: { complete: true, reviewReasons: [] }, sources: [{ url: 'https://example.test/source' }], authorityEvaluations: [], exposureAssessments: [], potentialEffects: [], ...overrides });
const signal = (overrides = {}) => ({ hazardClass: 'Skin Corr. 1A', relevance: 'occupational_or_handling_only', exposureRoute: 'contact_cutaneous_or_ocular', concentrationContext: { value: 'intrinsic', values: [] }, provenance, ...overrides });

test('un signal de manipulation seul reste insufficient_data', () => {
  assert.equal(evaluateOummahScientificConcernV1({ profile: profile(), foodRelevance: [signal()] }).concernLevel, 'insufficient_data');
});

test('un signal contextualisé seul reste insufficient_data', () => {
  assert.equal(evaluateOummahScientificConcernV1({ profile: profile(), foodRelevance: [signal({ relevance: 'route_specific', exposureRoute: 'inhalation' })] }).concernLevel, 'insufficient_data');
});

test('Acute Tox. orale concentration-dependent est au maximum limited', () => {
  const result = evaluateOummahScientificConcernV1({ profile: profile(), foodRelevance: [signal({ hazardClass: 'Acute Tox. 4 *', relevance: 'concentration_dependent', exposureRoute: 'ingestion', concentrationContext: { value: 'concentration_dependent', values: [] } })] });
  assert.equal(result.concernLevel, 'limited');
  assert.notEqual(result.concernLevel, 'moderate');
  assert.notEqual(result.concernLevel, 'high');
});

test('une voie inhalation seule ne crée pas de préoccupation alimentaire', () => {
  assert.equal(evaluateOummahScientificConcernV1({ profile: profile(), foodRelevance: [signal({ relevance: 'route_specific', exposureRoute: 'inhalation' })] }).concernLevel, 'insufficient_data');
});

test('les signaux environnementaux et physiques sont sans effet', () => {
  const foodRelevance = [signal({ relevance: 'not_relevant_to_food_score', exposureRoute: 'not_applicable', hazardClass: 'Aquatic Acute 1' }), signal({ relevance: 'not_relevant_to_food_score', exposureRoute: 'not_applicable', hazardClass: 'Press. Gas' })];
  assert.equal(evaluateOummahScientificConcernV1({ profile: profile(), foodRelevance }).concernLevel, 'insufficient_data');
});

test('un CLP non harmonisé ou absent ne crée aucun niveau', () => {
  assert.equal(evaluateOummahScientificConcernV1({ profile: profile(), foodRelevance: [] }).concernLevel, 'insufficient_data');
});

test('no_identified_concern exige une réassurance structurée explicite', () => {
  const without = evaluateOummahScientificConcernV1({ profile: profile(), foodRelevance: [] });
  const withReassurance = evaluateOummahScientificConcernV1({ profile: profile({ authorityEvaluations: [{ scope: 'food_additive_human', conclusion: 'no_safety_concern_at_assessed_exposure' }], exposureAssessments: [{ comparisonStatus: 'below_reference' }] }), foodRelevance: [] });
  assert.equal(without.concernLevel, 'insufficient_data');
  assert.equal(withReassurance.concernLevel, 'no_identified_concern');
});

test('moderate est possible uniquement pour un signal systémique directement alimentaire', () => {
  const result = evaluateOummahScientificConcernV1({ profile: profile(), foodRelevance: [signal({ hazardClass: 'STOT RE 1', relevance: 'directly_relevant', exposureRoute: 'ingestion', concentrationContext: { value: 'intrinsic', values: [] } })] });
  assert.equal(result.concernLevel, 'moderate');
});

test('high exige la preuve directe forte et ne vient jamais de Acute Tox. seule', () => {
  const high = evaluateOummahScientificConcernV1({ profile: profile({ potentialEffects: [{ appliesTo: 'additive', severity: 'serious', evidenceLevel: 'strong' }] }), foodRelevance: [signal({ hazardClass: 'Carc. 1B', relevance: 'directly_relevant', exposureRoute: 'ingestion', concentrationContext: { value: 'intrinsic', values: [] } })] });
  const acute = evaluateOummahScientificConcernV1({ profile: profile(), foodRelevance: [signal({ hazardClass: 'Acute Tox. 3', relevance: 'conditionally_relevant', exposureRoute: 'ingestion', concentrationContext: { value: 'intrinsic', values: [] } })] });
  assert.equal(high.concernLevel, 'high');
  assert.notEqual(acute.concernLevel, 'high');
});

test('ExposureRisk reste un axe séparé', () => {
  const result = evaluateOummahScientificConcernV1({ profile: profile(), foodRelevance: [], exposureRisk: { level: 'exceedance_signal', confidence: 'medium' } });
  assert.equal(result.concernLevel, 'insufficient_data');
  assert.equal(result.exposureRisk.level, 'exceedance_signal');
});

test('aucune règle ne dépend du code E', () => {
  const input = { profile: profile(), foodRelevance: [signal({ hazardClass: 'Eye Irrit. 2' })] };
  assert.equal(evaluateOummahScientificConcernV1({ ...input, profile: profile({ code: 'E171' }) }).concernLevel, evaluateOummahScientificConcernV1({ ...input, profile: profile({ code: 'E999' }) }).concernLevel);
});

test('la méthodologie et sa version sont présentes', () => {
  const methodology = buildMethodology();
  assert.equal(methodology.methodologyVersion, 'oummah-additive-scientific-concern-v1');
  assert.ok(methodology.rules.length >= 5);
  assert.equal(methodology.safeguards.exposureRiskSeparate, true);
});
