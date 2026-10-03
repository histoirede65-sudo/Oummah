import type { OtherFoodComponent, ProductHealthData } from './data/BoycottRepository';
import { getAdditiveAliasEntries, normalizeAdditiveCode } from './additiveInfoRepository';
import { getKnownAdditiveCode } from './data/knownAdditiveCodeCatalog';
import type { AdditivesDataStatus } from './data/BoycottRepository';

export type IngredientAdditiveDetectionSource = 'openfoodfacts_structured' | 'ingredient_text_verified_mapping' | 'both';

export type IngredientAdditiveDetection = {
  code: string;
  detectionSource: IngredientAdditiveDetectionSource;
  matchedText?: string;
  matchedBy?: 'structured_tag' | 'structured_ingredient' | 'ingredient_text' | 'alias';
  matchedValue?: string;
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
  return [...(data.additivesTags ?? []), ...(data.additivesOriginalTags ?? [])]
    .map(normalizeAdditiveCode)
    .filter((code): code is string => typeof code === 'string' && Boolean(getKnownAdditiveCode(code)));
}

function textDetections(data: ProductHealthData): IngredientAdditiveDetection[] {
  const detections: IngredientAdditiveDetection[] = [];
  for (const text of ingredientTexts(data)) {
    const normalizedText = normalizeText(text);
    for (const alias of REGULATORY_INGREDIENT_ALIASES) {
      const matchesAlias = alias.code === 'E960C'
        ? matchesVerifiedE960CText(text)
        : normalizedText.includes(alias.normalizedLabel);
      if (matchesAlias) detections.push({ code: alias.code, detectionSource: 'ingredient_text_verified_mapping', matchedBy: 'alias', matchedValue: alias.normalizedLabel, matchedText: text });
    }
    for (const { code, aliases } of getAdditiveAliasEntries()) {
      const matchedAlias = aliases.find((alias) => normalizedText.includes(normalizeText(alias)));
      if (matchedAlias) detections.push({ code, detectionSource: 'ingredient_text_verified_mapping', matchedBy: 'alias', matchedValue: matchedAlias, matchedText: matchedAlias });
    }
    for (const codeMatch of text.match(/\bE\s?\d{3,4}[A-Z]?\b/gi) ?? []) {
      const code = normalizeAdditiveCode(codeMatch);
      if (code && getKnownAdditiveCode(code)) detections.push({ code, detectionSource: 'ingredient_text_verified_mapping', matchedBy: 'ingredient_text', matchedValue: codeMatch, matchedText: codeMatch });
    }
  }
  return detections;
}

export function detectIngredientAdditives(data?: ProductHealthData): IngredientAdditiveDetection[] {
  if (!data) return [];
  const detections = new Map<string, IngredientAdditiveDetection>();
  for (const code of structuredCodes(data)) detections.set(code, { code, detectionSource: 'openfoodfacts_structured', matchedBy: 'structured_tag', matchedValue: code });
  for (const detection of textDetections(data)) {
    const previous = detections.get(detection.code);
    detections.set(detection.code, previous ? { ...detection, detectionSource: 'both', matchedText: detection.matchedText } : detection);
  }
  return [...detections.values()];
}

export function detectOtherFoodComponents(data?: ProductHealthData) {
  if (!data) return [];
  const components = new Map<string, OtherFoodComponent>();
  const texts: Array<{ value: string; source: OtherFoodComponent['source'] }> = [
    ...ingredientTexts(data).map((value) => ({ value, source: 'ingredient_text' as const })),
    ...(data.ingredientsStructured ?? []).flatMap((ingredient) => ingredient.text ? [{ value: ingredient.text, source: 'ingredient_structured' as const }] : []),
  ];
  for (const { value, source } of texts) {
    const normalizedValue = normalizeText(value);
    if (/\barome\s+(artificiel|artificielle|naturel|naturelle)|\bartificial\s+flavou?ring|\bnatural\s+flavou?ring/i.test(normalizedValue)) {
      const key = normalizedValue.match(/(arome\s+(artificiel|artificielle|naturel|naturelle)|artificial\s+flavou?ring|natural\s+flavou?ring)/)?.[0] ?? 'flavoring';
      components.set(key, { kind: 'flavoring', label: 'Arôme', matchedText: value, source });
    }
  }
  return [...components.values()];
}

export function getAdditivesDataStatus(data?: ProductHealthData, detectedAdditives = detectIngredientAdditives(data)): AdditivesDataStatus {
  if (!data) return 'insufficient_data';
  if (detectedAdditives.length > 0) return 'known_with_additives';
  if (typeof data.additivesNumber === 'number' && data.additivesNumber > 0) return 'insufficient_data';
  const hasIngredientEvidence = Boolean(data.ingredientsText?.trim() || data.ingredientsTextVariants?.some((value) => value.trim()) || data.ingredientNames?.some((value) => value.trim()) || data.ingredientsStructured?.some((ingredient) => Boolean(ingredient.id?.trim() || ingredient.text?.trim())));
  const hasExplicitNoAdditivesStatement = ingredientTexts(data).some((text) => /\b(no|without|sans)\s+(added\s+)?additives?\b/i.test(normalizeText(text)));
  if (data.additivesNumber === 0 && data.additivesTags !== undefined && hasIngredientEvidence) return 'known_none';
  if (hasExplicitNoAdditivesStatement && data.additivesTags !== undefined) return 'known_none';
  return 'insufficient_data';
}
