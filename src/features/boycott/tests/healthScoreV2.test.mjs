import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ADDITIVE_PENALTIES, HEALTH_SCORE_VERSION, aggregateAdditiveScores, analyzeHealthScore } from '../healthScoreAnalyzer.ts';

test('Health Score V2: Nutri-Score E starts at zero', () => {
  assert.equal(analyzeHealthScore({ nutritionGrade: 'E' }).score, 0);
  assert.equal(analyzeHealthScore({ nutritionGrade: 'E', additivesTags: ['en:e150d'], novaGroup: 4 }).score, 0);
});

test('Health Score V2: reference examples A, B limited and C NOVA 4', () => {
  assert.equal(analyzeHealthScore({ nutritionGrade: 'A' }).score, 100);
  assert.equal(analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e222'] }).score, 70);
  assert.equal(analyzeHealthScore({ nutritionGrade: 'C', novaGroup: 4 }).score, 40);
});

test('Health Score V2: insufficient data has no penalty or bonus', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e150d'] });
  assert.equal(result.score, 75);
  assert.equal(result.available && result.additiveCounts.insufficient_data, 1);
});

test('Health Score V2: additive penalties are capped by level', () => {
  assert.equal(analyzeHealthScore({ nutritionGrade: 'B', additivesTags: ['en:e222', 'en:e223'] }).score, 65);
  assert.equal(aggregateAdditiveScores(['limited', 'limited', 'limited', 'limited']).penalty, ADDITIVE_PENALTIES.limited.cap);
  assert.equal(aggregateAdditiveScores(['high']).penalty, ADDITIVE_PENALTIES.high.perAdditive);
});

test('Health Score V2: missing nutrition is unavailable and missing NOVA gives no bonus', () => {
  assert.equal(analyzeHealthScore({ additivesTags: ['en:e222'] }).available, false);
  assert.equal(analyzeHealthScore({ nutritionGrade: 'A' }).score, 100);
});

test('Health Score V2: Coca-Cola is generic and evaluates to E / 0', () => {
  const result = analyzeHealthScore({ nutritionGrade: 'E', additivesTags: ['en:e150d', 'en:e338'] });
  assert.equal(result.available, true);
  assert.equal(result.score, 0);
  assert.equal(result.finalGrade, 'E');
  assert.equal(result.scoreVersion, HEALTH_SCORE_VERSION);
  assert.equal(result.methodologyVersion, 'oummah-health-score-v2');
});
