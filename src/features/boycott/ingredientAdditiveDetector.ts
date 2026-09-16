import type { ProductHealthData } from './data/BoycottRepository';
import { normalizeAdditiveCode } from './additiveInfoRepository';

export type IngredientAdditiveDetectionSource = 'openfoodfacts_structured' | 'ingredient_text_verified_mapping' | 'both';

export type IngredientAdditiveDetection = {
  code: string;
  detectionSource: IngredientAdditiveDetectionSource;
  matchedText?: string;
};

export type RegulatoryIngredientAlias = {
  normalizedLabel: string;
  code: string;
  sourceOrganisation: string;
  sourceUrl: string;
  verifiedAt: string;
};

const EU_REGULATION_URL = 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R1922';

export const REGULATORY_INGREDIENT_ALIASES: readonly RegulatoryIngredientAlias[] = [
  {
    normalizedLabel: 'glycosides de steviol produits par voie enzymatique',
    code: 'E960C',
    sourceOrganisation: 'Union européenne / EUR-Lex',
    sourceUrl: EU_REGULATION_URL,
    verifiedAt: '2026-09-16',
  },
  {
    normalizedLabel: 'enzymatically produced steviol glycosides',
    code: 'E960C',
    sourceOrganisation: 'Union européenne / EUR-Lex',
    sourceUrl: EU_REGULATION_URL,
    verifiedAt: '2026-09-16',
  },
];

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/^(en|fr)\s+/, '').replace(/[’']/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function ingredientTexts(data: ProductHealthData): string[] {
  return [data.ingredientsText, ...(data.ingredientsTextVariants ?? []), ...(data.ingredientNames ?? [])]
    .filter((value): value is string => Boolean(value?.trim()));
}

function matchesVerifiedE960CText(text: string): boolean {
  return text.split(/[,;.]+/).some((segment) => {
    const normalizedSegment = normalizeText(segment);
    const hasSteviolGlycosides = normalizedSegment.includes('glycosides de steviol');
    const hasEnzymaticProcess = normalizedSegment.includes('enzymatique');
    const hasEnglishVerifiedName = normalizedSegment.includes('enzymatically produced steviol glycosides');
    return (hasSteviolGlycosides && hasEnzymaticProcess) || hasEnglishVerifiedName;
  });
}

function structuredCodes(data: ProductHealthData): string[] {
  return (data.additivesTags ?? []).map(normalizeAdditiveCode).filter((code): code is string => Boolean(code));
}

function textDetections(data: ProductHealthData): IngredientAdditiveDetection[] {
  const detections: IngredientAdditiveDetection[] = [];
  for (const text of ingredientTexts(data)) {
    const normalizedText = normalizeText(text);
    for (const alias of REGULATORY_INGREDIENT_ALIASES) {
      const matchesAlias = alias.code === 'E960C'
        ? matchesVerifiedE960CText(text)
        : normalizedText.includes(alias.normalizedLabel);
      if (matchesAlias) detections.push({ code: alias.code, detectionSource: 'ingredient_text_verified_mapping', matchedText: text });
    }
    for (const codeMatch of text.match(/\bE\s?\d{3,4}[A-Z]?\b/gi) ?? []) {
      const code = normalizeAdditiveCode(codeMatch);
      if (code) detections.push({ code, detectionSource: 'ingredient_text_verified_mapping', matchedText: codeMatch });
    }
  }
  return detections;
}

export function detectIngredientAdditives(data?: ProductHealthData): IngredientAdditiveDetection[] {
  if (!data) return [];
  const detections = new Map<string, IngredientAdditiveDetection>();
  for (const code of structuredCodes(data)) detections.set(code, { code, detectionSource: 'openfoodfacts_structured' });
  for (const detection of textDetections(data)) {
    const previous = detections.get(detection.code);
    detections.set(detection.code, previous ? { ...detection, detectionSource: 'both', matchedText: detection.matchedText } : detection);
  }
  return [...detections.values()];
}
