import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProductImageResolution = {
  imageUrl?: string;
  source: 'oummah_clean' | 'openfoodfacts_front' | 'openfoodfacts_similar_product' | 'placeholder';
  sourceBarcode?: string;
  brandKey?: string;
  imageField?: 'selected_images.front.display.fr' | 'selected_images.front.display.en' | 'image_front_url' | 'image_url';
  candidatesCount?: number;
  resolvedAt?: string;
};

const IMAGE_CACHE_KEY = 'oummah.boycott.product-images.v1';
const BRAND_IMAGE_CACHE_KEY = 'oummah.boycott.product-images-by-brand.v1';

function validUrl(value: unknown) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim()) ? value.trim() : undefined;
}

function cleanBarcode(value: string) {
  return value.replace(/\D/g, '');
}

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokens(value: unknown) {
  return new Set(normalize(value).split(/\s+/).filter((token) => token.length >= 3));
}

function selectFrontImage(product: Record<string, unknown>) {
  const selectedImages = product.selected_images;
  const front = selectedImages && typeof selectedImages === 'object' && !Array.isArray(selectedImages) ? (selectedImages as Record<string, unknown>).front : undefined;
  const display = front && typeof front === 'object' && !Array.isArray(front) ? (front as Record<string, unknown>).display : undefined;
  const displayRecord = display && typeof display === 'object' && !Array.isArray(display) ? display as Record<string, unknown> : undefined;
  const candidates: Array<{ value: unknown; field: ProductImageResolution['imageField']; priority: number }> = [
    { value: displayRecord?.fr, field: 'selected_images.front.display.fr', priority: 4 },
    { value: displayRecord?.en, field: 'selected_images.front.display.en', priority: 3 },
    { value: product.image_front_url, field: 'image_front_url', priority: 2 },
    { value: product.image_url, field: 'image_url', priority: 1 },
  ];
  const selectedCandidate = candidates.find((candidate) => validUrl(candidate.value));
  return selectedCandidate ? { imageUrl: validUrl(selectedCandidate.value)!, imageField: selectedCandidate.field, priority: selectedCandidate.priority } : undefined;
}

function compatibleVariant(source: Record<string, unknown>, candidate: Record<string, unknown>) {
  const groups = [
    ['zero', 'light', 'diet', 'sans sucre', 'sugar free'],
    ['cherry', 'cerise'],
    ['vanilla', 'vanille'],
    ['lemon', 'citron'],
    ['caffeine free', 'sans cafeine', 'decaffeinated'],
  ];
  const sourceText = normalize([source.product_name, source.product_name_fr, source.generic_name, source.generic_name_fr].join(' '));
  const candidateText = normalize([candidate.product_name, candidate.product_name_fr, candidate.generic_name, candidate.generic_name_fr].join(' '));
  return !groups.some((group) => group.some((token) => sourceText.includes(token)) !== group.some((token) => candidateText.includes(token)));
}

async function findBrandImage(barcode: string, source: Record<string, unknown>, excludedImageUrls: Set<string>) {
  const sourceBrandTokens = tokens([source.brands, ...(Array.isArray(source.brands_tags) ? source.brands_tags : [])].join(' '));
  const brandKey = normalize([...sourceBrandTokens].join(' '));
  const searchTerms = String(source.brands ?? '').trim();
  if (!brandKey || !searchTerms) return { brandKey, candidatesCount: 0, candidatesWithFrontImage: 0, rejectedCandidates: 0 } as const;
  const fields = 'code,product_name,product_name_fr,generic_name,generic_name_fr,brands,brands_tags,categories,categories_tags,image_front_url,image_url,selected_images';
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(searchTerms)}&page_size=100&fields=${fields}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) return { brandKey, candidatesCount: 0, candidatesWithFrontImage: 0, rejectedCandidates: 0 } as const;
    const payload = await response.json() as { products?: Array<Record<string, unknown>> };
    const sourceCode = barcode.replace(/\D/g, '');
    let candidatesWithFrontImage = 0;
    let rejectedCandidates = 0;
    const candidates = (payload.products ?? []).flatMap((candidate) => {
      const candidateCode = typeof candidate.code === 'string' ? candidate.code.replace(/\D/g, '') : '';
      const image = selectFrontImage(candidate);
      if (image) candidatesWithFrontImage += 1;
      const candidateBrandTokens = tokens([candidate.brands, ...(Array.isArray(candidate.brands_tags) ? candidate.brands_tags : [])].join(' '));
      const sameBrand = [...sourceBrandTokens].some((token) => candidateBrandTokens.has(token));
      if (!candidateCode || candidateCode === sourceCode || !image || excludedImageUrls.has(image.imageUrl) || !sameBrand || !compatibleVariant(source, candidate)) {
        rejectedCandidates += 1;
        return [];
      }
      const score = image.priority * 0.1;
      return [{ imageUrl: image.imageUrl, sourceBarcode: candidateCode, imageField: image.imageField, score }];
    }).sort((left, right) => right.score - left.score);
    return { brandKey, candidatesCount: payload.products?.length ?? 0, candidatesWithFrontImage, rejectedCandidates, selected: candidates[0] };
  } catch {
    return { brandKey, candidatesCount: 0, candidatesWithFrontImage: 0, rejectedCandidates: 0 } as const;
  }
}

async function readCachedImage(barcode: string) {
  try {
    const values = JSON.parse((await AsyncStorage.getItem(IMAGE_CACHE_KEY)) ?? '{}') as Record<string, ProductImageResolution>;
    return values[barcode]?.imageUrl ? values[barcode] : null;
  } catch {
    return null;
  }
}

async function writeCachedImage(barcode: string, resolution: ProductImageResolution) {
  if (!resolution.imageUrl) return;
  try {
    const values = JSON.parse((await AsyncStorage.getItem(IMAGE_CACHE_KEY)) ?? '{}') as Record<string, ProductImageResolution>;
    values[barcode] = resolution;
    await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(values));
  } catch {
    // Image persistence is deliberately non-blocking.
  }
}

async function readCachedBrandImage(brandKey: string) {
  if (!brandKey) return null;
  try {
    const values = JSON.parse((await AsyncStorage.getItem(BRAND_IMAGE_CACHE_KEY)) ?? '{}') as Record<string, ProductImageResolution>;
    return values[brandKey]?.imageUrl ? values[brandKey] : null;
  } catch {
    return null;
  }
}

async function writeCachedBrandImage(brandKey: string, resolution: ProductImageResolution) {
  if (!brandKey || !resolution.imageUrl) return;
  try {
    const values = JSON.parse((await AsyncStorage.getItem(BRAND_IMAGE_CACHE_KEY)) ?? '{}') as Record<string, ProductImageResolution>;
    values[brandKey] = { ...resolution, brandKey };
    await AsyncStorage.setItem(BRAND_IMAGE_CACHE_KEY, JSON.stringify(values));
  } catch {
    // Brand image persistence is deliberately non-blocking.
  }
}

function diagnostic(payload: Record<string, unknown>) {
  if (__DEV__) console.log('[ProductImageResolverDiagnostic]', payload);
}

export async function invalidateProductImage(barcode: string, imageUrl?: string) {
  const clean = cleanBarcode(barcode);
  try {
    const values = JSON.parse((await AsyncStorage.getItem(IMAGE_CACHE_KEY)) ?? '{}') as Record<string, ProductImageResolution>;
    if (!values[clean] || !imageUrl || values[clean].imageUrl === imageUrl) {
      delete values[clean];
      await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(values));
    }
  } catch {
    // Cache invalidation must never affect the product result.
  }
}

// Cleaned photos (background removed) built offline by scripts/product-images into Supabase Storage.
const cleanImageLookups = new Map<string, Promise<string | undefined>>();
const CLEAN_IMAGE_TIMEOUT_MS = 2500;

function lookupCleanImage(barcode: string): Promise<string | undefined> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '');
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!barcode || !supabaseUrl || !anonKey) return Promise.resolve(undefined);
  const known = cleanImageLookups.get(barcode);
  if (known) return known;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLEAN_IMAGE_TIMEOUT_MS);
  const lookup = fetch(`${supabaseUrl}/rest/v1/product_images?barcode=eq.${barcode}&status=eq.ready&select=storage_path`, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }, signal: controller.signal })
    .then(async (response) => {
      if (!response.ok) return undefined;
      const rows = await response.json() as Array<{ storage_path?: string }>;
      const path = rows[0]?.storage_path;
      return path ? `${supabaseUrl}/storage/v1/object/public/product-images/${encodeURIComponent(path)}` : undefined;
    })
    .catch(() => {
      // Network failure or timeout: forget it so the next scan retries, and fall back to Open Food Facts.
      cleanImageLookups.delete(barcode);
      return undefined;
    })
    .finally(() => clearTimeout(timeout));
  cleanImageLookups.set(barcode, lookup);
  return lookup;
}

export async function resolveProductImage(barcode: string, existingImageUrls: string[] = [], brand?: string, excludedImageUrls: string[] = []): Promise<ProductImageResolution> {
  const clean = cleanBarcode(barcode);
  const excluded = new Set(excludedImageUrls.map((value) => validUrl(value)).filter((value): value is string => Boolean(value)));
  diagnostic({ step: 'start', barcode: clean, brand: brand ?? '' });
  const cleanImageUrl = await lookupCleanImage(clean);
  if (cleanImageUrl && !excluded.has(cleanImageUrl)) return { imageUrl: cleanImageUrl, source: 'oummah_clean' };
  const existing = existingImageUrls.map(validUrl).find((value): value is string => Boolean(value) && !excluded.has(value as string));
  if (existing) return { imageUrl: existing, source: 'openfoodfacts_front' };
  const cached = await readCachedImage(clean);
  if (cached) return cached;
  if (!clean) return { source: 'placeholder' };

  let exactPayload: { status?: number; product?: Record<string, unknown> } | undefined;
  try {
    const exactResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json?fields=code,product_name,product_name_fr,generic_name,generic_name_fr,brands,brands_tags,categories,categories_tags,image_front_url,image_url,selected_images`, { headers: { Accept: 'application/json' } });
    if (exactResponse.ok) exactPayload = await exactResponse.json() as { status?: number; product?: Record<string, unknown> };
  } catch {
    // Keep the already rendered product untouched when image lookup fails.
  }
  const exactImage = exactPayload?.status !== 0 && exactPayload?.product ? selectFrontImage(exactPayload.product) : undefined;
  if (exactImage && !excluded.has(exactImage.imageUrl)) {
    const resolution = { imageUrl: exactImage.imageUrl, imageField: exactImage.imageField, source: 'openfoodfacts_front' as const, resolvedAt: new Date().toISOString() };
    await writeCachedImage(clean, resolution);
    diagnostic({ barcode: clean, brand: '', exactImageFound: true, brandSearchCandidateCount: 0, candidatesWithFrontImage: 1, rejectedCandidates: 0, selectedSourceBarcode: clean, selectedField: resolution.imageField, selectedImageUrl: resolution.imageUrl });
    return resolution;
  }
  const sourceProduct = exactPayload?.status !== 0 ? exactPayload?.product : undefined;
  const brandKey = sourceProduct ? normalize([sourceProduct.brands, ...(Array.isArray(sourceProduct.brands_tags) ? sourceProduct.brands_tags : [])].join(' ')) : '';
  const cachedBrand = await readCachedBrandImage(brandKey);
  if (cachedBrand) {
    if (cachedBrand.imageUrl && excluded.has(cachedBrand.imageUrl)) {
      // Continue to a fresh brand search when the cached URL failed in this scan.
    } else {
      const resolution = { ...cachedBrand, source: 'openfoodfacts_similar_product' as const, brandKey, resolvedAt: new Date().toISOString() };
      await writeCachedImage(clean, resolution);
      diagnostic({ barcode: clean, brand: brand ?? brandKey, exactImageFound: false, brandSearchCandidateCount: 0, candidatesWithFrontImage: 0, rejectedCandidates: 0, selectedSourceBarcode: resolution.sourceBarcode, selectedField: resolution.imageField, selectedImageUrl: resolution.imageUrl });
      return resolution;
    }
  }
  const brandSearch = sourceProduct ? await findBrandImage(clean, sourceProduct, excluded) : { brandKey, candidatesCount: 0, candidatesWithFrontImage: 0, rejectedCandidates: 0, selected: undefined };
  if (brandSearch.selected) {
    const resolution = { imageUrl: brandSearch.selected.imageUrl, imageField: brandSearch.selected.imageField, source: 'openfoodfacts_similar_product' as const, sourceBarcode: brandSearch.selected.sourceBarcode, brandKey, candidatesCount: brandSearch.candidatesCount, resolvedAt: new Date().toISOString() };
    await writeCachedBrandImage(brandKey, resolution);
    await writeCachedImage(clean, resolution);
    diagnostic({ barcode: clean, brand: brand ?? brandKey, exactImageFound: false, brandSearchCandidateCount: brandSearch.candidatesCount, candidatesWithFrontImage: brandSearch.candidatesWithFrontImage, rejectedCandidates: brandSearch.rejectedCandidates, selectedSourceBarcode: resolution.sourceBarcode, selectedField: resolution.imageField, selectedImageUrl: resolution.imageUrl });
    return resolution;
  }
  diagnostic({ barcode: clean, brand: brandKey, exactImageFound: false, brandSearchCandidateCount: brandSearch.candidatesCount, candidatesWithFrontImage: brandSearch.candidatesWithFrontImage, rejectedCandidates: brandSearch.rejectedCandidates, selectedSourceBarcode: undefined, selectedField: undefined, selectedImageUrl: undefined });
  return { source: 'placeholder' };
}
