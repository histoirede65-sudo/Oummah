import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dataset = JSON.parse(fs.readFileSync(new URL('../../src/features/boycott/data/additive-scientific-concern-v1.json', import.meta.url), 'utf8'));
const audit = JSON.parse(fs.readFileSync(new URL('../output/additive-scientific-concern-runtime-dataset-audit-v1.json', import.meta.url), 'utf8'));
const methodology = JSON.parse(fs.readFileSync(new URL('../output/oummah-additive-methodology-v1.json', import.meta.url), 'utf8'));
const byCode = new Map(dataset.entries.map((entry) => [entry.code, entry]));

test('le dataset contient exactement les 341 codes du catalogue', () => {
  assert.equal(audit.catalogCodes, 341);
  assert.equal(audit.datasetCodes, 341);
  assert.deepEqual(audit.missingCodes, []);
  assert.deepEqual(audit.extraCodes, []);
  assert.deepEqual(audit.duplicates, []);
});

test('E222 est récupérable et limited', () => {
  assert.equal(byCode.get('E222').scientificConcern.level, 'limited');
  assert.equal(byCode.get('E222').scientificConcern.confidence, 'medium');
});

test('un code insufficient_data conserve une raison structurée', () => {
  const entry = byCode.get('E100');
  assert.equal(entry.scientificConcern.level, 'insufficient_data');
  assert.ok(entry.scientificConcern.reasons.length > 0);
});

test('un code inconnu n’est pas présent dans le dataset', () => {
  assert.equal(byCode.has('E9999'), false);
});

test('la version méthodologique est stable', () => {
  assert.equal(dataset.methodologyVersion, 'oummah-additive-scientific-concern-v1');
  assert.equal(methodology.methodologyVersion, dataset.methodologyVersion);
});

test('ScientificConcern et ExposureRisk restent deux objets séparés', () => {
  const entry = byCode.get('E222');
  assert.ok(entry.scientificConcern);
  assert.ok(entry.exposureRisk);
  assert.notEqual(entry.scientificConcern.level, entry.exposureRisk.status);
});

test('aucune règle E-number n’est encodée dans les entrées', () => {
  for (const entry of dataset.entries) {
    assert.equal(JSON.stringify(entry).includes('E_NUMBER_SPECIFIC_RULE'), false);
  }
});

test('les entrées conservent des sources ou une provenance de dataset', () => {
  for (const entry of dataset.entries) {
    assert.ok(entry.provenance);
    assert.ok(entry.provenance.catalog);
  }
});

test('le dataset ne contient aucun champ de score ou de couleur', () => {
  for (const entry of dataset.entries) {
    assert.equal('score' in entry, false);
    assert.equal('colour' in entry, false);
    assert.equal('color' in entry, false);
  }
});
