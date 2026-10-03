import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { identities, matchIdentity, normalizeOfficialRecord } from '../additives/audit-official-substance-hazard-classifications.mjs';

const base = { code: 'E999', names: { en: 'Example additive' } };

test('EC exact est prioritaire sur CAS', () => {
  const identity = { CAS: ['1-1-1'], EC: ['200-001-1'], officialIdentifiers: [] };
  const record = normalizeOfficialRecord({ CAS: ['1-1-1'], EC: ['200-001-1'] }, 'HARMONISED_CLASSIFICATION');
  assert.deepEqual(matchIdentity(identity, record), { matchType: 'EC_EXACT', values: ['200-001-1'] });
});

test('CAS exact est accepté quand aucun EC ne matche', () => {
  const identity = { CAS: ['1-1-1'], EC: ['200-001-1'], officialIdentifiers: [] };
  const record = normalizeOfficialRecord({ CAS: ['1-1-1'], EC: ['999-999-9'] }, 'HARMONISED_CLASSIFICATION');
  assert.equal(matchIdentity(identity, record).matchType, 'CAS_EXACT');
});

test('un nom seul ne crée aucun matching', () => {
  const identity = { CAS: [], EC: [], officialIdentifiers: [], names: ['Example'] };
  const record = normalizeOfficialRecord({ substanceName: 'Example' }, 'HARMONISED_CLASSIFICATION');
  assert.equal(matchIdentity(identity, record), null);
});

test('une famille ou un mélange ne peut pas être transféré comme substance simple', () => {
  const list = identities({ priorityBatch: [] }, { entries: [{ ...base, names: { en: 'Example mixture' }, sourceDisplayName: 'Example mixture' }] });
  assert.equal(list[0].familyOrMixtureHint, true);
});

test('notified et harmonised restent des sources distinctes', () => {
  const harmonised = normalizeOfficialRecord({ substanceName: 'A', CAS: ['1-1-1'], harmonised: true }, 'HARMONISED_CLASSIFICATION');
  const notified = normalizeOfficialRecord({ substanceName: 'A', CAS: ['1-1-1'], harmonised: false }, 'NOTIFIED_SELF_CLASSIFICATION');
  assert.equal(harmonised.harmonised, true);
  assert.equal(notified.harmonised, false);
});

test('aucune règle ne dépend du E-number', () => {
  const identity = { code: 'E999', CAS: [], EC: [], officialIdentifiers: [] };
  const record = normalizeOfficialRecord({ substanceName: 'Unrelated', CAS: ['1-1-1'] }, 'HARMONISED_CLASSIFICATION');
  assert.equal(matchIdentity(identity, record), null);
});

test('la jointure REF_SUB récupère EC et CAS sans les fabriquer', () => {
  const list = identities({ priorityBatch: [{ code: 'E999', matchConfidence: 'strong', matchedReferenceSubstances: [{ referenceSubstanceUuid: 'ref-1', identifiers: ['RF-1'] }] }] }, { entries: [{ code: 'E999', names: { en: 'Example' } }] }, [{ 'Document UUID': 'ref-1', 'EC number': '200-001-1', 'Inventory.CASNumber': '1-1-1' }]);
  assert.deepEqual(list[0].EC, ['200-001-1']);
  assert.deepEqual(list[0].CAS, ['1-1-1']);
});

test('la provenance est conservée par normalisation', () => {
  const record = normalizeOfficialRecord({ CAS: ['1-1-1'], provenance: { url: 'official' } }, 'HARMONISED_CLASSIFICATION');
  assert.deepEqual(record.provenance, { url: 'official' });
});

test('les classes CLP santé, environnement et physique restent descriptives', () => {
  const record = normalizeOfficialRecord({ CAS: ['1-1-1'], hazardClassAndCategoryCodes: ['Carc. 2', 'Aquatic Chronic 1', 'Flam. Liq. 3'], source: { sourceLocation: 'Annex VI / Part 3 / Table 3' } }, 'HARMONISED_CLASSIFICATION');
  assert.equal(record.hazardClasses.length, 3);
  assert.equal(record.provenance.sourceLocation, 'Annex VI / Part 3 / Table 3');
});

test('le snapshot EUR-Lex Table 3 est versionné et traçable', () => {
  const snapshot = JSON.parse(fs.readFileSync('scripts/data/clp-annex-vi-table3-2026-07-01.json', 'utf8'));
  assert.equal(snapshot.regulatoryVersion, '02008R1272-20260701');
  assert.equal(snapshot.sourceOrganisation, 'European Union / EUR-Lex');
  assert.match(snapshot.sha256, /^[a-f0-9]{64}$/);
  assert.ok(snapshot.entries.length > 4000);
});
