import type { BarcodeLookupResult } from './data/BoycottRepository';
import { analyzeHalalCertification } from './halalCertificationAnalyzer';

export type ProductCompleteness = 'complete' | 'partial' | 'poor' | 'unknown';
export type ReviewReason = 'missing_ingredients' | 'unknown_certifier' | 'poor_category' | 'missing_brand' | 'missing_nutrition' | 'unknown_product';
export type ScanKnowledge = { completeness: ProductCompleteness; needsReview: boolean; reviewReasons: ReviewReason[] };

export function assessScanKnowledge(result: BarcodeLookupResult): ScanKnowledge {
  const has = [result.productName, result.brandLabel, result.imageUrl, result.healthData?.ingredientsText, result.healthData?.nutritionGrade, result.comparisonData?.categoriesTags?.length, analyzeHalalCertification(result.halalData, result.healthData?.ingredientsText).certification, result.boycottEntity].map(Boolean);
  const count = has.filter(Boolean).length;
  const completeness: ProductCompleteness = count === 0 ? 'unknown' : count <= 2 ? 'poor' : count <= 5 ? 'partial' : 'complete';
  const reviewReasons: ReviewReason[] = [];
  if (!result.healthData?.ingredientsText) reviewReasons.push('missing_ingredients');
  if (result.halalData && !analyzeHalalCertification(result.halalData, result.healthData?.ingredientsText).certification && (result.halalData.labels?.length || result.halalData.certifications?.length)) reviewReasons.push('unknown_certifier');
  if (!result.comparisonData?.categoriesTags?.length) reviewReasons.push('poor_category');
  if (!result.brandLabel) reviewReasons.push('missing_brand');
  if (!result.healthData?.nutritionGrade && !result.healthData?.nutrientLevels) reviewReasons.push('missing_nutrition');
  if (result.assessment === 'unknown') reviewReasons.push('unknown_product');
  return { completeness, needsReview: reviewReasons.length > 0, reviewReasons };
}
