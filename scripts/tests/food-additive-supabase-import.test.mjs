import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDbRow, planImport, selectImportRecords } from '../import-food-additive-science-supabase.mjs';

function record(code, overrides = {}) {
  return { code, canonical_name: code, cas_numbers: ['1-1-1'], opentox_sub_uuid: '12345678-1234-1234-1234-1234567890ab', opentox_ref_sub_uuid: '22345678-1234-1234-1234-1234567890ab', matching_method: 'cas_exact', matching_confidence: 'high', reference_values: [], reference_value_status: 'reference_value_not_found', sourceVersion: 'OpenFoodTox 3.0', sourceFileHash: 'hash', retrievedAt: '2026-09-16T00:00:00.000Z', ...overrides };
}

test('import sélectionne uniquement les fiches fiables et exclut ambiguës/E331', () => {
  const selected = selectImportRecords({ records: [record('E202'), record('E150D'), record('E331'), record('E621')] });
  assert.deepEqual(selected.map((item) => item.code), ['E202']);
});

test('import crée une nouvelle ligne avec classification prudente', () => {
  const row = buildDbRow(record('E202', { reference_values: [{ type: 'ADI', lowerValue: '25', Unit: 'mg/kg bw/day' }] }));
  assert.equal(row.scientific_classification, 'insufficient_data');
  assert.equal(row.severity, 'none');
  assert.equal(row.evidence_strength, 'insufficient');
  assert.equal(row.exposure_concern, 'unknown');
  assert.equal(row.needs_scientific_review, true);
  assert.equal(row.exposure_assessment.referenceValues[0].lowerValue, '25');
});

test('import conserve la provenance EFSA/OpenFoodTox', () => {
  const row = buildDbRow(record('E202'));
  assert.equal(row.sources[0].organisation, 'EFSA');
  assert.equal(row.sources[0].sourceDataset, 'OpenFoodTox 3.0');
  assert.equal(row.sources[0].sourceFileHash, 'hash');
  assert.equal(row.eu_conditions.openFoodTox.refSubUuid, '22345678-1234-1234-1234-1234567890ab');
});

test('import laisse null les valeurs ADI absentes', () => {
  const row = buildDbRow(record('E202'));
  assert.equal(row.adi_value, null);
  assert.equal(row.adi_unit, null);
  assert.equal(row.exposure_assessment.referenceValueStatus, 'reference_value_not_found');
});

test('dry-run planifie un nouvel insert sans écriture réseau', () => {
  const plan = planImport({ proposal: { records: [record('E202')] }, existingCodes: [] });
  assert.deepEqual(plan.inserts.map((item) => item.code), ['E202']);
  assert.equal(plan.noAutomaticScientificChange, true);
});

test('plan idempotent pour un code déjà présent', () => {
  const plan = planImport({ proposal: { records: [record('E202')] }, existingRows: [{ code: 'E202', canonical_name: 'Existing', sources: [{ sourceId: 'old' }], scientific_classification: 'limited_concern' }], existingCodes: [] });
  assert.deepEqual(plan.inserts, []);
  assert.equal(plan.existingEnrichments[0].scientificFieldsPreserved, true);
});

test('champ existant non vide jamais remplacé', () => {
  const plan = planImport({ proposal: { records: [record('E202', { canonical_name: 'Proposed' })] }, existingRows: [{ code: 'E202', canonical_name: 'Existing', sources: [{ sourceId: 'old' }] }], existingCodes: [] });
  assert.equal(plan.existingEnrichments[0].fieldsToAdd.includes('canonical_name'), false);
  assert.equal(plan.existingEnrichments[0].fieldsPreserved.includes('canonical_name'), true);
});

test('classification existante protégée et nouveaux additifs insuffisant_data', () => {
  const plan = planImport({ proposal: { records: [record('E338'), record('E202')] }, existingCodes: ['E338'] });
  assert.equal(plan.inserts[0].scientific_classification, 'insufficient_data');
  assert.equal(plan.existingEnrichments[0].scientificFieldsPreserved, true);
});
