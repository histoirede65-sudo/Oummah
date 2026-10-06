import type { ProductHealthData } from './data/BoycottRepository';
import { getAdditivePresentationLevelForScientificClassification, getAdditiveScientificAssessment, normalizeAdditiveCode, type AdditivePresentationLevel, type AdditiveScientificClassification } from './additiveInfoRepository';
import { detectIngredientAdditives, getAdditivesDataStatus, type IngredientAdditiveDetectionSource } from './ingredientAdditiveDetector';
import { localizedRecord, translate, type TranslationKey } from '../../i18n/translate';

export type HealthFinding = {
  label: string;
  detail: string;
  kind: 'watch' | 'allergen' | 'additive' | 'positive';
  additiveCode?: string;
  attentionLevel?: AdditivePresentationLevel;
  scientificClassification?: AdditiveScientificClassification;
  detectionSource?: IngredientAdditiveDetectionSource;
  matchedText?: string;
};

export type HealthIngredientAnalysis = {
  hasReliableData: boolean;
  hasIngredientText: boolean;
  hasAllergenData: boolean;
  hasAdditiveData: boolean;
  watchItems: HealthFinding[];
  allergens: HealthFinding[];
  additives: HealthFinding[];
  positives: HealthFinding[];
  additiveLevelCounts: Record<AdditivePresentationLevel, number>;
};

const ALLERGEN_LABELS: Record<string, string> = localizedRecord({
  milk: 'allergen.milk', dairy: 'allergen.milk', gluten: 'allergen.gluten', wheat: 'allergen.wheat', peanuts: 'allergen.peanuts', peanut: 'allergen.peanuts',
  nuts: 'allergen.nuts', soybeans: 'allergen.soy', soy: 'allergen.soy', eggs: 'allergen.eggs', egg: 'allergen.eggs', fish: 'allergen.fish',
  crustaceans: 'allergen.crustaceans', molluscs: 'allergen.molluscs', celery: 'allergen.celery', mustard: 'allergen.mustard', sesame: 'allergen.sesame',
  lupin: 'allergen.lupin', sulphur_dioxide_and_sulphites: 'allergen.sulphites',
} satisfies Record<string, TranslationKey>);

const ADDITIVE_LABELS: Record<string, string> = localizedRecord({
  e950: 'additive.e950', e951: 'additive.e951', e952: 'additive.e952', e953: 'additive.e953', e954: 'additive.e954',
  e960c: 'additive.e960c',
  e955: 'additive.e955', e960: 'additive.e960', e202: 'additive.e202', e330: 'additive.e330',
  e322: 'additive.e322', e331: 'additive.e331', e338: 'additive.e338', e621: 'additive.e621', e150d: 'additive.e150d',
} satisfies Record<string, TranslationKey>);

const SCIENTIFIC_CLASSIFICATION_LABELS: Record<AdditiveScientificClassification, string> = localizedRecord({
  no_particular_signal: 'additiveLevel.none',
  limited_concern: 'additiveLevel.limited',
  moderate_concern: 'additiveLevel.moderate',
  high_concern: 'additiveLevel.high',
  insufficient_data: 'additiveLevel.insufficient',
});

function cleanTag(tag: string) {
  return tag.toLowerCase().replace(/^(en|fr):/, '').replace(/[^a-z0-9_]/g, '');
}

function additiveCode(tag: string) {
  return normalizeAdditiveCode(cleanTag(tag));
}

function hasMeaningfulData(data: ProductHealthData) {
  return Boolean(data.ingredientsText?.trim() || data.ingredientsTextVariants?.some((value) => value.trim()) || data.ingredientNames?.some((value) => value.trim()) || data.ingredientsStructured?.length || data.allergensTags !== undefined || data.additivesTags !== undefined || data.additivesOriginalTags !== undefined || data.additivesNumber !== undefined || data.nutrientLevels || data.nutritionGrade || data.novaGroup !== undefined);
}

export function analyzeHealthIngredients(data?: ProductHealthData): HealthIngredientAnalysis {
  if (!data) return emptyAnalysis();

  const watchItems: HealthFinding[] = [];
  const allergens: HealthFinding[] = [];
  const additives: HealthFinding[] = [];
  const positives: HealthFinding[] = [];
  const detectedAdditives = detectIngredientAdditives(data);
  const additivesDataStatus = getAdditivesDataStatus(data, detectedAdditives);
  const levels = data.nutrientLevels;
  const levelLabels: Array<[keyof NonNullable<ProductHealthData['nutrientLevels']>, string]> = [
    ['sugars', translate('health.highSugar')], ['salt', translate('health.highSalt')], ['saturated-fat', translate('health.highSatFat')],
  ];

  for (const [key, label] of levelLabels) {
    if (levels?.[key] === 'high') watchItems.push({ label, detail: translate("health.nutritionInfo"), kind: 'watch' });
  }

  if (data.novaGroup === 4) watchItems.push({ label: translate("health.highProcessing"), detail: translate("health.nova4"), kind: 'watch' });
  const ingredients = data.ingredientsText?.toLowerCase() ?? '';
  if (/huile\s+de\s+palme|palm\s+oil/.test(ingredients)) watchItems.push({ label: translate("health.palmOil"), detail: translate("health.palmOilDetail"), kind: 'watch' });
  if (/hydrog[eé]n|hydrogenated/.test(ingredients)) watchItems.push({ label: translate("health.hydrogenated"), detail: translate("health.watch"), kind: 'watch' });

  for (const tag of data.allergensTags ?? []) {
    const key = cleanTag(tag);
    const label = ALLERGEN_LABELS[key] ?? key.replace(/_/g, ' ');
    if (label) allergens.push({ label, detail: translate("health.allergenDeclared"), kind: 'allergen' });
  }

  for (const detection of detectedAdditives) {
    const code = detection.code;
    const key = code.toLowerCase();
    const scientificAssessment = data.scientificAssessments?.[code] ?? getAdditiveScientificAssessment(code);
    const attentionLevel = getAdditivePresentationLevelForScientificClassification(scientificAssessment.classification);
    const detail = SCIENTIFIC_CLASSIFICATION_LABELS[scientificAssessment.classification];
    additives.push({ label: `${code}${ADDITIVE_LABELS[key] ? ` · ${ADDITIVE_LABELS[key]}` : ''}`, detail, kind: 'additive', additiveCode: code, attentionLevel, scientificClassification: scientificAssessment.classification, detectionSource: detection.detectionSource, matchedText: detection.matchedText });
  }

  const grade = data.nutritionGrade?.trim().toUpperCase();
  if (grade === 'A' || grade === 'B') positives.push({ label: `Nutri-Score ${grade}`, detail: translate("health.nutriscoreAvailable"), kind: 'positive' });
  if (data.ingredientsText?.trim()) {
    const count = data.ingredientsText.split(',').map((item) => item.trim()).filter(Boolean).length;
    if (count > 0 && count <= 5) positives.push({ label: translate("health.shortList"), detail: translate("health.fromText"), kind: 'positive' });
  }
  if (additivesDataStatus === 'known_none') positives.push({ label: translate("health.noAdditiveDeclared"), detail: translate("health.fromData"), kind: 'positive' });

  const additiveLevelCounts = emptyAdditiveLevelCounts();
  for (const item of additives) if (item.attentionLevel) additiveLevelCounts[item.attentionLevel] += 1;
  return { hasReliableData: hasMeaningfulData(data), hasIngredientText: Boolean(data.ingredientsText?.trim() || data.ingredientsTextVariants?.some((value) => value.trim()) || data.ingredientNames?.some((value) => value.trim())), hasAllergenData: data.allergensTags !== undefined, hasAdditiveData: additivesDataStatus !== 'insufficient_data', watchItems, allergens, additives, positives, additiveLevelCounts };
}

function emptyAdditiveLevelCounts(): Record<AdditivePresentationLevel, number> {
  return { risk_high: 0, risk_limited: 0, neutral_or_no_particular_signal: 0, insufficient_data: 0 };
}

function emptyAnalysis(): HealthIngredientAnalysis {
  return { hasReliableData: false, hasIngredientText: false, hasAllergenData: false, hasAdditiveData: false, watchItems: [], allergens: [], additives: [], positives: [], additiveLevelCounts: emptyAdditiveLevelCounts() };
}
