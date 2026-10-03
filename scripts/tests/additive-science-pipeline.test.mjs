import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCoverageReport, buildImportPlan, decideUpsert, normalizeAdditiveCode, parseCsv, validateImportRecords } from '../additives/additive-science-pipeline.mjs';

const source = { sourceId: 'efsa-1', organisation: 'EFSA', sourceType: 'scientific_opinion', title: 'Opinion', url: 'https://example.org/opinion', retrievedAt: '2026-09-30', fieldsSupported: ['scientific_summary'] };
function record(overrides = {}) {
  return { code: 'e338', names: { fr: 'Acide phosphorique' }, aliases: [], authorityEvaluations: [{ authority: 'EFSA', conclusion: 'Conclusion', reviewedAt: '2026-09-30' }], potentialEffects: [], restrictions: [], evidenceLevel: 'strong', sources: [source], lastReviewedAt: '2026-09-30', dataVersion: 'reviewed-1.0', ...overrides };
}

test('normalise un code E sans créer de double préfixe', () => {
  assert.equal(normalizeAdditiveCode(' e338 '), 'E338');
  assert.throws(() => normalizeAdditiveCode('en:E338'));
});
test('rejette doublons et sources manquantes', () => {
  const result = validateImportRecords([record(), record(), record({ code: 'E202', sources: [] })], new Set(['E338', 'E202']));
  assert.equal(result.valid.length, 1);
  assert.equal(result.rejected.length, 2);
  assert.ok(result.rejected.some((item) => item.reasons.includes('duplicate code in import')));
  assert.ok(result.rejected.some((item) => item.reasons.includes('at least one source is required')));
});
test('marque une fiche incomplète sans lui attribuer un risque', () => {
  const result = validateImportRecords([record({ authorityEvaluations: [], evidenceLevel: 'insufficient' })], new Set(['E338']));
  assert.deepEqual(result.incomplete, ['E338']);
  assert.equal(result.valid[0].needsScientificReview, true);
});
test('refuse URL/date/enum invalides', () => {
  const result = validateImportRecords([record({ evidenceLevel: 'bad', lastReviewedAt: '30/09/2026', sources: [{ ...source, url: 'not-url' }] })], new Set(['E338']));
  assert.equal(result.valid.length, 0);
  assert.ok(result.rejected[0].reasons.some((reason) => reason.includes('invalid')));
});
test('priorité aux fiches existantes plus récentes ou plus complètes', () => {
  assert.equal(decideUpsert({ scientific_reviewed_at: '2026-10-01', sources: [{}], scientific_summary: 'x' }, record()).action, 'skip');
  assert.equal(decideUpsert({ scientific_reviewed_at: '2026-09-30', canonical_name: 'x', function_classes: ['x'], sources: [{}], scientific_summary: 'x', exposure_assessment: {}, assessment_history: [{}] }, record({ function: 'x', exposure: {} })).action, 'conflict');
  assert.equal(decideUpsert(undefined, record()).action, 'insert');
});
test('rapport de couverture identifie profils incomplets et codes absents', () => {
  const report = buildCoverageReport([{ code: 'E338', sources: [source], scientific_summary: 'x', needs_scientific_review: false }, { code: 'E202', sources: [], needs_scientific_review: true }], ['E338', 'E202', 'E950']);
  assert.equal(report.totalProfiles, 2);
  assert.equal(report.incompleteProfiles, 1);
  assert.deepEqual(report.missingKnownCodes, ['E950']);
});
test('parse un CSV simple', () => {
  assert.deepEqual(parseCsv('code,names\nE338,Acide phosphorique'), [{ code: 'E338', names: 'Acide phosphorique' }]);
});
test('le plan dry-run ne produit aucune écriture', () => {
  const plan = buildImportPlan([record()], [], new Set(['E338']));
  assert.equal(plan.dryRun, true);
  assert.deepEqual(plan.writes, []);
  assert.equal(plan.decisions[0].action, 'insert');
});
