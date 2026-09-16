import type { ProductHealthData } from './data/BoycottRepository';
import { getAdditivePresentationLevelForScientificClassification, getAdditiveScientificAssessment, normalizeAdditiveCode, type AdditivePresentationLevel, type AdditiveScientificClassification } from './additiveInfoRepository';
import { detectIngredientAdditives, type IngredientAdditiveDetectionSource } from './ingredientAdditiveDetector';

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

const ALLERGEN_LABELS: Record<string, string> = {
  milk: 'Lait', dairy: 'Lait', gluten: 'Gluten', wheat: 'Blé', peanuts: 'Arachides', peanut: 'Arachides',
  nuts: 'Fruits à coque', soybeans: 'Soja', soy: 'Soja', eggs: 'Œufs', egg: 'Œufs', fish: 'Poisson',
  crustaceans: 'Crustacés', molluscs: 'Mollusques', celery: 'Céleri', mustard: 'Moutarde', sesame: 'Sésame',
  lupin: 'Lupin', sulphur_dioxide_and_sulphites: 'Sulfites',
};

const ADDITIVE_LABELS: Record<string, string> = {
  e950: 'Acésulfame-K', e951: 'Aspartame', e952: 'Cyclamates', e953: 'Isomalt', e954: 'Saccharine',
  e960c: 'Glycosides de stéviol produits enzymatiquement',
  e955: 'Sucralose', e960: 'Glycosides de stéviol', e202: 'Sorbate de potassium', e330: 'Acide citrique',
  e322: 'Lécithines', e331: 'Citrates de sodium', e338: 'Acide phosphorique', e621: 'Glutamate monosodique', e150d: 'Caramel au sulfite d’ammonium',
};

const SCIENTIFIC_CLASSIFICATION_LABELS: Record<AdditiveScientificClassification, string> = {
  no_particular_signal: 'Pas de signal particulier',
  limited_concern: 'Risque limité',
  moderate_concern: 'Risque modéré',
  high_concern: 'À risque',
  insufficient_data: 'Données insuffisantes',
};

function cleanTag(tag: string) {
  return tag.toLowerCase().replace(/^(en|fr):/, '').replace(/[^a-z0-9_]/g, '');
}

function additiveCode(tag: string) {
  return normalizeAdditiveCode(cleanTag(tag));
}

function hasMeaningfulData(data: ProductHealthData) {
  return Boolean(data.ingredientsText?.trim() || data.ingredientsTextVariants?.some((value) => value.trim()) || data.ingredientNames?.some((value) => value.trim()) || data.allergensTags !== undefined || data.additivesTags !== undefined || data.nutrientLevels || data.nutritionGrade || data.novaGroup !== undefined);
}

export function analyzeHealthIngredients(data?: ProductHealthData): HealthIngredientAnalysis {
  if (!data) return emptyAnalysis();

  const watchItems: HealthFinding[] = [];
  const allergens: HealthFinding[] = [];
  const additives: HealthFinding[] = [];
  const positives: HealthFinding[] = [];
  const levels = data.nutrientLevels;
  const levelLabels: Array<[keyof NonNullable<ProductHealthData['nutrientLevels']>, string]> = [
    ['sugars', 'Sucre élevé'], ['salt', 'Sel élevé'], ['saturated-fat', 'Graisses saturées élevées'],
  ];

  for (const [key, label] of levelLabels) {
    if (levels?.[key] === 'high') watchItems.push({ label, detail: 'Information nutritionnelle à prendre en compte', kind: 'watch' });
  }

  if (data.novaGroup === 4) watchItems.push({ label: 'Transformation élevée', detail: 'NOVA 4 — peut nécessiter une attention particulière', kind: 'watch' });
  const ingredients = data.ingredientsText?.toLowerCase() ?? '';
  if (/huile\s+de\s+palme|palm\s+oil/.test(ingredients)) watchItems.push({ label: 'Huile de palme', detail: 'Matière grasse à prendre en compte', kind: 'watch' });
  if (/hydrog[eé]n|hydrogenated/.test(ingredients)) watchItems.push({ label: 'Matière grasse hydrogénée', detail: 'À surveiller', kind: 'watch' });

  for (const tag of data.allergensTags ?? []) {
    const key = cleanTag(tag);
    const label = ALLERGEN_LABELS[key] ?? key.replace(/_/g, ' ');
    if (label) allergens.push({ label, detail: 'Allergène déclaré dans la fiche produit', kind: 'allergen' });
  }

  for (const detection of detectIngredientAdditives(data)) {
    const code = detection.code;
    const key = code.toLowerCase();
    const scientificAssessment = data.scientificAssessments?.[code] ?? getAdditiveScientificAssessment(code);
    const attentionLevel = getAdditivePresentationLevelForScientificClassification(scientificAssessment.classification);
    const detail = SCIENTIFIC_CLASSIFICATION_LABELS[scientificAssessment.classification];
    additives.push({ label: `${code}${ADDITIVE_LABELS[key] ? ` · ${ADDITIVE_LABELS[key]}` : ''}`, detail, kind: 'additive', additiveCode: code, attentionLevel, scientificClassification: scientificAssessment.classification, detectionSource: detection.detectionSource, matchedText: detection.matchedText });
  }

  const grade = data.nutritionGrade?.trim().toUpperCase();
  if (grade === 'A' || grade === 'B') positives.push({ label: `Nutri-Score ${grade}`, detail: 'Repère nutritionnel disponible', kind: 'positive' });
  if (data.ingredientsText?.trim()) {
    const count = data.ingredientsText.split(',').map((item) => item.trim()).filter(Boolean).length;
    if (count > 0 && count <= 5) positives.push({ label: 'Liste d’ingrédients courte', detail: 'D’après le texte disponible', kind: 'positive' });
  }
  if (data.ingredientsText?.trim() && Array.isArray(data.additivesTags) && data.additivesTags.length === 0) positives.push({ label: 'Aucun additif déclaré', detail: 'Selon les données disponibles', kind: 'positive' });

  const additiveLevelCounts = emptyAdditiveLevelCounts();
  for (const item of additives) if (item.attentionLevel) additiveLevelCounts[item.attentionLevel] += 1;
  return { hasReliableData: hasMeaningfulData(data), hasIngredientText: Boolean(data.ingredientsText?.trim() || data.ingredientsTextVariants?.some((value) => value.trim()) || data.ingredientNames?.some((value) => value.trim())), hasAllergenData: data.allergensTags !== undefined, hasAdditiveData: data.additivesTags !== undefined || additives.length > 0, watchItems, allergens, additives, positives, additiveLevelCounts };
}

function emptyAdditiveLevelCounts(): Record<AdditivePresentationLevel, number> {
  return { risk_high: 0, risk_limited: 0, neutral_or_no_particular_signal: 0, insufficient_data: 0 };
}

function emptyAnalysis(): HealthIngredientAnalysis {
  return { hasReliableData: false, hasIngredientText: false, hasAllergenData: false, hasAdditiveData: false, watchItems: [], allergens: [], additives: [], positives: [], additiveLevelCounts: emptyAdditiveLevelCounts() };
}
