import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildDryRun, buildPatch, loadReview, mergeBySourceId, REVIEW_CODES } from '../update-scientific-review-supabase.mjs';

const review = loadReview();

test('lot 1 contient exactement les cinq codes validés', () => {
  assert.deepEqual(review.additives.map((item) => item.code), REVIEW_CODES);
});

test('E211 reste limited_concern', () => {
  const item = review.additives.find((entry) => entry.code === 'E211');
  assert.equal(item.scientificClassification, 'limited_concern');
  assert.equal(item.severity, 'low');
});

test('sources fusionnées sans doublon par sourceId', () => {
  const sources = mergeBySourceId([{ sourceId: 'openfoodtox-e202', old: true }], [{ sourceId: 'openfoodtox-e202', old: false }, { sourceId: 'e202-efsa-2019' }]);
  assert.deepEqual(sources.map((source) => source.sourceId), ['openfoodtox-e202', 'e202-efsa-2019']);
});

test('données OpenFoodTox conservées pendant le patch', () => {
  const item = review.additives.find((entry) => entry.code === 'E250');
  const current = { code: 'E250', scientific_classification: 'insufficient_data', exposure_assessment: { openFoodTox: { referenceValues: [{ lowerValue: '0.1' }] } }, sources: [{ sourceId: 'openfoodtox-e250' }] };
  const diff = buildPatch(item, current);
  assert.deepEqual(diff.proposed.exposure_assessment.openFoodTox, current.exposure_assessment.openFoodTox);
  assert.equal(diff.preservedOpenFoodTox, true);
});

test('patch scientifique idempotent', () => {
  const item = review.additives.find((entry) => entry.code === 'E955');
  const current = buildPatch(item, { code: 'E955', sources: [], exposure_assessment: {}, assessment_history: [] }).proposed;
  const once = buildPatch(item, current).proposed;
  const twice = buildPatch(item, once).proposed;
  assert.deepEqual(twice, once);
});

test('dry-run ne cible aucune autre fiche', () => {
  const currentRows = REVIEW_CODES.map((code) => ({ code }));
  const report = buildDryRun({ review, currentRows });
  assert.equal(report.summary.toUpdate, 5);
  assert.equal(report.otherCodesModified, 0);
  assert.equal(report.newRecords, 0);
});

test('needs_scientific_review passe à false uniquement pour le lot validé', () => {
  for (const item of review.additives) assert.equal(item.needsScientificReview, false);
});
