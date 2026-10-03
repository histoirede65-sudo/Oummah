import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const report = JSON.parse(fs.readFileSync(new URL('../output/additive-official-hazard-evidence-framework-audit-v1.json', import.meta.url), 'utf8'));

test('les cadres sont audités sans créer de classification métier', () => {
  assert.ok(report.officialFrameworks.length >= 4);
  assert.equal(report.severityFeasibility.direct, 0);
  assert.equal(report.evidenceFeasibility.direct, 0);
  assert.equal(report.validation.severityCreated, false);
  assert.equal(report.validation.evidenceLevelCreated, false);
});

test('CriticalEndpoint et les points de référence ne sont pas assimilés à la gravité', () => {
  assert.match(report.criticalEndpointMeaning.severityInference, /NOT_SUPPORTED/);
  assert.match(report.referencePointMeaning.conclusion, /severity/);
});

test('les sept codes de contrôle sont présents', () => {
  assert.deepEqual(report.sevenCodeChecks.map((item) => item.code), ['E102', 'E122', 'E124', 'E129', 'E132', 'E133', 'E171']);
});

test('les couvertures potentielles restent explicitement conditionnelles', () => {
  assert.equal(report.severityFeasibility.signal, 'CONDITIONAL');
  assert.equal(report.evidenceFeasibility.signal, 'CONDITIONAL');
  assert.equal(report.conclusion.scientificConcernRule, 'PARTIALLY');
});
