import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { buildDryRunReport, normalize, normalizeIuclidReference, readInput } from '../import-openfoodtox-additives.mjs';

test('OpenFoodTox matching: CAS exact', () => {
  const report = buildDryRunReport({ candidates: [{ codeE: 'E951', canonicalName: 'Aspartame', synonyms: [], insCode: '951', casNumbers: ['22839-47-0'], efsaIdentifiers: [], needsManualReview: false }], sheets: [{ name: 'Substances', rows: [{ 'CAS number': '22839-47-0', 'Substance name': 'A different label' }] }], sourceFileHash: 'hash' });
  assert.equal(report.proposals[0].matchStatus, 'matched');
});

test('OpenFoodTox matching: exact name and alias', () => {
  const report = buildDryRunReport({ candidates: [{ codeE: 'E330', canonicalName: 'Citric acid', synonyms: ['acid citrique'], insCode: '330', casNumbers: [], efsaIdentifiers: [], needsManualReview: false }], sheets: [{ name: 'Substances', rows: [{ 'Substance name': 'Acid citrique' }] }], sourceFileHash: 'hash' });
  assert.equal(report.proposals[0].matchStatus, 'matched');
});

test('OpenFoodTox matching: ambiguity is refused', () => {
  const report = buildDryRunReport({ candidates: [{ codeE: 'E331', canonicalName: 'Sodium citrates', synonyms: [], insCode: '331', casNumbers: [], efsaIdentifiers: [], needsManualReview: false }], sheets: [{ name: 'Substances', rows: [{ 'Substance name': 'Sodium citrates', 'Substance ID': 'A' }, { 'Substance name': 'Sodium citrates', 'Substance ID': 'B' }] }], sourceFileHash: 'hash' });
  assert.equal(report.proposals[0].matchStatus, 'ambiguous');
  assert.equal(report.proposals[0].needsManualReview, true);
});

test('OpenFoodTox matching: no source row is not exploitable', () => {
  const report = buildDryRunReport({ candidates: [{ codeE: 'E999', canonicalName: 'Unknown', synonyms: [], insCode: '999', casNumbers: [], efsaIdentifiers: [], needsManualReview: false }], sheets: [{ name: 'Substances', rows: [] }], sourceFileHash: 'hash' });
  assert.equal(report.proposals[0].matchStatus, 'unmatched');
  assert.equal(report.proposals[0].needsManualReview, true);
});

test('OpenFoodTox normalization removes accents', () => {
  assert.equal(normalize('Acide phosphorique'), 'acide phosphorique');
});

test('OpenFoodTox dry-run ne modifie pas le référentiel existant', () => {
  const report = buildDryRunReport({ candidates: [{ codeE: 'E951', canonicalName: 'Aspartame', synonyms: [], insCode: '951', casNumbers: ['22839-47-0'], efsaIdentifiers: [], needsManualReview: true }], sheets: [{ name: 'Substances', rows: [{ 'CAS number': '22839-47-0', 'Substance name': 'Aspartame' }] }], existingCodes: ['E951'], sourceFileHash: 'hash' });
  assert.deepEqual(report.wouldAdd, []);
  assert.deepEqual(report.existingCodes, ['E951']);
});

test('OpenFoodTox rapport: plusieurs feuilles et colonnes inconnues sont conservées', () => {
  const report = buildDryRunReport({ candidates: [{ codeE: 'E330', canonicalName: 'Citric acid', synonyms: [], insCode: '330', casNumbers: [], efsaIdentifiers: [], needsManualReview: false }], sheets: [{ name: 'Substances', rows: [{ 'Nom non standard': 'Citric acid' }] }, { name: 'References', rows: [{ 'Reference value': 'ADI' }] }], sourceFileHash: 'hash' });
  assert.equal(report.sheets.length, 2);
  assert.deepEqual(report.sheets[0].columns, ['Nom non standard']);
});

test('OpenFoodTox construit les index une seule fois pour plusieurs additifs', () => {
  const report = buildDryRunReport({ candidates: [
    { codeE: 'E330', canonicalName: 'Citric acid', synonyms: [], insCode: '330', casNumbers: ['77-92-9'], efsaIdentifiers: [], needsManualReview: false },
    { codeE: 'E951', canonicalName: 'Aspartame', synonyms: [], insCode: '951', casNumbers: ['22839-47-0'], efsaIdentifiers: [], needsManualReview: false },
  ], sheets: [{ name: 'Substances', rows: [{ CAS: '77-92-9', Name: 'Citric acid' }, { CAS: '22839-47-0', Name: 'Aspartame' }] }], sourceFileHash: 'hash' });
  assert.equal(report.indexing.buildCount, 1);
  assert.equal(report.totalRowsAnalyzed, 2);
  assert.equal(report.summary.reliableMatches, 2);
});

test('OpenFoodTox fichier absent ou format invalide est refusé', () => {
  assert.throws(() => readInput(path.join(os.tmpdir(), 'oummah-openfoodtox-does-not-exist.xlsx')), /Input file not found/);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oummah-openfoodtox-test-'));
  const invalid = path.join(directory, 'invalid.xlsx');
  fs.writeFileSync(invalid, 'not an xlsx');
  assert.throws(() => readInput(invalid));
  fs.rmSync(directory, { recursive: true, force: true });
});

test('OpenFoodTox CAS avec espaces reste comparable', () => {
  const report = buildDryRunReport({ candidates: [{ codeE: 'E951', canonicalName: 'Aspartame', synonyms: [], insCode: '951', casNumbers: ['22839-47-0'], efsaIdentifiers: [], needsManualReview: false }], sheets: [{ name: 'Substances', rows: [{ CAS: '22839 - 47 - 0', Name: 'Aspartame' }] }], sourceFileHash: 'hash' });
  assert.equal(report.proposals[0].status, 'matched');
});

test('OpenFoodTox normalise une référence IUCLID sans fuzzy matching', () => {
  assert.equal(normalizeIuclidReference('ReferenceSubstance.ReferenceSubstance: 12345678-1234-1234-1234-1234567890AB'), '12345678-1234-1234-1234-1234567890ab');
  assert.equal(normalizeIuclidReference('aucune référence'), '');
});

test('OpenFoodTox relie REF_SUB, SUB et ToxRefValues par UUID exact', () => {
  const refUuid = '12345678-1234-1234-1234-1234567890ab';
  const subUuid = '22345678-1234-1234-1234-1234567890ab';
  const report = buildDryRunReport({
    candidates: [{ codeE: 'E951', canonicalName: 'Aspartame', synonyms: [], casNumbers: ['22839-47-0'], efsaIdentifiers: [], needsManualReview: false }],
    sheets: [
      { name: 'REF_SUB', rows: [{ 'Document UUID': refUuid, 'Inventory.CASNumber': '22839-47-0', ReferenceSubstanceName: 'Aspartame', 'CAS name': '', 'CAS number': '', Name: '' }] },
      { name: 'SUB', rows: [{ 'Document UUID': subUuid, ChemicalName: 'Aspartame', 'ReferenceSubstance.ReferenceSubstance': refUuid }] },
      { name: 'FLEX_SUM.ToxRefValues', rows: [{ 'Document UUID': '32345678-1234-1234-1234-1234567890ab', 'Parent UUID': subUuid, 'HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.lowerValue': '40', 'HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.Unit': 'mg/kg bw/day' }] },
    ],
    sourceFileHash: 'hash',
  });
  assert.equal(report.mapping.linkedSubstances, 1);
  assert.equal(report.mapping.toxRelation, 'SUB via Parent UUID');
  assert.equal(report.mapping.toxLinked, 1);
  assert.equal(report.proposals[0].status, 'matched');
  assert.equal(report.proposals[0].candidates[0].referenceValues[0].type, 'ADI');
});

test('OpenFoodTox produit une proposition prudente sans écrire Supabase', () => {
  const report = buildDryRunReport({
    candidates: [
      { codeE: 'E202', canonicalName: 'Potassium sorbate', synonyms: [], casNumbers: ['24634-61-5'], efsaIdentifiers: [], needsManualReview: false },
      { codeE: 'E330', canonicalName: 'Citric acid', synonyms: [], casNumbers: ['77-92-9'], efsaIdentifiers: [], needsManualReview: false },
      { codeE: 'E331', canonicalName: 'Sodium citrates', synonyms: [], casNumbers: [], efsaIdentifiers: [], needsManualReview: false },
      { codeE: 'E621', canonicalName: 'Monosodium glutamate', synonyms: [], casNumbers: [], efsaIdentifiers: [], needsManualReview: false },
    ],
    sheets: [
      { name: 'REF_SUB', rows: [
        { 'Document UUID': '12345678-1234-1234-1234-1234567890ab', 'Inventory.CASNumber': '24634-61-5', ReferenceSubstanceName: 'Potassium sorbate', 'CAS name': '', 'CAS number': '', Name: '' },
        { 'Document UUID': '72345678-1234-1234-1234-1234567890ab', 'Inventory.CASNumber': '77-92-9', ReferenceSubstanceName: 'Citric acid', 'CAS name': '', 'CAS number': '', Name: '' },
        { 'Document UUID': '22345678-1234-1234-1234-1234567890ab', 'Inventory.CASNumber': '', ReferenceSubstanceName: 'Monosodium glutamate', 'CAS name': '', 'CAS number': '', Name: '' },
        { 'Document UUID': '32345678-1234-1234-1234-1234567890ab', 'Inventory.CASNumber': '', ReferenceSubstanceName: 'Monosodium L-glutamate', 'CAS name': '', 'CAS number': '', Name: '' },
      ] },
      { name: 'SUB', rows: [
        { 'Document UUID': '42345678-1234-1234-1234-1234567890ab', ChemicalName: 'Potassium sorbate', 'ReferenceSubstance.ReferenceSubstance': '12345678-1234-1234-1234-1234567890ab' },
        { 'Document UUID': '82345678-1234-1234-1234-1234567890ab', ChemicalName: 'Citric acid', 'ReferenceSubstance.ReferenceSubstance': '72345678-1234-1234-1234-1234567890ab' },
        { 'Document UUID': '52345678-1234-1234-1234-1234567890ab', ChemicalName: 'Monosodium glutamate', 'ReferenceSubstance.ReferenceSubstance': '22345678-1234-1234-1234-1234567890ab' },
        { 'Document UUID': '62345678-1234-1234-1234-1234567890ab', ChemicalName: 'Monosodium L-glutamate', 'ReferenceSubstance.ReferenceSubstance': '32345678-1234-1234-1234-1234567890ab' },
      ] },
      { name: 'FLEX_SUM.ToxRefValues', rows: [{ 'Document UUID': '72345678-1234-1234-1234-1234567890ab', 'Parent UUID': '42345678-1234-1234-1234-1234567890ab', 'HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.lowerValue': '25', 'HumanHealthHazardCharacteristics.AcceptableDailyIntake.Adi.Unit': 'mg/kg bw/day' }] },
    ],
    existingRecords: [{ codeE: 'E202', scientificReviewedAt: '2026-09-16', dataVersion: '1.0' }],
    sourceFileHash: 'hash',
  });
  assert.equal(report.proposedRecords.length, 3);
  const existing = report.proposedRecords.find((record) => record.code === 'E202');
  const newcomer = report.proposedRecords.find((record) => record.code === 'E330');
  assert.equal(existing.reference_values[0].lowerValue, '25');
  assert.equal(existing.reference_value_status, 'available');
  assert.equal(existing.adi_value, null);
  assert.equal(existing.scientific_classification, null);
  assert.equal(newcomer.scientific_classification, 'insufficient_data');
  assert.equal(newcomer.adi_value, null);
  assert.deepEqual(report.groups.needs_manual_identity_review, []);
  assert.deepEqual(report.groups.needs_scientific_review, ['E330', 'E621']);
  assert.equal(report.existingDiffs[0].comparison, 'information_supplementary');
});
