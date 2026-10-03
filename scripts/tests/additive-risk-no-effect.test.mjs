import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCurrentEngine } from '../additives/audit-additive-risk-engine.mjs';

const engine = await loadCurrentEngine();
const base = (overrides = {}) => ({ code: 'E999', names: { en: 'Test' }, sources: [{ organisation: 'EFSA', url: 'https://example.org' }], authorityEvaluations: [], potentialEffects: [], healthEffects: [], evidenceLevel: 'strong', assessment: { severity: 'none', evidenceStrength: 'strong', exposureConcern: 'below_concern', sources: [] }, exposure: { estimatedExposure: 'below_concern' }, ...overrides });

test('absence de potentialEffect sans signal structuré = hazard unknown', () => assert.equal(engine.deriveHazardAssessment(base()).level, 'unknown'));
test('potentialEffects vide = hazard unknown', () => assert.equal(engine.deriveHazardAssessment(base({ potentialEffects: [] })).level, 'unknown'));
test('effet severity unknown uniquement = hazard unknown', () => assert.equal(engine.deriveHazardAssessment(base({ potentialEffects: [{ effect: 'signal', severity: 'unknown', evidenceLevel: 'insufficient', appliesTo: 'additive' }] })).level, 'unknown'));
test('severity none explicitement sourcée peut produire none_identified', () => assert.equal(engine.deriveHazardAssessment(base({ potentialEffects: [{ effect: 'aucun effet pertinent', severity: 'none', evidenceLevel: 'strong', appliesTo: 'additive', normalization: { severitySource: 'explicit' }, source: { authority: 'EFSA' } }] })).level, 'none_identified'));
test('absence de données ne produit jamais none_identified', () => assert.notEqual(engine.deriveHazardAssessment(base()).level, 'none_identified'));
test('les signaux low moderate serious restent inchangés', () => {
  for (const severity of ['low', 'moderate', 'serious']) assert.equal(engine.deriveHazardAssessment(base({ potentialEffects: [{ effect: severity, severity, evidenceLevel: 'strong', appliesTo: 'additive' }] })).level, severity);
});
