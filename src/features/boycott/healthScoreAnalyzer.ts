import type { ProductHealthData } from './data/BoycottRepository';
import { analyzeHealthIngredients } from './healthIngredientAnalyzer';
import { getAdditiveInfo, getAdditiveScientificAssessment, type AdditiveScientificClassification } from './additiveInfoRepository';
import { detectIngredientAdditives } from './ingredientAdditiveDetector';

export const HEALTH_SCORE_VERSION = '2.2';
export const HEALTH_SCORE_METHODOLOGY_TEXT = 'L’indice Santé OUMMAH est une méthodologie propre à OUMMAH construite à partir de données nutritionnelles et d’évaluations scientifiques documentées. Il ne constitue pas une note officielle d’une autorité sanitaire. La sévérité cumulative du pilier Additifs a été renforcée afin que plusieurs signaux scientifiques documentés aient un effet non linéaire sur le score.';
export const HEALTH_SCORE_WEIGHTS = { nutrition: 0.5, additives: 0.3, transformation: 0.2 } as const;
export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type HealthScoreCompleteness = 'complete' | 'partial' | 'nutrition_only';
export type HealthGradePresentation = { grade: HealthGrade; label: string; color: string; backgroundColor: string; accentColor: string };
export type HealthPillar = 'nutrition' | 'additives' | 'transformation';
export type HealthPillarResult = { pillar: HealthPillar; score: number; weight: number; available: boolean; label: string; detail: string };
export type HealthScoreComponent = { type: HealthPillar | 'additive'; label: string; evidenceSource: string; evidenceLevel?: string; oummahPenalty: number; points: number; explanation: string; scientificClassification?: AdditiveScientificClassification };
export type ScientificAdditiveCounts = Record<AdditiveScientificClassification, number>;
export type AdditiveCoverage = { totalDetected: number; scientificallyReviewed: number; insufficientData: number; unknown: number };
export type HealthScoreResult = { available: true; finalGrade: HealthGrade; score: number; scoreVersion: string; calculatedAt: string; components: HealthScoreComponent[]; pillars: HealthPillarResult[]; additiveCounts: ScientificAdditiveCounts; additiveCoverage: AdditiveCoverage; nutritionGrade?: string; novaGroup?: number; uncertaintyCount: number; scoreCompleteness: HealthScoreCompleteness } | { available: false; scoreVersion: string; calculatedAt: string; reason: 'insufficient_data' };

const NUTRITION_SCORE: Record<HealthGrade, number> = { A: 100, B: 80, C: 60, D: 40, E: 20 };
const ADDITIVE_SCORE: Record<AdditiveScientificClassification, number | undefined> = { no_particular_signal: 100, limited_concern: 65, moderate_concern: 40, high_concern: 10, insufficient_data: undefined };
const LIMITED_CONCERN_PENALTIES = [35, 45] as const;
const LIMITED_CONCERN_ADDITIONAL_PENALTY = 20;
const MODERATE_CONCERN_FIRST_PENALTY = 60;
const MODERATE_CONCERN_ADDITIONAL_PENALTY = 30;
const HIGH_CONCERN_MAX_SCORE = 10;
const NOVA_SCORE: Record<number, number> = { 1: 100, 2: 80, 3: 60, 4: 20 };
const GRADE_RANK: Record<HealthGrade, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

function emptyAdditiveCounts(): ScientificAdditiveCounts { return { no_particular_signal: 0, limited_concern: 0, moderate_concern: 0, high_concern: 0, insufficient_data: 0 }; }
function nutritionBase(grade?: string) { const normalized = grade?.trim().toUpperCase(); return normalized && normalized in NUTRITION_SCORE ? { grade: normalized as HealthGrade, score: NUTRITION_SCORE[normalized as HealthGrade] } : undefined; }
function gradeFor(score: number): HealthGrade { if (score >= 80) return 'A'; if (score >= 65) return 'B'; if (score >= 50) return 'C'; if (score >= 30) return 'D'; return 'E'; }
function roundScore(value: number) { return Math.round(value * 10) / 10; }

export function getHealthGradeForScore(score: number): HealthGrade { return gradeFor(score); }

export function getHealthGradePresentation(grade: HealthGrade): HealthGradePresentation {
  const presentation: Record<HealthGrade, Omit<HealthGradePresentation, 'grade'>> = {
    A: { label: 'Très bon', color: '#E3B55A', backgroundColor: 'rgba(227,181,90,0.16)', accentColor: '#C8943A' },
    B: { label: 'Bon', color: '#62C58B', backgroundColor: 'rgba(98,197,139,0.16)', accentColor: '#62C58B' },
    C: { label: 'Moyen', color: '#F0C85A', backgroundColor: 'rgba(240,200,90,0.16)', accentColor: '#F0C85A' },
    D: { label: 'Médiocre', color: '#E58A4F', backgroundColor: 'rgba(229,138,79,0.16)', accentColor: '#E58A4F' },
    E: { label: 'Mauvais', color: '#E96B72', backgroundColor: 'rgba(233,107,114,0.16)', accentColor: '#E96B72' },
  };
  return { grade, ...presentation[grade] };
}

export function aggregateAdditiveScores(classifications: AdditiveScientificClassification[]) {
  const counts = emptyAdditiveCounts();
  for (const classification of classifications) counts[classification] += 1;
  const limitedPenalty = LIMITED_CONCERN_PENALTIES.slice(0, counts.limited_concern).reduce((sum, value) => sum + value, 0) + Math.max(0, counts.limited_concern - LIMITED_CONCERN_PENALTIES.length) * LIMITED_CONCERN_ADDITIONAL_PENALTY;
  const moderatePenalty = counts.moderate_concern > 0 ? MODERATE_CONCERN_FIRST_PENALTY + Math.max(0, counts.moderate_concern - 1) * MODERATE_CONCERN_ADDITIONAL_PENALTY : 0;
  const penalty = limitedPenalty + moderatePenalty;
  const highConcernCapApplied = counts.high_concern > 0;
  const baseScore = highConcernCapApplied ? HIGH_CONCERN_MAX_SCORE : 100;
  return { score: Math.max(0, baseScore - penalty), counts, penalty, highConcernCapApplied };
}

export function analyzeHealthScore(data?: ProductHealthData): HealthScoreResult {
  const calculatedAt = new Date().toISOString();
  const nutrition = nutritionBase(data?.nutritionGrade);
  if (!nutrition) return { available: false, scoreVersion: HEALTH_SCORE_VERSION, calculatedAt, reason: 'insufficient_data' };

  const components: HealthScoreComponent[] = [{ type: 'nutrition', label: `Nutri-Score ${nutrition.grade}`, evidenceSource: 'OpenFoodFacts', evidenceLevel: 'provided_nutrition_data', oummahPenalty: 100 - nutrition.score, points: nutrition.score, explanation: 'Score nutritionnel officiel fourni par OpenFoodFacts ; il n’est pas recalculé par OUMMAH.' }];
  const classifications: AdditiveScientificClassification[] = [];
  const detectedCodes = new Set<string>();
  const additiveCoverage: AdditiveCoverage = { totalDetected: 0, scientificallyReviewed: 0, insufficientData: 0, unknown: 0 };
  const detectedAdditives = detectIngredientAdditives(data);
  for (const detection of detectedAdditives) {
    const code = detection.code;
    const isNewCode = !detectedCodes.has(code);
    if (isNewCode) {
      detectedCodes.add(code);
      additiveCoverage.totalDetected += 1;
    }
    const assessment = data?.scientificAssessments?.[code] ?? getAdditiveScientificAssessment(code);
    if (isNewCode) {
      const hasScientificRecord = assessment.sources.length > 0 || getAdditiveInfo(code).sources.length > 0;
      if (hasScientificRecord) additiveCoverage.scientificallyReviewed += 1;
      else additiveCoverage.unknown += 1;
      if (hasScientificRecord && assessment.classification === 'insufficient_data') additiveCoverage.insufficientData += 1;
    }
    classifications.push(assessment.classification);
    const score = ADDITIVE_SCORE[assessment.classification];
    components.push({ type: 'additive', label: `${code} — ${assessment.classification}`, evidenceSource: assessment.sources.map((source) => source.organisation).join(' / ') || 'Référentiel scientifique OUMMAH', evidenceLevel: assessment.evidenceStrength, oummahPenalty: score === undefined ? 0 : 100 - score, points: score ?? 0, scientificClassification: assessment.classification, explanation: score === undefined ? 'Données scientifiques insuffisantes pour cet additif ; aucune pénalité arbitraire.' : 'Contribution fondée sur la classification scientifique OUMMAH.' });
  }
  const additiveAggregation = aggregateAdditiveScores(classifications);
  const additiveScore = roundScore(additiveAggregation.score);
  const { counts } = additiveAggregation;
  const additiveDetail = `${counts.limited_concern + counts.moderate_concern + counts.high_concern} à surveiller, ${counts.no_particular_signal} sans signal particulier, ${counts.insufficient_data} insuffisamment documenté${counts.insufficient_data > 1 ? 's' : ''}`;
  const hasAdditiveData = data?.additivesTags !== undefined || detectedAdditives.length > 0;
  const detectedAdditiveCount = detectedAdditives.length;
  const additivePillar: HealthPillarResult = { pillar: 'additives', score: additiveScore, weight: HEALTH_SCORE_WEIGHTS.additives, available: hasAdditiveData, label: 'Additifs', detail: `${detectedAdditiveCount} additif${detectedAdditiveCount > 1 ? 's' : ''} détecté${detectedAdditiveCount > 1 ? 's' : ''} · ${additiveDetail}` };

  const transformationScore = data?.novaGroup && NOVA_SCORE[data.novaGroup] !== undefined ? NOVA_SCORE[data.novaGroup] : undefined;
  const transformationPillar: HealthPillarResult = { pillar: 'transformation', score: transformationScore ?? 0, weight: HEALTH_SCORE_WEIGHTS.transformation, available: transformationScore !== undefined, label: 'Transformation', detail: data?.novaGroup ? `NOVA ${data.novaGroup}` : 'Niveau NOVA indisponible' };
  if (data?.novaGroup === 4) components.push({ type: 'transformation', label: 'NOVA 4', evidenceSource: 'OpenFoodFacts nova_group', evidenceLevel: 'provided_nutrition_data', oummahPenalty: 80, points: 20, explanation: 'NOVA 4 reçoit une pondération distincte et inférieure à celle de la nutrition.' });

  const nutritionPillar: HealthPillarResult = { pillar: 'nutrition', score: nutrition.score, weight: HEALTH_SCORE_WEIGHTS.nutrition, available: true, label: 'Nutrition', detail: `Nutri-Score ${nutrition.grade}` };
  const pillars = [nutritionPillar, additivePillar, transformationPillar];
  const availablePillars = pillars.filter((pillar) => pillar.available);
  const weightTotal = availablePillars.reduce((sum, pillar) => sum + pillar.weight, 0);
  const score = roundScore(availablePillars.reduce((sum, pillar) => sum + pillar.score * (pillar.weight / weightTotal), 0));
  const health = analyzeHealthIngredients(data);
  const hasTransformationData = transformationScore !== undefined;
  const scoreCompleteness: HealthScoreCompleteness = additiveCoverage.unknown > 0 || additiveCoverage.insufficientData > 0 ? 'partial' : hasAdditiveData && hasTransformationData ? 'complete' : hasAdditiveData || hasTransformationData ? 'partial' : 'nutrition_only';
  const rawGrade = gradeFor(score);
  const finalGrade = scoreCompleteness === 'nutrition_only' && GRADE_RANK[rawGrade] < GRADE_RANK[nutrition.grade] ? nutrition.grade : rawGrade;
  return { available: true, finalGrade, score, scoreVersion: HEALTH_SCORE_VERSION, calculatedAt, components, pillars, additiveCounts: counts, additiveCoverage, nutritionGrade: nutrition.grade, novaGroup: data?.novaGroup, uncertaintyCount: counts.insufficient_data + (health.hasReliableData ? 0 : 1), scoreCompleteness };
}
