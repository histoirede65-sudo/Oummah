import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'src/features/boycott/data/eu-additive-catalog.json'), 'utf8'));
const priority = JSON.parse(fs.readFileSync(path.join(root, 'scripts/output/scientific-profile-priority.json'), 'utf8'));
const byCode = new Map(snapshot.entries.map((entry) => [entry.code, entry]));

test('snapshot UE contient des codes uniques et une provenance réglementaire', () => {
  assert.equal(snapshot.totalUniqueECodes, snapshot.entries.length);
  assert.equal(new Set(snapshot.entries.map((entry) => entry.code)).size, snapshot.entries.length);
  assert.ok(snapshot.entries.every((entry) => /^E\d{3,4}[A-Z]?$/.test(entry.code)));
  assert.ok(snapshot.entries.every((entry) => entry.canonicalNameEn && entry.names?.en && entry.regulatoryReferences?.length));
});

test('priority scientific file contains only named catalogue codes', () => {
  const known = new Set(snapshot.entries.map((entry) => entry.code));
  assert.equal(priority.totalPriorityCodes, priority.entries.length);
  assert.ok(priority.entries.every((entry) => known.has(entry.code) && (entry.names?.fr || entry.names?.en)));
  assert.ok(priority.entries.every((entry) => !('riskLevel' in entry) && !('healthScore' in entry)));
});

test('snapshot conserve les sous-codes et les codes attendus', () => {
  for (const code of ['E100', 'E150D', 'E160B', 'E202', 'E250', 'E252', 'E306', 'E322', 'E330', 'E338', 'E407', 'E407A', 'E412', 'E415', 'E450', 'E471', 'E621', 'E950', 'E951', 'E955', 'E960C']) assert.ok(byCode.has(code), code);
  assert.ok(snapshot.subcodes.includes('E150D'));
  assert.ok(!byCode.has('E9999'));
});

test('snapshot réglementaire ne contient pas de classification Santé OUMMAH', () => {
  const serialized = JSON.stringify(snapshot.entries);
  for (const forbidden of ['riskLevel', 'severity', 'scientificClassification', 'healthEffects', 'evidenceStrength']) assert.equal(serialized.includes(forbidden), false, forbidden);
});
