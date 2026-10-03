import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const report = JSON.parse(fs.readFileSync(new URL('../output/additive-hazard-evidence-basis-audit-v1.json', import.meta.url), 'utf8'));
const classes = new Set(['carcinogenicity', 'genotoxicity', 'reproductive', 'developmental', 'neurotoxicity', 'organ_toxicity', 'haematological', 'immunological', 'endocrine_related', 'gastrointestinal', 'metabolic', 'general_toxicity', 'other', 'unknown']);

test('la base factuelle couvre les 341 codes sans classification scientifique', () => {
  assert.equal(report.basisByCode.length, 341);
  assert.equal(Object.values(report.statusCounts).reduce((sum, count) => sum + count, 0), 341);
  assert.equal(report.normalizationFeasibility.noScientificSeverityCreated, true);
  assert.equal(report.normalizationFeasibility.noScientificEvidenceLevelCreated, true);
});

test('les endpoints conservent leur source et une classe descriptive autorisée', () => {
  const endpoints = report.basisByCode.flatMap((item) => item.criticalEndpoints);
  assert.ok(endpoints.length > 0);
  assert.ok(endpoints.every((item) => item.rawLabel && item.sourceTable && item.sourceRecordId && classes.has(item.normalizedEndpointClass)));
});

test('les associations explicites restent factuelles', () => {
  const endpoint = report.basisByCode.flatMap((item) => item.criticalEndpoints).find((item) => item.linkedReferencePoint);
  assert.ok(endpoint);
  assert.ok(endpoint.linkedReferencePoint.source.sourceTable);
  assert.ok(report.basisByCode.some((item) => item.studyContexts.some((context) => context.studyContext === 'animal')));
  assert.ok(report.basisByCode.some((item) => item.studyContexts.some((context) => context.studyContext === 'human')));
});

test('les sept codes de contrôle possèdent une provenance', () => {
  assert.deepEqual(report.sevenCodeChecks.map((item) => item.code), ['E102', 'E122', 'E124', 'E129', 'E132', 'E133', 'E171']);
  assert.ok(report.sevenCodeChecks.every((item) => item.provenanceComplete));
});
