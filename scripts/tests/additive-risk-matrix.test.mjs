import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptProfile, loadCurrentEngine } from '../additives/audit-additive-risk-engine.mjs';

const source = { sourceId: 'matrix-test', organisation: 'EFSA', sourceType: 'official_information', title: 'Matrix test', url: 'https://example.org/matrix', retrievedAt: '2026-09-30', fieldsSupported: ['assessment'] };
const engine = await loadCurrentEngine();
const profile = (hazard, evidence, exposure) => {
  const potentialEffects = hazard === 'none_identified' ? [{ effect: 'No identified direct hazard', severity: 'none', evidenceLevel: evidence, appliesTo: 'additive', normalization: { severitySource: 'explicit' }, source: { authority: 'EFSA' } }] : hazard === 'unknown' ? [{ effect: 'Secondary signal', severity: 'serious', evidenceLevel: evidence, appliesTo: 'contaminant' }] : [{ effect: 'Direct signal', severity: hazard, evidenceLevel: evidence, appliesTo: 'additive' }];
  const adapted = adaptProfile({ code: 'E999', names: { en: 'Matrix test' }, sources: [source], evidenceLevel: evidence, completeness: { complete: true }, authorityEvaluations: [{ authority: 'EFSA', conclusion: 'Conclusion' }], potentialEffects, referenceValues: [], assessment: { severity: hazard === 'none_identified' ? 'none' : hazard, evidenceStrength: evidence, exposureConcern: exposure, classification: 'insufficient_data', conclusion: '', sources: [] }, exposure: { estimatedExposure: exposure } }, 'Matrix test').profile;
  adapted.potentialEffects = potentialEffects;
  return adapted;
};

test('la matrice fournit une décision explicite pour les 100 combinaisons', () => {
  const coverage = engine.getRiskMatrixCoverage();
  assert.equal(coverage.length, 100);
  assert.equal(new Set(coverage.map((item) => `${item.hazard}|${item.evidence}|${item.exposure}`)).size, 100);
  assert.ok(coverage.every((item) => ['safe', 'limited', 'moderate', 'high', 'insufficient_data'].includes(item.riskLevel)));
});

const cases = [
  ['none_identified + strong + below_concern', 'none_identified', 'strong', 'below_concern', 'safe'],
  ['none_identified + moderate + below_concern', 'none_identified', 'moderate', 'below_concern', 'safe'],
  ['none_identified + limited + below_concern', 'none_identified', 'limited', 'below_concern', 'limited'],
  ['none_identified + strong + concerning', 'none_identified', 'strong', 'concerning', 'moderate'],
  ['low + moderate + below_concern', 'low', 'moderate', 'below_concern', 'limited'],
  ['low + strong + possible_concern', 'low', 'strong', 'possible_concern', 'moderate'],
  ['moderate + moderate + below_concern', 'moderate', 'moderate', 'below_concern', 'limited'],
  ['moderate + moderate + possible_concern', 'moderate', 'moderate', 'possible_concern', 'moderate'],
  ['serious + strong + below_concern', 'serious', 'strong', 'below_concern', 'moderate'],
  ['serious + strong + possible_concern', 'serious', 'strong', 'possible_concern', 'moderate'],
  ['serious + strong + concerning', 'serious', 'strong', 'concerning', 'high'],
];
for (const [name, hazard, evidence, exposure, expected] of cases) test(name, () => assert.equal(engine(profile(hazard, evidence, exposure)).riskLevel, expected));

test('unknown hazard, evidence insuffisante et exposition inconnue restent insuffisant_data', () => {
  assert.equal(engine(profile('unknown', 'strong', 'concerning')).riskLevel, 'insufficient_data');
  assert.equal(engine(profile('low', 'insufficient', 'concerning')).riskLevel, 'insufficient_data');
  assert.equal(engine(profile('low', 'strong', 'unknown')).riskLevel, 'insufficient_data');
});
