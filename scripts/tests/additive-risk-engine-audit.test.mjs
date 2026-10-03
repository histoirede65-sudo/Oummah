import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptProfile, loadCurrentEngine } from '../additives/audit-additive-risk-engine.mjs';

const source = { sourceId: 'test', organisation: 'EFSA', sourceType: 'official_information', title: 'Test', url: 'https://example.org/test', retrievedAt: '2026-09-30', fieldsSupported: ['assessment'] };
const profile = (overrides = {}) => adaptProfile({ code: 'E999', names: { en: 'Test additive' }, sources: [source], evidenceLevel: 'strong', completeness: { complete: true }, authorityEvaluations: [{ authority: 'EFSA', conclusion: 'Conclusion' }], potentialEffects: [], referenceValues: [], ...overrides }, 'Test additive').profile;
const engine = await loadCurrentEngine();

test('profil manquant = insufficient_data', () => {
  assert.equal(engine(undefined).riskLevel, 'insufficient_data');
});

test('profil documenté sans effet ni conclusion rassurante n’est pas automatiquement safe', () => {
  const result = engine(profile({ authorityEvaluations: [{ authority: 'EFSA', conclusion: '' }] }));
  assert.notEqual(result.riskLevel, 'safe');
});

test('effet serious + strong + exposition concerning = high', () => {
  const result = engine(profile({ assessment: { severity: 'serious', evidenceStrength: 'strong', exposureConcern: 'concerning', classification: 'high_concern', conclusion: 'Signal', sources: [] }, potentialEffects: [{ effect: 'Effet grave', severity: 'serious', evidenceLevel: 'strong', appliesTo: 'additive' }], exposure: { estimatedExposure: 'concerning' } }));
  assert.equal(result.riskLevel, 'high');
});

test('serious + limited n’est pas high', () => {
  const result = engine(profile({ assessment: { severity: 'serious', evidenceStrength: 'limited', exposureConcern: 'concerning', classification: 'limited_concern', conclusion: 'Signal', sources: [] }, evidenceLevel: 'limited', potentialEffects: [{ effect: 'Effet grave', severity: 'serious', evidenceLevel: 'limited', appliesTo: 'additive' }], exposure: { estimatedExposure: 'concerning' } }));
  assert.notEqual(result.riskLevel, 'high');
});

test('serious + strong + unlikely n’est pas high', () => {
  const result = engine(profile({ assessment: { severity: 'serious', evidenceStrength: 'strong', exposureConcern: 'unlikely', classification: 'limited_concern', conclusion: 'Signal', sources: [] }, potentialEffects: [{ effect: 'Effet grave', severity: 'serious', evidenceLevel: 'strong', appliesTo: 'additive' }], exposure: { estimatedExposure: 'unlikely' } }));
  assert.notEqual(result.riskLevel, 'high');
});

test('un contaminant serious isolé ne produit pas high pour l’additif', () => {
  const result = engine(profile({ potentialEffects: [{ effect: 'Contaminant', severity: 'serious', evidenceLevel: 'strong', appliesTo: 'contaminant' }], exposure: { estimatedExposure: 'concerning' } }));
  assert.notEqual(result.riskLevel, 'high');
});

test('une évaluation familiale seule n’est pas high individuel automatique', () => {
  const result = engine(profile({ authorityEvaluations: [{ authority: 'EFSA', conclusion: '', assessmentScope: 'family', coveredCodes: ['E150A', 'E150B'] }] }));
  assert.notEqual(result.riskLevel, 'high');
});

test('NOT LIMITED n’est pas automatiquement safe', () => {
  const result = engine(profile({ referenceValues: [{ type: 'not_limited', authority: 'JECFA' }], authorityEvaluations: [{ authority: 'JECFA', conclusion: '' }] }));
  assert.notEqual(result.riskLevel, 'safe');
});

test('NOT SPECIFIED n’est pas automatiquement safe', () => {
  const result = engine(profile({ referenceValues: [{ type: 'not_specified', authority: 'JECFA' }], authorityEvaluations: [{ authority: 'JECFA', conclusion: '' }] }));
  assert.notEqual(result.riskLevel, 'safe');
});

test('GROUP ADI conserve son scope dans l’adaptation offline', () => {
  const adapted = adaptProfile({ code: 'E999', names: { en: 'Test additive' }, sources: [source], evidenceLevel: 'strong', completeness: { complete: true }, referenceValues: [{ type: 'group_ADI', scope: 'group', rawText: 'Group ADI' }], authorityEvaluations: [] }, 'Test additive');
  assert.equal(adapted.references[0].scope, 'group');
  assert.equal(adapted.references[0].type, 'group_ADI');
});

function modernProfile(assessments, legacyExposure = 'concerning') {
  return { ...profile({ assessment: { severity: 'none', evidenceStrength: 'strong', exposureConcern: legacyExposure, classification: 'insufficient_data', conclusion: '', sources: [] }, exposureAssessments: assessments }), exposureAssessments: assessments };
}

test('modern below_reference devient below_concern', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ comparisonStatus: 'below_reference', authorityConclusion: 'no_explicit_conclusion' }])).level, 'below_concern'));
test('modern within_reference devient below_concern', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ comparisonStatus: 'within_reference' }])).level, 'below_concern'));
test('modern confirmed_exceedance devient concerning', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ comparisonStatus: 'confirmed_exceedance' }])).level, 'concerning'));
test('modern possible_exceedance devient possible_concern', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ comparisonStatus: 'possible_exceedance' }])).level, 'possible_concern'));
test('conclusion no concern devient below_concern', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ authorityConclusion: 'no_safety_concern_at_assessed_exposure' }])).level, 'below_concern'));
test('conclusion concern populations devient possible_concern', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ authorityConclusion: 'concern_for_some_populations' }])).level, 'possible_concern'));
test('incertitude seule reste unknown', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ authorityConclusion: 'exposure_may_be_underestimated', exposureUncertainty: ['exposure_may_be_underestimated'] }])).level, 'unknown'));
test('valeur numérique seule reste unknown', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ exposureValues: [{ value: 5, unit: 'mg/kg bw/day' }] }])).level, 'unknown'));
test('reference seule reste unknown', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ referenceValues: [{ type: 'ADI', upper: 40 }] }])).level, 'unknown'));
test('le scénario le plus préoccupant est conservé', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ comparisonStatus: 'below_reference' }, { comparisonStatus: 'confirmed_exceedance' }])).level, 'concerning'));
test('comparison rassurante et incertitude conservent les deux informations', () => { const result = engine.deriveExposureAssessment(modernProfile([{ comparisonStatus: 'below_reference', exposureUncertainty: ['exposure_may_be_underestimated'] }])); assert.equal(result.level, 'below_concern'); assert.ok(result.reasons.some((reason) => reason.includes('Exposure uncertainty'))); });
test('modern data is prioritaire sur legacy contradictoire', () => assert.equal(engine.deriveExposureAssessment(modernProfile([{ comparisonStatus: 'below_reference' }], 'concerning')).level, 'below_concern'));
test('sans modern data le fallback legacy reste inchangé', () => assert.equal(engine.deriveExposureAssessment(profile({ assessment: { severity: 'none', evidenceStrength: 'strong', exposureConcern: 'possible', classification: 'x', conclusion: '', sources: [] } })).level, 'possible_concern'));
