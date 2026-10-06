import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOYCOTT_SEED } from './boycottSeed';
import type { BoycottCategory, BoycottEntity } from '../domain/BoycottEntity';
import { assessScanKnowledge } from '../scanKnowledge';
import { analyzeHealthScore } from '../healthScoreAnalyzer';
import { fetchSupabaseAdditiveScienceProfiles, getAdditiveReviewCandidates } from '../foodAdditiveScienceRepository';
import type { AdditiveScientificAssessment } from '../additiveInfoRepository';
import { detectIngredientAdditives, detectOtherFoodComponents, getAdditivesDataStatus } from '../ingredientAdditiveDetector';
import { getVerifiedProductHealthData } from './verifiedProductHealthData';
import { resolveCanonicalCommercialEntity, type BoycottResolutionEvidence, type CommercialClassificationEvidence, type CommercialIdentityInput, type CommercialOwnershipEvidence, type CommercialResolutionStatus } from '../commercialEntityResolver';

export type BoycottSubmissionInput = {
  name: string;
  brand?: string;
  category: BoycottCategory;
  barcode?: string;
  sourceUrl?: string;
  note?: string;
};

export type BarcodeAssessment = 'boycott' | 'ok' | 'unknown';
export type AdditivesDataStatus = 'known_with_additives' | 'known_none' | 'insufficient_data';
export type ProductIngredientData = { id?: string; text?: string };
export type OtherFoodComponent = { kind: 'flavoring'; label: string; matchedText: string; source: 'ingredient_text' | 'ingredient_structured' };
export type HealthDataProvenance = {
  ingredients?: 'oummah_verified_exact_barcode' | 'openfoodfacts';
  additives?: 'oummah_verified_exact_barcode' | 'openfoodfacts';
  nutrition?: 'oummah_verified_exact_barcode' | 'openfoodfacts';
  nutritionBasis?: 'oummah_verified_exact_barcode' | 'openfoodfacts';
};
export type HealthDataConflict = { field: string; openFoodFactsValue: unknown; verifiedValue: unknown };

export type ProductHealthData = {
  ingredientsText?: string;
  ingredientsTextVariants?: string[];
  ingredientNames?: string[];
  ingredientsStructured?: ProductIngredientData[];
  otherFoodComponents?: OtherFoodComponent[];
  allergensTags?: string[];
  additivesTags?: string[];
  additivesOriginalTags?: string[];
  additivesNumber?: number;
  additivesDataSource?: 'openfoodfacts' | 'oummah_verified_exact_barcode';
  additivesDataStatus?: AdditivesDataStatus;
  nutriments?: Record<string, number | string | undefined>;
  productType?: 'beverage' | 'solid' | 'unknown';
  nutrientLevels?: {
    sugars?: 'low' | 'moderate' | 'high';
    salt?: 'low' | 'moderate' | 'high';
    'saturated-fat'?: 'low' | 'moderate' | 'high';
  };
  nutritionBasis?: '100 g' | '100 ml';
  nutritionDataPer?: string;
  nutritionValues?: {
    energyKcal?: number;
    sugarsG?: number;
    saltG?: number;
    saturatedFatG?: number;
    proteinsG?: number;
    fiberG?: number;
  };
  nutritionGrade?: string;
  novaGroup?: number;
  scientificAssessments?: Record<string, AdditiveScientificAssessment>;
  healthDataProvenance?: HealthDataProvenance;
  healthDataConflicts?: HealthDataConflict[];
};

export type ProductHalalData = {
  labels?: string[];
  certifications?: string[];
  manufacturer?: string;
  countries?: string[];
};

export type ProductComparisonData = {
  categories?: string;
  categoriesTags?: string[];
  /** Open Food Facts category used to compare Nutri-Scores: defines "same type" for alternatives. */
  comparedToCategory?: string;
  quantity?: string;
  genericName?: string;
  updatedAt?: string;
  /** Declared origin (Open Food Facts origins / manufacturing places), shown as information only. */
  originsTags?: string[];
  origins?: string;
  manufacturingPlaces?: string;
};

export type BarcodeLookupResult = {
  barcode: string;
  productName?: string;
  brandLabel?: string;
  imageUrl?: string;
  imageSource?: 'oummah_admin' | 'user_submission' | 'openfoodfacts' | 'openfoodfacts_similar_product' | 'placeholder';
  imageResolvedAt?: string;
  healthData?: ProductHealthData;
  halalData?: ProductHalalData;
  comparisonData?: ProductComparisonData;
  boycottEntity?: BoycottEntity;
  assessment: BarcodeAssessment;
  source: 'catalog' | 'cache' | 'openfoodfacts' | 'registry' | 'none';
  /** Set for barcodes resolved from boycott_known_products (e.g. medicines from the ANSM public database). */
  productKind?: 'medicine' | 'food' | 'cosmetic' | 'other';
  /** GS1 company prefix that linked this barcode to a catalog group when no brand matched. */
  barcodePrefixMatch?: string;
  canonicalEntity?: string;
  boycottStatus?: CommercialResolutionStatus;
  resolverReason?: string;
  identityResolutionConfidence?: 'high' | 'medium' | 'low' | 'unresolved';
  boycottResolutionEvidence?: BoycottResolutionEvidence;
  classificationEvidence?: CommercialClassificationEvidence;
  ownershipConfidence?: 'high' | 'medium' | 'low' | 'unresolved';
  ownershipEvidence?: CommercialOwnershipEvidence[];
  commercialIdentity?: CommercialIdentityInput;
};

const CACHE_KEY = 'oummah.boycott.catalog.v4';
const PENDING_KEY = 'oummah.boycott.pending-submissions.v1';
const SCAN_CACHE_KEY = 'oummah.boycott.scanned-products.v9-image-quality';
const PRODUCT_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OFF_PRODUCT_FIELDS = 'compared_to_category,product_name,product_name_fr,brands,brands_tags,image_front_url,image_url,selected_images,images,ingredients,ingredients_text,ingredients_text_fr,allergens_tags,additives_tags,additives_original_tags,additives_n,nutrient_levels,nutriments,nutriment_data_per,nutrition_data_per,nutrition_grades,nova_group,labels,labels_tags,certifications,certifications_tags,brand_owner,manufacturer,manufacturing_places,origins,origins_tags,company,owner,parent_company,group,countries_tags,categories,categories_tags,quantity,product_quantity,serving_size';
const memoryScanCache = new Map<string, BarcodeLookupResult>();
const inflightLookup = new Map<string, Promise<BarcodeLookupResult>>();

export type ProductImageResolution = { url?: string; source: 'oummah_admin' | 'user_submission' | 'openfoodfacts' | 'openfoodfacts_similar_product' | 'placeholder'; sourceBarcode?: string; matchReasons?: string[]; similarityConfidence?: 'HIGH' | 'MEDIUM' | 'LOW'; similarCandidatesCount?: number };

function validProductImageUrl(value: unknown) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim()) ? value.trim() : undefined;
}

function resolveBestProductImage(product: Record<string, unknown>): ProductImageResolution {
  const selected = product.selected_images;
  const front = selected && typeof selected === 'object' && !Array.isArray(selected) ? (selected as Record<string, unknown>).front : undefined;
  const display = front && typeof front === 'object' && !Array.isArray(front) ? (front as Record<string, unknown>).display : undefined;
  const displayRecord = display && typeof display === 'object' && !Array.isArray(display) ? display as Record<string, unknown> : undefined;
  const imageUrl = [displayRecord?.fr, displayRecord?.en, product.image_front_url, product.image_url].map(validProductImageUrl).find(Boolean);
  return imageUrl ? { url: imageUrl, source: 'openfoodfacts' } : { source: 'placeholder' };
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function supabaseConfig() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

function headers(key: string, write = false) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    ...(write ? { 'Content-Type': 'application/json', Prefer: 'return=minimal' } : {}),
  };
}

function cleanBarcode(value: string) {
  return value.replace(/\D/g, '');
}

function hasFoodData(healthData?: ProductHealthData) {
  if (!healthData) return false;
  return Boolean(
    healthData.ingredientsText?.trim()
      || healthData.ingredientsStructured?.length
      || healthData.nutriments && Object.keys(healthData.nutriments).length
      || healthData.additivesTags?.length
      || healthData.additivesOriginalTags?.length
      || healthData.additivesNumber !== undefined
      || healthData.novaGroup !== undefined,
  );
}

function fieldPresence(product?: Record<string, unknown>) {
  const has = (key: string) => {
    const value = product?.[key];
    return value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
  };
  return {
    ingredients_text: has('ingredients_text'),
    ingredients_text_fr: has('ingredients_text_fr'),
    ingredients: has('ingredients'),
    additives_tags: has('additives_tags'),
    additives_original_tags: has('additives_original_tags'),
    additives_n: has('additives_n'),
    nutriments: has('nutriments'),
    nutriment_data_per: has('nutriment_data_per') || has('nutrition_data_per'),
    nutrition_grades: has('nutrition_grades'),
    nova_group: has('nova_group'),
    categories_tags: has('categories_tags'),
  };
}

function normalizedFieldPresence(result: BarcodeLookupResult) {
  const health = result.healthData;
  return {
    ingredientsText: Boolean(health?.ingredientsText || health?.ingredientsStructured?.length),
    additivesTags: Boolean(health?.additivesTags?.length || health?.additivesOriginalTags?.length),
    additivesNumber: health?.additivesNumber !== undefined,
    nutriments: Boolean(health?.nutriments && Object.keys(health.nutriments).length),
    nutritionBasis: Boolean(health?.nutritionBasis),
    nutritionGrade: Boolean(health?.nutritionGrade),
    novaGroup: health?.novaGroup !== undefined,
    categories: Boolean(result.comparisonData?.categories || result.comparisonData?.categoriesTags?.length),
  };
}

function logProductLookupDiagnostic(payload: Record<string, unknown>) {
  if (__DEV__) console.log('[ProductLookupDiagnostic]', payload);
}

function mergeDefined<T extends Record<string, unknown>>(primary: T | undefined, fallback: T | undefined): T | undefined {
  if (!primary && !fallback) return undefined;
  const output: Record<string, unknown> = { ...(fallback ?? {}) };
  for (const [key, value] of Object.entries(primary ?? {})) {
    if (value !== undefined && value !== null) output[key] = value;
  }
  return output as T;
}

export function mergeProductData(primary: BarcodeLookupResult, fallback: BarcodeLookupResult): BarcodeLookupResult {
  const boycottEntity = primary.boycottEntity ?? fallback.boycottEntity;
  return {
    ...fallback,
    ...primary,
    productName: primary.productName ?? fallback.productName,
    brandLabel: primary.brandLabel ?? fallback.brandLabel,
    imageUrl: primary.imageUrl ?? fallback.imageUrl,
    imageSource: primary.imageSource ?? fallback.imageSource,
    imageResolvedAt: primary.imageResolvedAt ?? fallback.imageResolvedAt,
    healthData: mergeDefined(primary.healthData as Record<string, unknown> | undefined, fallback.healthData as Record<string, unknown> | undefined) as ProductHealthData | undefined,
    halalData: mergeDefined(primary.halalData as Record<string, unknown> | undefined, fallback.halalData as Record<string, unknown> | undefined) as ProductHalalData | undefined,
    comparisonData: mergeDefined(primary.comparisonData as Record<string, unknown> | undefined, fallback.comparisonData as Record<string, unknown> | undefined) as ProductComparisonData | undefined,
    boycottEntity,
    assessment: boycottEntity ? 'boycott' : primary.assessment,
    source: primary.source,
  };
}

export function mergeVerifiedHealthData(barcode: string, healthData?: ProductHealthData) {
  const verified = getVerifiedProductHealthData(barcode);
  if (!verified) return { healthData, verifiedRecordFound: false, fieldsCompleted: [] as string[], fieldsConflicted: [] as string[], provenance: undefined };

  const output: ProductHealthData = { ...(healthData ?? {}) };
  const fieldsCompleted: string[] = [];
  const fieldsConflicted: string[] = [];
  const conflicts: HealthDataConflict[] = [...(output.healthDataConflicts ?? [])];
  const hasIngredients = Boolean(output.ingredientsText?.trim() || output.ingredientsStructured?.length);
  if (!hasIngredients && (verified.ingredientsTextFr || verified.ingredientsText)) {
    output.ingredientsText = verified.ingredientsTextFr ?? verified.ingredientsText;
    output.ingredientsTextVariants = [verified.ingredientsText, verified.ingredientsTextFr].filter((value, index, values): value is string => Boolean(value?.trim()) && values.indexOf(value) === index);
    output.healthDataProvenance = { ...output.healthDataProvenance, ingredients: 'oummah_verified_exact_barcode' };
    fieldsCompleted.push('ingredients');
  } else if (hasIngredients && (verified.ingredientsTextFr || verified.ingredientsText) && output.ingredientsText !== (verified.ingredientsTextFr ?? verified.ingredientsText)) {
    fieldsConflicted.push('ingredients');
    conflicts.push({ field: 'ingredients', openFoodFactsValue: output.ingredientsText, verifiedValue: verified.ingredientsTextFr ?? verified.ingredientsText });
  }

  const verifiedTags = verified.additives.map((additive) => `en:${additive.code.toLowerCase()}`);
  const hasAdditives = Boolean(output.additivesTags?.length || output.additivesOriginalTags?.length || output.additivesNumber !== undefined);
  if (!hasAdditives && verifiedTags.length) {
    output.additivesTags = verifiedTags;
    output.additivesOriginalTags = verifiedTags;
    output.additivesNumber = verified.additives.length;
    output.additivesDataSource = 'oummah_verified_exact_barcode';
    output.healthDataProvenance = { ...output.healthDataProvenance, additives: 'oummah_verified_exact_barcode' };
    fieldsCompleted.push('additives');
  } else if (hasAdditives && verifiedTags.length) {
    const existing = [...(output.additivesTags ?? []), ...(output.additivesOriginalTags ?? [])].map((value) => value.toLowerCase()).sort().join('|');
    const expected = verifiedTags.slice().sort().join('|');
    if (existing !== expected) {
      fieldsConflicted.push('additives');
      conflicts.push({ field: 'additives', openFoodFactsValue: existing, verifiedValue: expected });
    }
  }

  if (!output.otherFoodComponents?.length && verified.otherFoodComponents?.length) {
    output.otherFoodComponents = verified.otherFoodComponents.map((item) => ({ kind: item.type, label: item.name, matchedText: item.name, source: 'ingredient_text' as const }));
    fieldsCompleted.push('otherFoodComponents');
  }

  if (verified.nutritionBasis) {
    if (output.nutritionBasis && output.nutritionBasis !== verified.nutritionBasis) {
      fieldsConflicted.push('nutritionBasis');
      conflicts.push({ field: 'nutritionBasis', openFoodFactsValue: output.nutritionBasis, verifiedValue: verified.nutritionBasis });
    } else if (!output.nutritionBasis) {
      fieldsCompleted.push('nutritionBasis');
    }
    output.nutritionBasis = verified.nutritionBasis;
    output.nutritionDataPer = verified.nutritionBasis;
    output.healthDataProvenance = { ...output.healthDataProvenance, nutritionBasis: 'oummah_verified_exact_barcode' };
  }

  if (verified.nutritionValuesVerified) {
    const currentNutrition = output.nutritionValues;
    const hasNutritionConflict = currentNutrition && JSON.stringify(currentNutrition) !== JSON.stringify(verified.nutritionValuesVerified);
    if (hasNutritionConflict) {
      fieldsConflicted.push('nutrition');
      conflicts.push({ field: 'nutrition', openFoodFactsValue: currentNutrition, verifiedValue: verified.nutritionValuesVerified });
    } else if (!currentNutrition) {
      fieldsCompleted.push('nutrition');
    }
    output.nutritionValues = verified.nutritionValuesVerified;
    output.healthDataProvenance = { ...output.healthDataProvenance, nutrition: 'oummah_verified_exact_barcode' };
  }

  output.healthDataConflicts = conflicts.length ? conflicts : undefined;
  return { healthData: output, verifiedRecordFound: true, fieldsCompleted, fieldsConflicted, provenance: output.healthDataProvenance };
}

export function resolveNutritionBasis(input: {
  nutriments?: Record<string, number | string | undefined>;
  nutrimentDataPer?: string;
  productType?: ProductHealthData['productType'];
}): '100 g' | '100 ml' {
  const nutriments = input.nutriments ?? {};
  const hasPer100Ml = nutriments['energy-kcal_100ml'] !== undefined || nutriments.sugars_100ml !== undefined || nutriments.salt_100ml !== undefined || nutriments['saturated-fat_100ml'] !== undefined || nutriments.proteins_100ml !== undefined || nutriments.fiber_100ml !== undefined;
  const normalizedPer = input.nutrimentDataPer?.toLowerCase().replace(/\s+/g, '') ?? '';
  if (normalizedPer.includes('100g')) return '100 g';
  if (hasPer100Ml && (normalizedPer.includes('100ml') || input.productType === 'beverage')) return '100 ml';
  return '100 g';
}

function catalogTerms(item: BoycottEntity) {
  return [item.name, item.parentGroup, ...(item.aliases ?? [])]
    .filter(Boolean)
    .map((value) => normalize(String(value)))
    .filter((value) => value.length >= 2);
}

function brandCandidates(value?: string) {
  if (!value) return [];
  const parts = value
    .split(/[,;/|]+/g)
    .map((part) => normalize(part.replace(/^en:/, '')))
    .filter(Boolean);
  const all = [normalize(value), ...parts].filter(Boolean);
  return Array.from(new Set(all));
}

export function findBoycottEntityByBrand(catalog: BoycottEntity[], brand?: string, productName?: string) {
  const brandValues = brandCandidates(brand);
  const productValue = normalize(productName ?? '');
  if (!brandValues.length && !productValue) return undefined;

  let best: { item: BoycottEntity; score: number } | undefined;
  for (const item of catalog) {
    const name = normalize(item.name);
    const aliases = (item.aliases ?? []).map(normalize).filter(Boolean);
    const exactTerms = [name, ...aliases].filter((value) => value.length >= 2);

    for (const candidate of brandValues) {
      if (candidate === name) {
        const score = 2000 + name.length;
        if (score > (best?.score ?? 0)) best = { item, score };
      }
      if (aliases.includes(candidate)) {
        const score = 1900 + candidate.length;
        if (score > (best?.score ?? 0)) best = { item, score };
      }
    }

    if (!brandValues.length && productValue) {
      for (const term of exactTerms) {
        if (term.length < 4) continue;
        if (productValue === term || productValue.startsWith(`${term} `)) {
          const score = 900 + term.length;
          if (score > (best?.score ?? 0)) best = { item, score };
        }
      }
    }
  }
  return best?.item;
}

function dedupeCatalog(items: BoycottEntity[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalize(String(item?.id ?? ''));
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getBoycottCatalog(): Promise<BoycottEntity[]> {
  const config = supabaseConfig();
  if (config) {
    try {
      const response = await fetch(`${config.url}/rest/v1/boycott_entities?select=*&is_active=eq.true&order=name.asc`, { headers: headers(config.key) });
      if (response.ok) {
        const rows = await response.json() as Array<Record<string, unknown>>;
        if (rows.length) {
          const mapped = rows.map((row) => ({
            id: String(row.slug ?? row.id),
            name: String(row.name),
            aliases: Array.isArray(row.aliases) ? row.aliases.map(String) : undefined,
            category: row.category as BoycottCategory,
            parentGroup: row.parent_group ? String(row.parent_group) : undefined,
            summary: String(row.summary ?? ''),
            summaryEn: row.summary_en ? String(row.summary_en) : undefined,
            evidenceKind: String(row.evidence_kind ?? 'other_documented_link') as BoycottEntity['evidenceKind'],
            sources: Array.isArray(row.sources) ? row.sources as BoycottEntity['sources'] : [],
            barcodePrefixes: Array.isArray(row.barcode_prefixes) ? row.barcode_prefixes.map(String) : undefined,
            productBarcodes: Array.isArray(row.product_barcodes) ? row.product_barcodes.map(String) : undefined,
            alternativeIds: Array.isArray(row.alternative_ids) ? row.alternative_ids.map(String) : undefined,
            lastVerifiedAt: String(row.last_verified_at ?? new Date().toISOString()),
            boycott: true as const,
          }));
          const unique = dedupeCatalog(mapped);
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(unique));
          return unique;
        }
      }
    } catch {}
  }
  try {
    const cached = JSON.parse((await AsyncStorage.getItem(CACHE_KEY)) ?? '[]') as BoycottEntity[];
    if (cached.length) return dedupeCatalog(cached);
  } catch {}
  return dedupeCatalog(BOYCOTT_SEED);
}

export function searchBoycottCatalog(catalog: BoycottEntity[], query: string, category?: BoycottCategory | 'all') {
  const q = normalize(query);
  const seen = new Set<string>();
  return catalog.filter((item) => {
    const key = normalize(String(item?.id ?? ''));
    if (!key || seen.has(key)) return false;
    seen.add(key);
    if (category && category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    return normalize([item.name, item.parentGroup, ...(item.aliases ?? [])].filter(Boolean).join(' ')).includes(q);
  });
}

// Validated GS1 company prefixes (scripts/product-images/build_barcode_prefixes.py): the company
// that registered the barcode owns the product, even when Open Food Facts has no brand for it.
function applyBarcodePrefix(catalog: BoycottEntity[], result: BarcodeLookupResult): BarcodeLookupResult {
  if (result.assessment !== 'unknown') return result;
  for (const entity of catalog) {
    const prefix = entity.barcodePrefixes?.find((value) => value && result.barcode.startsWith(value));
    if (prefix) return { ...result, boycottEntity: entity, assessment: 'boycott', barcodePrefixMatch: prefix, brandLabel: result.brandLabel ?? entity.name };
  }
  return result;
}

export function findByBarcode(catalog: BoycottEntity[], barcode: string) {
  const clean = cleanBarcode(barcode);
  return catalog.find((item) => item.productBarcodes?.includes(clean));
}

export async function submitBoycottCandidate(input: BoycottSubmissionInput) {
  const payload = { ...input, barcode: cleanBarcode(input.barcode ?? '') || null, validation_status: 'pending', created_at: new Date().toISOString() };
  const config = supabaseConfig();
  if (config) {
    const response = await fetch(`${config.url}/rest/v1/boycott_submissions`, {
      method: 'POST',
      headers: headers(config.key, true),
      body: JSON.stringify({
        name: input.name.trim(),
        brand: input.brand?.trim() || null,
        category: input.category,
        barcode: payload.barcode,
        source_url: input.sourceUrl?.trim() || null,
        note: input.note?.trim() || null,
        validation_status: 'pending',
      }),
    });
    if (response.ok) return { stored: 'server' as const };
  }
  const local = JSON.parse((await AsyncStorage.getItem(PENDING_KEY)) ?? '[]') as unknown[];
  local.unshift(payload);
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(local.slice(0, 50)));
  return { stored: 'local' as const };
}

type CachedScan = {
  barcode: string;
  productName?: string;
  brandLabel?: string;
  imageUrl?: string;
  imageSource?: BarcodeLookupResult['imageSource'];
  imageResolvedAt?: string;
  cachedAt: number;
  healthData?: ProductHealthData;
  halalData?: ProductHalalData;
  comparisonData?: ProductComparisonData;
  commercialIdentity?: CommercialIdentityInput;
  knowledge?: ReturnType<typeof assessScanKnowledge>;
};

export type BoycottScanHistoryItem = Pick<CachedScan, 'barcode' | 'productName' | 'brandLabel' | 'imageUrl' | 'cachedAt' | 'halalData'>;

export async function getBoycottScanHistory(limit = 50): Promise<BoycottScanHistoryItem[]> {
  try {
    const values = JSON.parse((await AsyncStorage.getItem(SCAN_CACHE_KEY)) ?? '{}') as Record<string, CachedScan>;
    return Object.values(values)
      .filter((item) => Boolean(item?.barcode && (item.productName || item.brandLabel)))
      .sort((a, b) => b.cachedAt - a.cachedAt)
      .slice(0, Math.max(0, limit))
      .map(({ barcode, productName, brandLabel, imageUrl, cachedAt, halalData }) => ({ barcode, productName, brandLabel, imageUrl, cachedAt, halalData }));
  } catch {
    return [];
  }
}

export async function getBoycottScanHistoryResult(
  catalog: BoycottEntity[],
  barcode: string,
): Promise<BarcodeLookupResult | null> {
  const clean = cleanBarcode(barcode);
  if (!clean) return null;
  try {
    const values = JSON.parse((await AsyncStorage.getItem(SCAN_CACHE_KEY)) ?? '{}') as Record<string, CachedScan>;
    const item = values[clean];
    return item ? finalizeStoredLookupResult(assessCachedProduct(catalog, item, 'cache')) : null;
  } catch {
    return null;
  }
}

async function readLocalScan(barcode: string): Promise<CachedScan | undefined> {
  const item = await readStoredScan(barcode);
  if (!item || Date.now() - item.cachedAt > PRODUCT_CACHE_TTL_MS) return undefined;
  return item;
}

async function readStoredScan(barcode: string): Promise<CachedScan | undefined> {
  try {
    const values = JSON.parse((await AsyncStorage.getItem(SCAN_CACHE_KEY)) ?? '{}') as Record<string, CachedScan>;
    return values[barcode];
  } catch {
    return undefined;
  }
}

async function writeLocalScan(item: CachedScan) {
  try {
    const values = JSON.parse((await AsyncStorage.getItem(SCAN_CACHE_KEY)) ?? '{}') as Record<string, CachedScan>;
    values[item.barcode] = item;
    const entries = Object.entries(values).sort((a, b) => b[1].cachedAt - a[1].cachedAt).slice(0, 250);
    await AsyncStorage.setItem(SCAN_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {}
}

function enqueueUnknownAdditives(config: { url: string; key: string }, barcode: string, healthData?: ProductHealthData) {
  const codes = getAdditiveReviewCandidates(detectIngredientAdditives(healthData).map((detection) => detection.code));
  if (!codes.length) return;
  void fetch(`${config.url}/rest/v1/rpc/record_food_additive_review_candidates`, {
    method: 'POST',
    headers: headers(config.key, true),
    body: JSON.stringify({ p_barcode: barcode, p_codes: codes }),
  }).catch(() => undefined);
}

async function readServerScan(barcode: string): Promise<CachedScan | undefined> {
  const config = supabaseConfig();
  if (!config) return undefined;
  try {
    const response = await fetch(
      `${config.url}/rest/v1/boycott_scanned_products?select=barcode,product_name,brand,image_url,last_seen_at&barcode=eq.${encodeURIComponent(barcode)}&limit=1`,
      { headers: headers(config.key) }
    );
    if (!response.ok) return undefined;
    const rows = await response.json() as Array<Record<string, unknown>>;
    const row = rows[0];
    if (!row) return undefined;
    const cachedAt = row.last_seen_at ? new Date(String(row.last_seen_at)).getTime() : Date.now();
    return {
      barcode,
      productName: row.product_name ? String(row.product_name) : undefined,
    brandLabel: row.brand ? String(row.brand) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
      cachedAt: Number.isFinite(cachedAt) ? cachedAt : Date.now(),
    };
  } catch {
    return undefined;
  }
}

async function rememberScannedProduct(result: BarcodeLookupResult) {
  const config = supabaseConfig();
  if (config) enqueueUnknownAdditives(config, result.barcode, result.healthData);
  if (!result.productName && !result.brandLabel) return;
  const cached: CachedScan = {
    barcode: result.barcode,
    productName: result.productName,
    brandLabel: result.brandLabel,
    imageUrl: result.imageUrl,
    imageSource: result.imageSource,
    imageResolvedAt: result.imageResolvedAt,
    healthData: result.healthData,
    halalData: result.halalData,
    comparisonData: result.comparisonData,
    commercialIdentity: result.commercialIdentity,
    knowledge: assessScanKnowledge(result),
    cachedAt: Date.now(),
  };
  const healthScore = analyzeHealthScore(result.healthData);
  await writeLocalScan(cached);

  if (!config) return;
  let knowledgeStored = false;
  let legacyFallbackAllowed = false;
  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/record_boycott_scan_knowledge`, {
      method: 'POST', headers: headers(config.key, true), body: JSON.stringify({ p_knowledge: { barcode: result.barcode, product_name: result.productName ?? null, brand: result.brandLabel ?? null, image_url: result.imageUrl ?? null, generic_name: result.comparisonData?.genericName ?? null, categories: result.comparisonData?.categoriesTags ?? null, first_seen_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), data_completeness: assessScanKnowledge(result).completeness, needs_review: assessScanKnowledge(result).needsReview, review_reasons: assessScanKnowledge(result).reviewReasons, health_grade: healthScore.available ? healthScore.finalGrade : null, health_score: healthScore.available ? healthScore.score : null, health_components: healthScore.available ? { pillars: healthScore.pillars, additiveCounts: healthScore.additiveCounts, additiveCoverage: healthScore.additiveCoverage, scoreCompleteness: healthScore.scoreCompleteness } : null, health_score_version: healthScore.scoreVersion, health_calculated_at: healthScore.calculatedAt, openfoodfacts_updated_at: result.comparisonData?.updatedAt ?? null } })
    });
    knowledgeStored = response.ok;
    legacyFallbackAllowed = response.status === 404 || response.status === 405;
  } catch {
    // A timeout is ambiguous: the RPC may already have committed. Do not retry
    // with another incrementing RPC in that case.
    return;
  }
  if (knowledgeStored) return;
  if (!legacyFallbackAllowed) return;
  try {
    await fetch(`${config.url}/rest/v1/rpc/record_boycott_scanned_product`, {
      method: 'POST',
      headers: headers(config.key, true),
      body: JSON.stringify({
        p_barcode: result.barcode,
        p_product_name: result.productName ?? null,
        p_brand: result.brandLabel ?? null,
        p_image_url: result.imageUrl ?? null,
        p_last_result: result.assessment,
      }),
    });
  } catch {}
}

function assessCachedProduct(catalog: BoycottEntity[], item: CachedScan, source: BarcodeLookupResult['source']): BarcodeLookupResult {
  const resolution = resolveCanonicalCommercialEntity(catalog, item.commercialIdentity ?? { productName: item.productName, brands: item.brandLabel });
  const entity = resolution.entity;
  return {
    barcode: item.barcode,
    productName: item.productName,
    brandLabel: item.brandLabel,
    imageUrl: item.imageUrl,
    imageSource: item.imageSource,
    imageResolvedAt: item.imageResolvedAt,
    healthData: item.healthData,
    halalData: item.halalData,
    comparisonData: item.comparisonData,
    boycottEntity: entity,
    assessment: resolution.status === 'BOYCOTT' ? 'boycott' : resolution.status === 'NOT_CLASSIFIED_BY_OUMMAH' ? 'ok' : 'unknown',
    source,
    canonicalEntity: resolution.canonicalEntity,
    boycottStatus: resolution.status,
    resolverReason: resolution.resolverReason,
    identityResolutionConfidence: resolution.identityResolutionConfidence,
    boycottResolutionEvidence: resolution.boycottResolutionEvidence,
    classificationEvidence: resolution.classificationEvidence,
    ownershipConfidence: resolution.ownershipConfidence,
    ownershipEvidence: resolution.ownershipEvidence,
    commercialIdentity: item.commercialIdentity,
  };
}

async function enrichScientificAssessments(result: BarcodeLookupResult): Promise<BarcodeLookupResult> {
  const detections = detectIngredientAdditives(result.healthData);
  if (!result.healthData || !detections.length) return result;
  const scientificAssessments = await fetchSupabaseAdditiveScienceProfiles(detections.map((detection) => detection.code));
  if (!Object.keys(scientificAssessments).length) return result;
  const enriched = { ...result, healthData: { ...result.healthData, scientificAssessments: { ...result.healthData.scientificAssessments, ...scientificAssessments } } };
  return enriched;
}

async function finalizeStoredLookupResult(result: BarcodeLookupResult): Promise<BarcodeLookupResult> {
  const verifiedMerge = mergeVerifiedHealthData(result.barcode, result.healthData);
  let finalized = result;
  if (verifiedMerge.healthData) {
    const detectedOtherFoodComponents = detectOtherFoodComponents(verifiedMerge.healthData);
    const knownOtherFoodComponents = [...(verifiedMerge.healthData.otherFoodComponents ?? []), ...detectedOtherFoodComponents];
    const uniqueOtherFoodComponents = knownOtherFoodComponents.filter((item, index, values) => values.findIndex((value) => value.kind === item.kind && value.matchedText === item.matchedText) === index);
    finalized = { ...result, healthData: { ...verifiedMerge.healthData, additivesDataStatus: getAdditivesDataStatus(verifiedMerge.healthData), otherFoodComponents: uniqueOtherFoodComponents } };
  }
  if (__DEV__) {
    console.log('[VerifiedHealthMergeDiagnostic]', {
      barcode: finalized.barcode,
      verifiedRecordFound: verifiedMerge.verifiedRecordFound,
      fieldsCompleted: verifiedMerge.fieldsCompleted,
      fieldsConflicted: verifiedMerge.fieldsConflicted,
      provenance: verifiedMerge.provenance,
      finalAdditives: finalized.healthData?.additivesTags,
      finalNutritionBasis: finalized.healthData?.nutritionBasis,
    });
    const diagnosticAdditives = detectIngredientAdditives(finalized.healthData);
    console.log('[HealthDataDiagnostic]', {
      barcode: finalized.barcode,
      source: finalized.source,
      nutritionBasis: finalized.healthData?.nutritionBasis,
      nutritionDataPer: finalized.healthData?.nutritionDataPer,
      additivesTags: finalized.healthData?.additivesTags,
      detectedAdditives: diagnosticAdditives.map((item) => ({ code: item.code, matchedBy: item.matchedBy, matchedValue: item.matchedValue })),
      otherFoodComponents: finalized.healthData?.otherFoodComponents,
      novaGroup: finalized.healthData?.novaGroup,
      healthDataProvenance: finalized.healthData?.healthDataProvenance,
    });
  }
  return enrichScientificAssessments(finalized);
}

type OpenFactsProductPayload = {
    status?: number;
    product?: {
      product_name?: string;
      product_name_fr?: string;
      brands?: string;
      brands_tags?: string[];
      image_front_url?: string;
      image_url?: string;
      selected_images?: Record<string, unknown>;
      images?: Record<string, unknown>;
      ingredients_text?: string;
      ingredients_text_fr?: string;
      ingredients?: Array<{ id?: string; text?: string }>;
      allergens_tags?: string[];
      additives_tags?: string[];
      additives_original_tags?: string[];
      additives_n?: number;
      nutrient_levels?: ProductHealthData['nutrientLevels'];
      nutriments?: {
        'energy-kcal_100g'?: number;
        'energy-kcal_100ml'?: number;
        sugars_100g?: number;
        sugars_100ml?: number;
        salt_100g?: number;
        salt_100ml?: number;
        'saturated-fat_100g'?: number;
        'saturated-fat_100ml'?: number;
        proteins_100g?: number;
        proteins_100ml?: number;
        fiber_100g?: number;
        fiber_100ml?: number;
      };
      nutriment_data_per?: string;
      nutrition_data_per?: string;
      nutrition_grades?: string;
      nova_group?: number;
      labels?: string;
      labels_tags?: string[];
      certifications?: string;
      certifications_tags?: string[];
      brand_owner?: string;
      manufacturer?: string;
      manufacturing_places?: string;
      origins?: string;
      origins_tags?: string[];
      compared_to_category?: string;
      company?: string;
      owner?: string;
      parent_company?: string;
      group?: string;
      countries_tags?: string[];
      categories?: string;
      categories_tags?: string[];
      quantity?: string;
      product_quantity?: string;
      serving_size?: string;
      generic_name?: string;
      last_updated_t?: number;
    };
  };

async function fetchProductPayload(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

type KnownProductRow = { barcode: string; product_name: string; brand?: string | null; entity_slug?: string | null; product_kind?: BarcodeLookupResult['productKind'] };

// Barcodes Open Food Facts / Open Beauty Facts do not cover (French medicine boxes, CIP13 "34009…").
async function lookupKnownProduct(catalog: BoycottEntity[], barcode: string): Promise<BarcodeLookupResult | undefined> {
  const config = supabaseConfig();
  if (!config) return undefined;
  const response = await fetchProductPayload(`${config.url}/rest/v1/boycott_known_products?barcode=eq.${barcode}&select=barcode,product_name,brand,entity_slug,product_kind`, 4000);
  if (!response?.ok) return undefined;
  const [row] = await response.json() as KnownProductRow[];
  if (!row) return undefined;
  const entity = row.entity_slug ? catalog.find((item) => item.id === row.entity_slug) : undefined;
  return {
    barcode,
    productName: row.product_name,
    brandLabel: row.brand ?? undefined,
    productKind: row.product_kind ?? 'other',
    boycottEntity: entity,
    assessment: entity ? 'boycott' : 'unknown',
    source: 'registry',
  };
}

const isFrenchMedicineCode = (barcode: string) => /^34009\d{8}$/.test(barcode);

async function refreshBoycottBarcode(catalog: BoycottEntity[], barcode: string, fallbackCached?: CachedScan): Promise<BarcodeLookupResult> {
  const clean = cleanBarcode(barcode);
  if (isFrenchMedicineCode(clean)) {
    const medicine = await lookupKnownProduct(catalog, clean);
    if (medicine) return medicine;
  }
  const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json?fields=${OFF_PRODUCT_FIELDS}`;
  logProductLookupDiagnostic({
    barcode: clean,
    sourceInitial: fallbackCached ? 'cache_incomplete' : 'openfoodfacts',
    cacheKey: SCAN_CACHE_KEY,
    offCalled: true,
    endpoint: offUrl,
    fieldsRequested: OFF_PRODUCT_FIELDS.split(','),
  });

  try {
    const response = await fetchProductPayload(offUrl, 5000);
    let payload = response?.ok ? await response.json() as OpenFactsProductPayload : undefined;
    // Not a food product: the sister databases share the same API — cosmetics (L'Oréal, Garnier, Ahava…),
    // pet food (Purina, Whiskas…), then every other product (hygiene, household, electronics…).
    for (const host of ['world.openbeautyfacts.org', 'world.openpetfoodfacts.org', 'world.openproductsfacts.org']) {
      if (payload?.product && payload.status !== 0) break;
      const siblingResponse = await fetchProductPayload(`https://${host}/api/v2/product/${encodeURIComponent(clean)}.json?fields=${OFF_PRODUCT_FIELDS}`, 4000);
      const siblingPayload = siblingResponse?.ok ? await siblingResponse.json() as OpenFactsProductPayload : undefined;
      if (siblingPayload?.product && siblingPayload.status !== 0) payload = siblingPayload;
    }

    if (payload) {
      const product = payload.product;
      if (product && payload.status !== 0) {
        const finalImageResolution = resolveBestProductImage(product as Record<string, unknown>);
        logProductLookupDiagnostic({
          barcode: clean,
          sourceInitial: fallbackCached ? 'cache_incomplete' : 'openfoodfacts',
          cacheKey: SCAN_CACHE_KEY,
          offCalled: true,
          endpoint: offUrl,
          httpStatus: response?.status,
          fieldsRequested: OFF_PRODUCT_FIELDS.split(','),
          rawFieldPresence: fieldPresence(product as Record<string, unknown>),
          imageSource: finalImageResolution.source,
          imageUrl: finalImageResolution.url,
        });
        const productName = product.product_name_fr || product.product_name;
        const brandText = product.brands?.trim() || undefined;
        const tagBrands = (product.brands_tags ?? [])
          .map((value) => String(value).replace(/^en:/, '').trim())
          .filter(Boolean);
        const rawBrands = [brandText, ...tagBrands].filter(Boolean).join(', ');
        const commercialIdentity: CommercialIdentityInput = {
          barcode: clean,
          productName,
          brands: brandText,
          brandsTags: tagBrands,
          brandOwner: product.brand_owner,
          manufacturer: product.manufacturer,
          manufacturingPlaces: product.manufacturing_places,
          company: product.company,
          owner: product.owner,
          parentCompany: product.parent_company,
          group: product.group,
        };
        const resolution = resolveCanonicalCommercialEntity(catalog, commercialIdentity);
        const entity = resolution.entity;
        if (__DEV__) console.log('[BoycottEntityDiagnostic]', { barcode: clean, productName, brands: brandText, brands_tags: tagBrands, manufacturer: product.manufacturer, manufacturing_places: product.manufacturing_places, company: product.company, owner: product.owner, parentCompany: product.parent_company, rawIdentityStrings: commercialIdentity, normalizedIdentityStrings: resolution.normalizedEntities, matchedAliases: resolution.aliasesMatched, canonicalEntity: resolution.canonicalEntity, parentEntity: resolution.parentEntity, resolverStatus: resolution.status, boycottResolverSource: resolution.boycottResolverSource, resolverReason: resolution.resolverReason, classificationEvidence: resolution.classificationEvidence });
        const nutriments = product.nutriments;
        const categoryText = [product.categories, ...(product.categories_tags ?? []), product.generic_name].filter(Boolean).join(' ').toLowerCase();
        const isBeverage = /beverage|beverages|drink|drinks|boisson|boissons|soda|soft-drink|water|juice|tea|coffee/.test(categoryText);
        const productType: ProductHealthData['productType'] = isBeverage ? 'beverage' : categoryText ? 'solid' : 'unknown';
        const nutritionDataPer = product.nutrition_data_per ?? product.nutriment_data_per;
        const nutritionBasis = resolveNutritionBasis({ nutriments, nutrimentDataPer: nutritionDataPer, productType });
        const usePer100Ml = nutritionBasis === '100 ml';
        const additiveTags = Array.isArray(product.additives_tags) ? product.additives_tags.filter((value): value is string => Boolean(value?.trim())) : undefined;
        const additivesOriginalTags = Array.isArray(product.additives_original_tags) ? product.additives_original_tags.filter((value): value is string => Boolean(value?.trim())) : undefined;
        const result: BarcodeLookupResult = {
          barcode: clean,
          productName,
          brandLabel: brandText || tagBrands[0] || undefined,
          imageUrl: finalImageResolution.url,
          imageSource: finalImageResolution.source,
          imageResolvedAt: new Date().toISOString(),
          healthData: {
            ingredientsText: product.ingredients_text_fr || product.ingredients_text,
            ingredientsTextVariants: [product.ingredients_text, product.ingredients_text_fr].filter((value, index, values): value is string => Boolean(value?.trim()) && values.indexOf(value) === index),
            ingredientNames: product.ingredients?.flatMap((ingredient) => [ingredient.id, ingredient.text].filter((value): value is string => Boolean(value?.trim()))) ?? [],
            ingredientsStructured: product.ingredients,
            productType,
            allergensTags: product.allergens_tags,
            additivesTags: additiveTags,
            additivesOriginalTags,
            additivesNumber: product.additives_n,
            additivesDataSource: 'openfoodfacts',
            nutriments,
            nutritionDataPer,
            nutrientLevels: product.nutrient_levels,
            nutritionBasis: usePer100Ml ? '100 ml' : '100 g',
            nutritionValues: {
              energyKcal: usePer100Ml ? nutriments?.['energy-kcal_100ml'] : nutriments?.['energy-kcal_100g'],
              sugarsG: usePer100Ml ? nutriments?.sugars_100ml : nutriments?.sugars_100g,
              saltG: usePer100Ml ? nutriments?.salt_100ml : nutriments?.salt_100g,
              saturatedFatG: usePer100Ml ? nutriments?.['saturated-fat_100ml'] : nutriments?.['saturated-fat_100g'],
              proteinsG: usePer100Ml ? nutriments?.proteins_100ml : nutriments?.proteins_100g,
              fiberG: usePer100Ml ? nutriments?.fiber_100ml : nutriments?.fiber_100g,
            },
            nutritionGrade: product.nutrition_grades,
            novaGroup: product.nova_group,
          },
          halalData: {
            labels: [product.labels, ...(product.labels_tags ?? [])].filter((value): value is string => Boolean(value)),
            certifications: [product.certifications, ...(product.certifications_tags ?? [])].filter((value): value is string => Boolean(value)),
            manufacturer: product.brand_owner,
            countries: product.countries_tags,
          },
          comparisonData: {
            categories: product.categories,
            categoriesTags: product.categories_tags,
            comparedToCategory: product.compared_to_category,
            quantity: product.quantity,
            genericName: product.generic_name,
            updatedAt: product.last_updated_t ? new Date(product.last_updated_t * 1000).toISOString() : undefined,
            originsTags: product.origins_tags,
            origins: product.origins,
            manufacturingPlaces: product.manufacturing_places,
          },
          boycottEntity: entity,
          assessment: resolution.status === 'BOYCOTT' ? 'boycott' : resolution.status === 'NOT_CLASSIFIED_BY_OUMMAH' ? 'ok' : 'unknown',
          source: 'openfoodfacts',
          canonicalEntity: resolution.canonicalEntity,
          boycottStatus: resolution.status,
          resolverReason: resolution.resolverReason,
          identityResolutionConfidence: resolution.identityResolutionConfidence,
          boycottResolutionEvidence: resolution.boycottResolutionEvidence,
          classificationEvidence: resolution.classificationEvidence,
          ownershipConfidence: resolution.ownershipConfidence,
          ownershipEvidence: resolution.ownershipEvidence,
          commercialIdentity,
        };
        const verifiedMerge = mergeVerifiedHealthData(clean, result.healthData);
        if (verifiedMerge.healthData) {
          const detectedOtherFoodComponents = detectOtherFoodComponents(verifiedMerge.healthData);
          const knownOtherFoodComponents = [...(verifiedMerge.healthData.otherFoodComponents ?? []), ...detectedOtherFoodComponents];
          const uniqueOtherFoodComponents = knownOtherFoodComponents.filter((item, index, values) => values.findIndex((value) => value.kind === item.kind && value.matchedText === item.matchedText) === index);
          result.healthData = { ...verifiedMerge.healthData, additivesDataStatus: getAdditivesDataStatus(verifiedMerge.healthData), otherFoodComponents: uniqueOtherFoodComponents };
        }
        if (__DEV__) {
          console.log('[VerifiedHealthMergeDiagnostic]', {
            barcode: clean,
            verifiedRecordFound: verifiedMerge.verifiedRecordFound,
            fieldsCompleted: verifiedMerge.fieldsCompleted,
            fieldsConflicted: verifiedMerge.fieldsConflicted,
            provenance: verifiedMerge.provenance,
            finalAdditives: result.healthData?.additivesTags,
            finalNutritionBasis: result.healthData?.nutritionBasis,
          });
        }
        if (__DEV__) {
          const diagnosticAdditives = detectIngredientAdditives(result.healthData);
          console.log('[HealthDataDiagnostic]', {
            barcode: clean,
            nutritionBasis: result.healthData?.nutritionBasis,
            nutrimentDataPer: result.healthData?.nutritionDataPer,
            productType: result.healthData?.productType,
            categories: result.comparisonData?.categoriesTags,
            ingredientsText: result.healthData?.ingredientsText,
            additivesTags: result.healthData?.additivesTags,
            additivesOriginalTags: result.healthData?.additivesOriginalTags,
            additivesN: result.healthData?.additivesNumber,
            detectedAdditives: diagnosticAdditives.map((item) => ({ code: item.code, matchedBy: item.matchedBy, matchedValue: item.matchedValue })),
            detectedFlavorings: result.healthData?.otherFoodComponents,
            additivesDataStatus: result.healthData?.additivesDataStatus,
            novaGroup: result.healthData?.novaGroup,
            nutritionGrade: result.healthData?.nutritionGrade,
          });
        }
        const merged = fallbackCached
          ? mergeProductData(result, assessCachedProduct(catalog, fallbackCached, 'cache'))
          : result;
        const enriched = await enrichScientificAssessments(merged);
        logProductLookupDiagnostic({
          barcode: clean,
          sourceInitial: fallbackCached ? 'cache_incomplete' : 'openfoodfacts',
          cacheKey: SCAN_CACHE_KEY,
          offCalled: true,
          endpoint: offUrl,
          httpStatus: response?.status,
          fieldsRequested: OFF_PRODUCT_FIELDS.split(','),
          normalizedFieldPresence: normalizedFieldPresence(enriched),
          finalSource: enriched.source,
        });
        void rememberScannedProduct(enriched).catch(() => undefined);
        memoryScanCache.set(clean, enriched);
        return enriched;
      }
    }
    logProductLookupDiagnostic({
      barcode: clean,
      sourceInitial: fallbackCached ? 'cache_incomplete' : 'openfoodfacts',
      cacheKey: SCAN_CACHE_KEY,
      offCalled: true,
      endpoint: offUrl,
      httpStatus: response?.status,
      fieldsRequested: OFF_PRODUCT_FIELDS.split(','),
      rawFieldPresence: {},
      normalizedFieldPresence: {},
    });
  } catch (error) {
    logProductLookupDiagnostic({
      barcode: clean,
      sourceInitial: fallbackCached ? 'cache_incomplete' : 'openfoodfacts',
      cacheKey: SCAN_CACHE_KEY,
      offCalled: true,
      endpoint: offUrl,
      fieldsRequested: OFF_PRODUCT_FIELDS.split(','),
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const local = fallbackCached ?? await readLocalScan(clean);
  if (!local) {
    const known = await lookupKnownProduct(catalog, clean);
    if (known) return known;
  }
  if (local) return enrichScientificAssessments(assessCachedProduct(catalog, local, 'cache'));

  const direct = findByBarcode(catalog, clean);
  if (direct) {
    return {
      barcode: clean,
      boycottEntity: direct,
      brandLabel: direct.name,
      assessment: 'boycott',
      source: 'catalog',
    };
  }

  return { barcode: clean, assessment: 'unknown', source: 'none' };
}

function refreshWithDeduplication(catalog: BoycottEntity[], barcode: string, fallbackCached?: CachedScan) {
  const existing = inflightLookup.get(barcode);
  if (existing) return existing;

  const request = refreshBoycottBarcode(catalog, barcode, fallbackCached);
  inflightLookup.set(barcode, request);
  request.then(
    () => {
      if (inflightLookup.get(barcode) === request) inflightLookup.delete(barcode);
    },
    () => {
      if (inflightLookup.get(barcode) === request) inflightLookup.delete(barcode);
    },
  );
  return request;
}

export async function lookupBoycottBarcode(catalog: BoycottEntity[], barcode: string): Promise<BarcodeLookupResult> {
  return applyBarcodePrefix(catalog, await lookupBoycottBarcodeByIdentity(catalog, barcode));
}

async function lookupBoycottBarcodeByIdentity(catalog: BoycottEntity[], barcode: string): Promise<BarcodeLookupResult> {
  const clean = cleanBarcode(barcode);
  if (!clean) return { barcode: clean, assessment: 'unknown', source: 'none' };

  const remembered = memoryScanCache.get(clean);
  if (remembered && hasFoodData(remembered.healthData)) {
    logProductLookupDiagnostic({
      barcode: clean,
      sourceInitial: 'memory',
      cacheKey: SCAN_CACHE_KEY,
      offCalled: false,
      normalizedFieldPresence: normalizedFieldPresence(remembered),
    });
    return finalizeStoredLookupResult(remembered);
  }

  const stored = await readStoredScan(clean);
  if (stored) {
    const cachedResult = await finalizeStoredLookupResult(assessCachedProduct(catalog, stored, 'cache'));
    if (hasFoodData(cachedResult.healthData)) {
      memoryScanCache.set(clean, cachedResult);
      logProductLookupDiagnostic({
        barcode: clean,
        sourceInitial: 'AsyncStorage',
        cacheKey: SCAN_CACHE_KEY,
        offCalled: false,
        normalizedFieldPresence: normalizedFieldPresence(cachedResult),
      });
      return cachedResult;
    }
    logProductLookupDiagnostic({
      barcode: clean,
      sourceInitial: 'AsyncStorage_incomplete',
      cacheKey: SCAN_CACHE_KEY,
      offCalled: false,
      normalizedFieldPresence: normalizedFieldPresence(cachedResult),
    });
    return refreshWithDeduplication(catalog, clean, stored);
  }

  return refreshWithDeduplication(catalog, clean);
}
