import test from 'node:test';
import assert from 'node:assert/strict';
import { extractExplicitExposureStatements } from '../additives/efsa-exposure-patterns.mjs';

test('explicit below-reference statement is normalized', () => {
  assert.equal(extractExplicitExposureStatements('Dietary exposure did not exceed the ADI.').recognized[0].normalizedMeaning, 'below_reference');
});

test('explicit exceedance statement is confirmed', () => {
  assert.equal(extractExplicitExposureStatements('Exposure exceeded the ADI.').recognized[0].normalizedMeaning, 'confirmed_exceedance');
});

test('possible exceedance keeps the population wording', () => {
  const result = extractExplicitExposureStatements('High consumers may exceed the ADI in children.');
  assert.equal(result.recognized[0].normalizedMeaning, 'possible_exceedance');
  assert.match(result.recognized[0].sourceSentence, /children/);
});

test('no safety concern is recognized only with exposure context', () => {
  assert.equal(extractExplicitExposureStatements('This does not raise a safety concern at current exposure levels.').recognized[0].normalizedMeaning, 'no_safety_concern_at_assessed_exposure');
});

test('French explicit exposure statement is normalized', () => {
  const result = extractExplicitExposureStatements("L'estimation la plus élevée de l'exposition était inférieure à la DJA, ce qui indique une absence de préoccupation pour la santé.");
  assert.equal(result.recognized[0].normalizedMeaning, 'below_reference');
  assert.equal(result.recognized[1].normalizedMeaning, 'no_safety_concern_at_assessed_exposure');
});

test('an ADI or NOAEL alone is not an exposure conclusion', () => {
  assert.equal(extractExplicitExposureStatements('The ADI was set at 5 mg/kg bw/day.').recognized.length, 0);
  assert.equal(extractExplicitExposureStatements('The NOAEL was 30 mg/kg bw/day.').recognized.length, 0);
});

test('missing source sentence cannot produce an accepted assessment', () => {
  const result = extractExplicitExposureStatements('Additional data are required.');
  assert.ok(result.recognized[0].sourceSentence);
});
