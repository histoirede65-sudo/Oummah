import type { AdditivesDataStatus, ProductHealthData } from './data/BoycottRepository';
import { analyzeHealthIngredients } from './healthIngredientAnalyzer';
import { detectIngredientAdditives, getAdditivesDataStatus } from './ingredientAdditiveDetector';
import { getAdditiveScientificConcern, type AdditiveScientificConcernLevel } from './additiveScientificConcernRepository';
import { translate, type TranslationKey } from '../../i18n/translate';

export const HEALTH_SCORE_VERSION = 'oummah-health-score-v2';
/** Translation key: read it with translate(). */
export const HEALTH_SCORE_METHODOLOGY_TEXT: TranslationKey = 'health.methodologyText';
export const NUTRITION_SCORE_MAP = { A: 100, B: 75, C: 50, D: 25, E: 0 } as const;
export const ADDITIVE_PENALTIES: Record<Exclude<AdditiveScientificConcernLevel, 'no_identified_concern' | 'insufficient_data'>, { perAdditive: number; cap: number }> = { limited: { perAdditive: 5, cap: 15 }, moderate: { perAdditive: 12, cap: 30 }, high: { perAdditive: 25, cap: 50 } };
export const NOVA_PENALTIES = { 1: 0, 2: 0, 3: 5, 4: 10 } as const;
export const HEALTH_GRADE_THRESHOLDS = { A: 80, B: 60, C: 40, D: 20 } as const;
export const HEALTH_SCORE_WEIGHTS = { nutrition: 1 } as const;
export const HEALTH_SCORE_METHODOLOGY_VERSION = 'oummah-health-score-v2';

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type HealthScoreCompleteness = 'complete' | 'partial' | 'nutrition_only';
export type HealthGradePresentation = { grade: HealthGrade; label: string; color: string; backgroundColor: string; accentColor: string };
export type HealthPillar = 'nutrition' | 'additives' | 'transformation';
export type HealthPillarResult = { pillar: HealthPillar; score: number; weight: number; available: boolean; label: string; detail: string };
export type HealthScoreComponent = { type: HealthPillar | 'additive'; label: string; evidenceSource: string; evidenceLevel?: string; oummahPenalty: number; points: number; explanation: string; scientificClassification?: AdditiveScientificConcernLevel };
export type ScientificAdditiveCounts = Record<AdditiveScientificConcernLevel, number>;
export type AdditiveCoverage = { totalDetected: number; scientificallyReviewed: number; insufficientData: number; unknown: number };
export type HealthScoreResult = { available: true; finalGrade: HealthGrade; score: number; scoreVersion: string; methodologyVersion: string; calculatedAt: string; components: HealthScoreComponent[]; pillars: HealthPillarResult[]; additiveCounts: ScientificAdditiveCounts; additiveCoverage: AdditiveCoverage; additivesDataStatus: AdditivesDataStatus; nutritionGrade?: string; novaGroup?: number; uncertaintyCount: number; scoreCompleteness: HealthScoreCompleteness } | { available: false; scoreVersion: string; methodologyVersion: string; calculatedAt: string; reason: 'insufficient_data' };

function emptyAdditiveCounts(): ScientificAdditiveCounts { return { no_identified_concern: 0, limited: 0, moderate: 0, high: 0, insufficient_data: 0 }; }
function nutritionBase(grade?: string) { const normalized = grade?.trim().toUpperCase() as keyof typeof NUTRITION_SCORE_MAP | undefined; return normalized && normalized in NUTRITION_SCORE_MAP ? { grade: normalized as HealthGrade, score: NUTRITION_SCORE_MAP[normalized] } : undefined; }
function gradeFor(score: number): HealthGrade { if (score >= HEALTH_GRADE_THRESHOLDS.A) return 'A'; if (score >= HEALTH_GRADE_THRESHOLDS.B) return 'B'; if (score >= HEALTH_GRADE_THRESHOLDS.C) return 'C'; if (score >= HEALTH_GRADE_THRESHOLDS.D) return 'D'; return 'E'; }
function roundScore(value: number) { return Math.round(value * 10) / 10; }

export function getHealthGradeForScore(score: number): HealthGrade { return gradeFor(score); }
export function getHealthGradePresentation(grade: HealthGrade): HealthGradePresentation {
  const presentation: Record<HealthGrade, Omit<HealthGradePresentation, 'grade'>> = {
    A: { label: translate('health.gradeA'), color: '#E3B55A', backgroundColor: 'rgba(227,181,90,0.16)', accentColor: '#C8943A' },
    B: { label: translate('health.gradeB'), color: '#62C58B', backgroundColor: 'rgba(98,197,139,0.16)', accentColor: '#62C58B' },
    C: { label: translate('health.gradeC'), color: '#F0C85A', backgroundColor: 'rgba(240,200,90,0.16)', accentColor: '#F0C85A' },
    D: { label: translate('health.gradeD'), color: '#E58A4F', backgroundColor: 'rgba(229,138,79,0.16)', accentColor: '#E58A4F' },
    E: { label: translate('health.gradeE'), color: '#E96B72', backgroundColor: 'rgba(233,107,114,0.16)', accentColor: '#E96B72' },
  };
  return { grade, ...presentation[grade] };
}

export function aggregateAdditiveScores(levels: AdditiveScientificConcernLevel[]) {
  const counts = emptyAdditiveCounts();
  for (const level of levels) counts[level] += 1;
  const penalty = (['limited', 'moderate', 'high'] as const).reduce((total, level) => total + Math.min(counts[level] * ADDITIVE_PENALTIES[level].perAdditive, ADDITIVE_PENALTIES[level].cap), 0);
  return { score: Math.max(0, 100 - penalty), counts, penalty };
}

function additiveSummary(counts: ScientificAdditiveCounts, total: number) {
  const labels: Record<AdditiveScientificConcernLevel, TranslationKey> = { no_identified_concern: 'scan.concernNone', limited: 'scan.concernLimited', moderate: 'scan.concernModerate', high: 'scan.concernHigh', insufficient_data: 'scan.concernInsufficient' };
  const parts = (Object.keys(counts) as AdditiveScientificConcernLevel[]).filter((level) => counts[level] > 0).map((level) => `${counts[level]} ${translate(labels[level])}`);
  return `${translate(total > 1 ? 'scan.additivesMany' : 'scan.additivesOne', { count: total })} · ${parts.join(', ')}`;
}

export function analyzeHealthScore(data?: ProductHealthData): HealthScoreResult {
  const calculatedAt = new Date().toISOString();
  const nutrition = nutritionBase(data?.nutritionGrade);
  if (!nutrition) return { available: false, scoreVersion: HEALTH_SCORE_VERSION, methodologyVersion: HEALTH_SCORE_METHODOLOGY_VERSION, calculatedAt, reason: 'insufficient_data' };
  const components: HealthScoreComponent[] = [{ type: 'nutrition', label: `Nutri-Score ${nutrition.grade}`, evidenceSource: 'OpenFoodFacts', evidenceLevel: 'provided_nutrition_data', oummahPenalty: 100 - nutrition.score, points: nutrition.score, explanation: translate("health.nutriscoreExplanation") }];
  const detectedAdditives = detectIngredientAdditives(data);
  const detectedCodes = [...new Set(detectedAdditives.map((detection) => detection.code))];
  const levels: AdditiveScientificConcernLevel[] = [];
  const additiveCoverage: AdditiveCoverage = { totalDetected: detectedCodes.length, scientificallyReviewed: 0, insufficientData: 0, unknown: 0 };
  for (const code of detectedCodes) {
    const record = getAdditiveScientificConcern(code);
    const level = record?.scientificConcern.level ?? 'insufficient_data';
    levels.push(level);
    if (record) additiveCoverage.scientificallyReviewed += 1; else additiveCoverage.unknown += 1;
    if (level === 'insufficient_data') additiveCoverage.insufficientData += 1;
    const penalty = level === 'limited' || level === 'moderate' || level === 'high' ? ADDITIVE_PENALTIES[level].perAdditive : 0;
    if (penalty > 0) components.push({ type: 'additive', label: `${code} — ${level}`, evidenceSource: translate("health.additiveRef"), evidenceLevel: record?.scientificConcern.confidence, oummahPenalty: penalty, points: -penalty, scientificClassification: level, explanation: translate("health.additivePenaltyExplanation") });
  }
  const additiveAggregation = aggregateAdditiveScores(levels);
  const additiveCounts = additiveAggregation.counts;
  const additivesDataStatus = getAdditivesDataStatus(data, detectedAdditives);
  const transformationPenalty = data?.novaGroup && data.novaGroup in NOVA_PENALTIES ? NOVA_PENALTIES[data.novaGroup as keyof typeof NOVA_PENALTIES] : 0;
  if (transformationPenalty > 0) components.push({ type: 'transformation', label: `NOVA ${data?.novaGroup}`, evidenceSource: 'OpenFoodFacts nova_group', evidenceLevel: 'provided_nutrition_data', oummahPenalty: transformationPenalty, points: -transformationPenalty, explanation: translate("health.novaExplanation") });
  const score = roundScore(Math.max(0, Math.min(100, nutrition.score - additiveAggregation.penalty - transformationPenalty)));
  const additivePillar: HealthPillarResult = { pillar: 'additives', score: 0, weight: 0, available: false, label: translate('health.additives'), detail: detectedCodes.length ? additiveSummary(additiveCounts, detectedCodes.length) : translate("health.noAdditive") };
  const transformationPillar: HealthPillarResult = { pillar: 'transformation', score: 0, weight: 0, available: data?.novaGroup !== undefined, label: translate('health.processing'), detail: data?.novaGroup ? `NOVA ${data.novaGroup}` : translate('health.novaUnavailable') };
  const nutritionPillar: HealthPillarResult = { pillar: 'nutrition', score: nutrition.score, weight: 1, available: true, label: 'Nutrition', detail: `Nutri-Score ${nutrition.grade}` };
  const health = analyzeHealthIngredients(data);
  const scoreCompleteness: HealthScoreCompleteness = additiveCoverage.unknown > 0 || additiveCoverage.insufficientData > 0 || data?.novaGroup === undefined ? 'partial' : 'complete';
  return { available: true, finalGrade: gradeFor(score), score, scoreVersion: HEALTH_SCORE_VERSION, methodologyVersion: HEALTH_SCORE_METHODOLOGY_VERSION, calculatedAt, components, pillars: [nutritionPillar, additivePillar, transformationPillar], additiveCounts, additiveCoverage, additivesDataStatus, nutritionGrade: nutrition.grade, novaGroup: data?.novaGroup, uncertaintyCount: additiveCounts.insufficient_data + (health.hasReliableData ? 0 : 1), scoreCompleteness };
}
