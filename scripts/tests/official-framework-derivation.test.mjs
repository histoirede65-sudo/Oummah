import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { deriveEvidenceStrengthFromOfficialFramework, deriveHazardSeverityFromOfficialFramework } from '../additives/prototype-official-framework-derivation.mjs';

const source = { sourceTable: 'TEST', sourceRecordId: 'test-1' };
const complete = (overrides = {}) => ({
  code: 'E999', provenanceComplete: true, provenance: source,
  criticalEndpoints: [{ normalizedEndpointClass: 'reproductive', rawLabel: 'endpoint-1', effectResult: 'structured result', sourceTable: 'TEST', sourceRecordId: 'endpoint-1' }],
  studyContexts: [{ studyContext: 'animal', source }], species: [{ rawValue: 'rat', source }], studyTypes: [{ rawValue: 'two-generation reproductive toxicity', source }],
  referencePoints: [{ type: 'NOAEL', value: '10', source }], reliabilitySignals: [{ rawValue: 'reliable', source }], uncertaintySignals: [], assessmentSources: [{ assessmentId: 'assessment-1', sourceTable: 'TEST', sourceRecordId: 'assessment-1' }],
  explicitClassification: { clpCategory: '2' }, ...overrides,
});

test('CriticalEndpoint seul ne produit pas de severity', () => {
  const result = deriveHazardSeverityFromOfficialFramework({ code: 'E1', criticalEndpoints: [{ normalizedEndpointClass: 'reproductive' }], provenanceComplete: true });
  assert.equal(result.value, 'unknown');
});

test('reference point seul ne produit pas de severity', () => {
  const result = deriveHazardSeverityFromOfficialFramework({ code: 'E1', referencePoints: [{ type: 'NOAEL', value: '1' }], provenanceComplete: true });
  assert.equal(result.value, 'unknown');
});

test('autorité seule ne produit pas une evidence suffisante', () => {
  const result = deriveEvidenceStrengthFromOfficialFramework({ code: 'E1', assessmentSources: [{ assessmentId: 'EFSA' }], provenanceComplete: true });
  assert.equal(result.value, 'insufficient');
});

test('endpoint vague sans critères complémentaires reste unknown', () => {
  const result = deriveHazardSeverityFromOfficialFramework({ code: 'E1', criticalEndpoints: [{ normalizedEndpointClass: 'general_toxicity' }], provenanceComplete: true });
  assert.equal(result.value, 'unknown');
});

test('règle CLP générique complète produit un résultat conditionnel', () => {
  const severity = deriveHazardSeverityFromOfficialFramework(complete());
  assert.equal(severity.value, 'moderate');
  assert.equal(severity.ruleId, 'SEVERITY_CLP_REPRODUCTIVE');
  const evidence = deriveEvidenceStrengthFromOfficialFramework(complete({ consistencyAssessment: 'convergent' }));
  assert.equal(evidence.value, 'moderate');
});

test('provenance absente rejette les deux axes et aucune règle E-number n’est utilisée', () => {
  const basis = complete({ provenanceComplete: false, code: 'E102' });
  assert.equal(deriveHazardSeverityFromOfficialFramework(basis).value, 'unknown');
  assert.equal(deriveEvidenceStrengthFromOfficialFramework(basis).value, 'insufficient');
  assert.equal(deriveHazardSeverityFromOfficialFramework(complete()).ruleId, 'SEVERITY_CLP_REPRODUCTIVE');
});

test('la simulation produite reste sans classification métier', () => {
  const report = JSON.parse(fs.readFileSync(new URL('../output/additive-scientific-concern-audit-v4-framework.json', import.meta.url), 'utf8'));
  assert.equal(report.validation.runtimeProfilesModified, false);
  assert.equal(report.validation.evaluateAdditiveScientificConcernModified, false);
  assert.equal(report.distribution.high, 0);
  assert.equal(report.distribution.moderate, 0);
  assert.equal(report.distribution.limited, 0);
});
