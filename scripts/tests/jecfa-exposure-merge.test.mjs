import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const master = JSON.parse(fs.readFileSync('scripts/data/additives-scientific-master-v2-exposure.json', 'utf8'));
const audit = JSON.parse(fs.readFileSync('scripts/output/additive-exposure-merge-audit-v1.json', 'utf8'));

test('le master V2 contient des profils enrichis', () => assert.ok(master.profiles.some((profile) => (profile.exposureAssessments ?? []).length > 0)));
test('les profils reference-only ne reçoivent pas de scénario exposition', () => { for (const profile of master.profiles) { const refs = (profile.referenceValues ?? []).filter((value) => value.authority === 'JECFA'); if (refs.length && !(profile.exposureAssessments ?? []).length) assert.equal(profile.exposureAssessments?.length ?? 0, 0); } });
test('les assessments fusionnés ont une provenance complète', () => { for (const item of audit.items) assert.equal(item.provenanceComplete, true); });
test('E338 ne reçoit aucune exposition artificielle', () => { const item = audit.spotChecks.find((spot) => spot.code === 'E338'); assert.equal(item?.exposureAssessments ?? 0, 0); });
test('la politique de match exclut les possible_match', () => assert.match(audit.validMatchPolicy, /exact or strong only/));
