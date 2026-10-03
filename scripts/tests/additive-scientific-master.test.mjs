import test from 'node:test';
import assert from 'node:assert/strict';
import { BATCH_SIZE, chunk, isAutomatable, manualStatus, batchIsReusable, assertMasterQuality } from '../additives/process-additive-scientific-master.mjs';

const source = { sourceId: 'test', organisation: 'EFSA', sourceType: 'official_information', title: 'Test', url: 'https://example.org/source', fieldsSupported: ['identity'] };
const profile = (code, sourceOverride = source) => ({ code, sources: [sourceOverride], names: { en: code }, referenceValues: [{ type: 'ADI', authority: 'EFSA' }], completeness: { complete: true }, authorityEvaluations: [{ authority: 'EFSA', coveredCodes: [code], assessmentScope: 'individual' }] });

test('batches are fixed-size and cover every priority item exactly once', () => {
  const items = Array.from({ length: 321 }, (_, index) => index);
  const batches = chunk(items, BATCH_SIZE);
  assert.equal(batches.length, 8);
  assert.equal(batches.at(-1).length, 6);
  assert.deepEqual(batches.flat(), items);
});

test('interrupted or changed batches are not resumed', () => {
  const report = { sourceAuditGeneratedAt: 'audit-1', codes: ['E102', 'E104'] };
  assert.equal(batchIsReusable(report, ['E102', 'E104'], 'audit-1'), true);
  assert.equal(batchIsReusable(report, ['E102', 'E110'], 'audit-1'), false);
  assert.equal(batchIsReusable(report, ['E102', 'E104'], 'audit-2'), false);
});

test('possible matches are manual and never automatable', () => {
  const item = { efsa: { matchConfidence: 'possible', discoveryFound: true }, jecfa: { matchConfidence: null }, combined: {} };
  assert.equal(isAutomatable(item), false);
  assert.equal(manualStatus(item), 'possible_match');
});

test('no match is manual and absent from generated profiles', () => {
  const item = { efsa: { matchConfidence: null, discoveryFound: false }, jecfa: { matchConfidence: null, matchFound: false }, combined: {} };
  assert.equal(isAutomatable(item), false);
  assert.equal(manualStatus(item), 'no_match');
});

test('master quality gate rejects duplicate codes', () => {
  assert.throws(() => assertMasterQuality([profile('E102'), profile('E102')], [], new Set(['E102'])) , /duplicate codes/);
});

test('master quality gate preserves family scope and provenance', () => {
  const family = { ...profile('E150A'), authorityEvaluations: [{ authority: 'EFSA', coveredCodes: ['E150A', 'E150B', 'E150C', 'E150D'], assessmentScope: 'family' }] };
  assert.doesNotThrow(() => assertMasterQuality([family], [], new Set(['E150A'])));
});
