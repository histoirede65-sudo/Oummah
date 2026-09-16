import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOYCOTT_SEED } from './boycottSeed';
import type { BoycottCategory, BoycottEntity } from '../domain/BoycottEntity';
import { assessScanKnowledge } from '../scanKnowledge';
import { analyzeHealthScore } from '../healthScoreAnalyzer';
import { fetchSupabaseAdditiveScienceProfiles, getAdditiveReviewCandidates } from '../foodAdditiveScienceRepository';
import type { AdditiveScientificAssessment } from '../additiveInfoRepository';
import { detectIngredientAdditives } from '../ingredientAdditiveDetector';

export type BoycottSubmissionInput = {
  name: string;
  brand?: string;
  category: BoycottCategory;
  barcode?: string;
  sourceUrl?: string;
  note?: string;
};

export type BarcodeAssessment = 'boycott' | 'ok' | 'unknown';

export type ProductHealthData = {
  ingredientsText?: string;
  ingredientsTextVariants?: string[];
  ingredientNames?: string[];
  allergensTags?: string[];
  additivesTags?: string[];
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
  quantity?: string;
  genericName?: string;
  updatedAt?: string;
};

export type BarcodeLookupResult = {
  barcode: string;
  productName?: string;
  brandLabel?: string;
  imageUrl?: string;
  healthData?: ProductHealthData;
  halalData?: ProductHalalData;
  comparisonData?: ProductComparisonData;
  boycottEntity?: BoycottEntity;
  assessment: BarcodeAssessment;
  source: 'catalog' | 'cache' | 'openfoodfacts' | 'none';
};

const CACHE_KEY = 'oummah.boycott.catalog.v4';
const PENDING_KEY = 'oummah.boycott.pending-submissions.v1';
const SCAN_CACHE_KEY = 'oummah.boycott.scanned-products.v6';
const PRODUCT_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const memoryScanCache = new Map<string, BarcodeLookupResult>();

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
  cachedAt: number;
  healthData?: ProductHealthData;
  halalData?: ProductHalalData;
  comparisonData?: ProductComparisonData;
  knowledge?: ReturnType<typeof assessScanKnowledge>;
};

async function readLocalScan(barcode: string): Promise<CachedScan | undefined> {
  try {
    const values = JSON.parse((await AsyncStorage.getItem(SCAN_CACHE_KEY)) ?? '{}') as Record<string, CachedScan>;
    const item = values[barcode];
    if (!item || Date.now() - item.cachedAt > PRODUCT_CACHE_TTL_MS) return undefined;
    return item;
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
    healthData: result.healthData,
    halalData: result.halalData,
    comparisonData: result.comparisonData,
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
  const entity = findBoycottEntityByBrand(catalog, item.brandLabel, item.productName);
  return {
    barcode: item.barcode,
    productName: item.productName,
    brandLabel: item.brandLabel,
    imageUrl: item.imageUrl,
    healthData: item.healthData,
    halalData: item.halalData,
    comparisonData: item.comparisonData,
    boycottEntity: entity,
    assessment: entity ? 'boycott' : (item.productName && item.brandLabel ? 'ok' : 'unknown'),
    source,
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

export async function lookupBoycottBarcode(catalog: BoycottEntity[], barcode: string): Promise<BarcodeLookupResult> {
  const clean = cleanBarcode(barcode);

  const remembered = memoryScanCache.get(clean);
  if (remembered) return enrichScientificAssessments(remembered);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json?fields=product_name,product_name_fr,brands,brands_tags,image_front_small_url,ingredients,ingredients_text,ingredients_text_fr,allergens_tags,additives_tags,additives_original_tags,additives_n,nutrient_levels,nutriments,nutriment_data_per,nutrition_grades,nova_group,labels,labels_tags,certifications,certifications_tags,brand_owner,countries_tags,categories,categories_tags,quantity,product_quantity,serving_size`,
      { headers: { Accept: 'application/json' }, signal: controller.signal }
    );
    clearTimeout(timeout);

    if (response.ok) {
      const payload = await response.json() as {
        status?: number;
        product?: {
          product_name?: string;
          product_name_fr?: string;
          brands?: string;
          brands_tags?: string[];
          image_front_small_url?: string;
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
          nutrition_grades?: string;
          nova_group?: number;
          labels?: string;
          labels_tags?: string[];
          certifications?: string;
          certifications_tags?: string[];
          brand_owner?: string;
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
      const product = payload.product;
      if (product && payload.status !== 0) {
        const productName = product.product_name_fr || product.product_name;
        const brandText = product.brands?.trim() || undefined;
        const tagBrands = (product.brands_tags ?? [])
          .map((value) => String(value).replace(/^en:/, '').trim())
          .filter(Boolean);
        const rawBrands = [brandText, ...tagBrands].filter(Boolean).join(', ');
        const entity = findBoycottEntityByBrand(catalog, rawBrands || undefined, productName);
        const nutriments = product.nutriments;
        const usePer100Ml = nutriments?.['energy-kcal_100ml'] !== undefined || nutriments?.sugars_100ml !== undefined || nutriments?.salt_100ml !== undefined || nutriments?.['saturated-fat_100ml'] !== undefined || nutriments?.proteins_100ml !== undefined || nutriments?.fiber_100ml !== undefined;
        const additiveTags = [...(product.additives_tags ?? []), ...(product.additives_original_tags ?? [])].filter((value, index, values) => Boolean(value?.trim()) && values.indexOf(value) === index);
        const result: BarcodeLookupResult = {
          barcode: clean,
          productName,
          brandLabel: brandText || tagBrands[0] || undefined,
          imageUrl: product.image_front_small_url,
          healthData: {
            ingredientsText: product.ingredients_text_fr || product.ingredients_text,
            ingredientsTextVariants: [product.ingredients_text, product.ingredients_text_fr].filter((value, index, values): value is string => Boolean(value?.trim()) && values.indexOf(value) === index),
            ingredientNames: product.ingredients?.flatMap((ingredient) => [ingredient.id, ingredient.text].filter((value): value is string => Boolean(value?.trim()))) ?? [],
            allergensTags: product.allergens_tags,
            additivesTags: additiveTags,
            nutritionDataPer: product.nutriment_data_per,
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
            quantity: product.quantity,
            genericName: product.generic_name,
            updatedAt: product.last_updated_t ? new Date(product.last_updated_t * 1000).toISOString() : undefined,
          },
          boycottEntity: entity,
          assessment: entity ? 'boycott' : (productName && (brandText || tagBrands.length) ? 'ok' : 'unknown'),
          source: 'openfoodfacts',
        };
        const enriched = await enrichScientificAssessments(result);
        void rememberScannedProduct(enriched).catch(() => undefined);
        memoryScanCache.set(clean, enriched);
        return enriched;
      }
    }
  } catch {}

  const local = await readLocalScan(clean);
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
