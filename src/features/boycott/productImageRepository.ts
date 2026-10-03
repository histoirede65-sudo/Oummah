import type { ProductImageResolution } from './data/BoycottRepository';

export type CanonicalProductImageSource = 'oummah_admin' | 'user_submission' | 'openfoodfacts';
export type CanonicalProductImageStatus = 'verified' | 'pending' | 'rejected';

export type CanonicalProductImage = {
  barcode: string;
  imageUrl: string;
  source: CanonicalProductImageSource;
  status: CanonicalProductImageStatus;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
};

const canonicalCache = new Map<string, CanonicalProductImage | null>();
const resolvedImageCache = new Map<string, ProductImageResolution>();
const similarSearchCandidateCounts = new Map<string, number>();

type OffImageCandidate = {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  generic_name?: string;
  generic_name_fr?: string;
  brands?: string;
  brands_tags?: string[];
  categories?: string;
  categories_tags?: string[];
  quantity?: string;
  product_quantity?: string;
  image_front_url?: string;
  selected_images?: Record<string, unknown>;
};

type SimilarProductImage = {
  imageUrl: string;
  sourceBarcode: string;
  confidence: 'HIGH';
  similarityScore: number;
  matchReasons: string[];
  candidatesCount: number;
};

function cleanBarcode(value: string) {
  return value.replace(/\D/g, '');
}

function validUrl(value: unknown) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim()) ? value.trim() : undefined;
}

function normalize(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value: unknown) {
  return new Set(normalize(value).split(/\s+/).filter((token) => token.length >= 3));
}

function allText(product: OffImageCandidate) {
  return [product.product_name_fr, product.product_name, product.generic_name_fr, product.generic_name].filter(Boolean).join(' ');
}

function brandTokens(product: OffImageCandidate) {
  return tokens([product.brands, ...(product.brands_tags ?? [])].join(' '));
}

function categoryTokens(product: OffImageCandidate) {
  return tokens([product.categories, ...(product.categories_tags ?? [])].join(' '));
}

function frontImage(product: OffImageCandidate) {
  const selected = product.selected_images;
  const front = selected && typeof selected === 'object' && !Array.isArray(selected) ? (selected as Record<string, unknown>).front : undefined;
  const display = front && typeof front === 'object' && !Array.isArray(front) ? (front as Record<string, unknown>).display : undefined;
  const displayRecord = display && typeof display === 'object' && !Array.isArray(display) ? display as Record<string, unknown> : undefined;
  return [displayRecord?.fr, displayRecord?.en, product.image_front_url].map(validUrl).find(Boolean);
}

function quantity(product: OffImageCandidate) {
  const match = `${product.quantity ?? ''} ${product.product_quantity ?? ''}`.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl)\b/i);
  if (!match) return undefined;
  const value = Number(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();
  const factor = unit === 'kg' ? 1000 : unit === 'l' ? 1000 : unit === 'cl' ? 10 : 1;
  return { value: value * factor, unit: unit === 'kg' || unit === 'g' ? 'g' : 'ml' };
}

const variantGroups = [
  ['zero', 'zero-sugar', 'sans-sucre', 'sugar-free'],
  ['light', 'diet'],
  ['cherry', 'cerise'],
  ['vanilla', 'vanille'],
  ['lemon', 'citron'],
  ['caffeine-free', 'sans-cafeine', 'decaffeinated', 'decafeine'],
];

function hasContradictoryVariant(source: OffImageCandidate, candidate: OffImageCandidate) {
  const sourceTokens = tokens(allText(source));
  const candidateTokens = tokens(allText(candidate));
  return variantGroups.some((group) => {
    const sourceVariant = group.some((token) => sourceTokens.has(token));
    const candidateVariant = group.some((token) => candidateTokens.has(token));
    return sourceVariant !== candidateVariant;
  });
}

function similarRejectionReason(source: OffImageCandidate, candidate: OffImageCandidate) {
  if (!frontImage(candidate)) return 'missing_front_image';
  const sourceBarcode = cleanBarcode(String(source.code ?? ''));
  const candidateBarcode = cleanBarcode(String(candidate.code ?? ''));
  if (!candidateBarcode || candidateBarcode === sourceBarcode) return 'same_or_missing_barcode';
  const sourceBrands = brandTokens(source);
  const candidateBrands = brandTokens(candidate);
  if (!sourceBrands.size || ![...sourceBrands].some((token) => candidateBrands.has(token))) return 'brand_mismatch';
  if (hasContradictoryVariant(source, candidate)) return 'contradictory_variant';
  const sharedCategories = [...categoryTokens(source)].filter((token) => categoryTokens(candidate).has(token));
  if (!sharedCategories.length) return 'family_mismatch';
  const sharedNameTokens = [...tokens(allText(source))].filter((token) => tokens(allText(candidate)).has(token));
  if (tokens(allText(source)).size && !sharedNameTokens.length) return 'name_incompatible';
  return undefined;
}

function buildSimilarCandidate(source: OffImageCandidate, candidate: OffImageCandidate): SimilarProductImage | null {
  if (similarRejectionReason(source, candidate)) return null;
  const imageUrl = frontImage(candidate);
  const sourceBarcode = cleanBarcode(String(candidate.code ?? ''));
  if (!imageUrl || !sourceBarcode) return null;

  const sourceBrands = brandTokens(source);
  const candidateBrands = brandTokens(candidate);
  const sameBrand = sourceBrands.size > 0 && [...sourceBrands].some((token) => candidateBrands.has(token));

  const sourceCategories = categoryTokens(source);
  const candidateCategories = categoryTokens(candidate);
  const sharedCategories = [...sourceCategories].filter((token) => candidateCategories.has(token));
  const sourceNameTokens = tokens(allText(source));
  const candidateNameTokens = tokens(allText(candidate));
  const sharedNameTokens = [...sourceNameTokens].filter((token) => candidateNameTokens.has(token));
  if (!sharedCategories.length || (sourceNameTokens.size > 0 && !sharedNameTokens.length)) return null;

  const nameCoverage = sharedNameTokens.length / Math.max(sourceNameTokens.size, 1);
  const categoryCoverage = Math.min(sharedCategories.length / Math.max(sourceCategories.size, 1), 1);
  const sourceQuantity = quantity(source);
  const candidateQuantity = quantity(candidate);
  const quantityBonus = sourceQuantity && candidateQuantity && sourceQuantity.unit === candidateQuantity.unit
    ? Math.abs(sourceQuantity.value - candidateQuantity.value) / Math.max(sourceQuantity.value, 1) <= 0.15 ? 0.1 : 0.03
    : 0;
  const similarityScore = 0.4 + (sameBrand ? 0.3 : 0) + nameCoverage * 0.2 + categoryCoverage * 0.1 + quantityBonus;
  if (similarityScore < 0.85) return null;

  return {
    imageUrl,
    sourceBarcode,
    confidence: 'HIGH',
    similarityScore,
    matchReasons: ['same_brand', 'same_product_family', 'compatible_variant', ...(quantityBonus ? ['compatible_quantity'] : []), 'front_image'],
    candidatesCount: 0,
  };
}

function supabaseConfig() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key ? { url, key } : undefined;
}

function requestHeaders(key: string, write = false) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    ...(write ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {}),
  };
}

function mapRow(row: Record<string, unknown>): CanonicalProductImage | null {
  const barcode = typeof row.barcode === 'string' ? cleanBarcode(row.barcode) : '';
  const imageUrl = validUrl(row.image_url);
  const source = row.source;
  const status = row.status;
  if (!barcode || !imageUrl || !['oummah_admin', 'user_submission', 'openfoodfacts'].includes(String(source)) || !['verified', 'pending', 'rejected'].includes(String(status))) return null;
  return {
    barcode,
    imageUrl,
    source: source as CanonicalProductImageSource,
    status: status as CanonicalProductImageStatus,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
    verifiedAt: row.verified_at ? String(row.verified_at) : undefined,
  };
}

export async function getCanonicalProductImage(barcode: string): Promise<CanonicalProductImage | null> {
  const clean = cleanBarcode(barcode);
  if (!clean) return null;
  if (canonicalCache.has(clean)) return canonicalCache.get(clean) ?? null;
  const config = supabaseConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/canonical_product_images?select=barcode,image_url,source,status,created_at,updated_at,verified_at&barcode=eq.${encodeURIComponent(clean)}&status=eq.verified&limit=1`, { headers: requestHeaders(config.key) });
    if (!response.ok) return null;
    const rows = await response.json() as Array<Record<string, unknown>>;
    const image = rows[0] ? mapRow(rows[0]) : null;
    canonicalCache.set(clean, image);
    return image;
  } catch {
    return null;
  }
}

export async function setCanonicalProductImage(image: CanonicalProductImage): Promise<CanonicalProductImage | null> {
  const config = supabaseConfig();
  if (!config) return null;
  const clean = cleanBarcode(image.barcode);
  if (!clean || !validUrl(image.imageUrl)) return null;
  const payload = { barcode: clean, image_url: image.imageUrl, source: image.source, status: image.status, created_at: image.createdAt, updated_at: image.updatedAt, verified_at: image.verifiedAt ?? null };
  try {
    const response = await fetch(`${config.url}/rest/v1/canonical_product_images?on_conflict=barcode`, { method: 'POST', headers: { ...requestHeaders(config.key, true), Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(payload) });
    if (!response.ok) return null;
    const rows = await response.json() as Array<Record<string, unknown>>;
    const saved = rows[0] ? mapRow(rows[0]) : null;
    canonicalCache.set(clean, saved);
    return saved;
  } catch {
    return null;
  }
}

export async function hasVerifiedCanonicalImage(barcode: string) {
  return Boolean(await getCanonicalProductImage(barcode));
}

function resolveOpenFoodFactsImage(product: Record<string, unknown>): ProductImageResolution {
  const selectedImages = product.selected_images;
  const front = selectedImages && typeof selectedImages === 'object' && !Array.isArray(selectedImages) ? (selectedImages as Record<string, unknown>).front : undefined;
  const display = front && typeof front === 'object' && !Array.isArray(front) ? (front as Record<string, unknown>).display : undefined;
  const displayRecord = display && typeof display === 'object' && !Array.isArray(display) ? display as Record<string, unknown> : undefined;
  const candidates = [displayRecord?.fr, displayRecord?.en, product.image_front_url];
  const imageUrl = candidates.map(validUrl).find(Boolean);
  return imageUrl ? { url: imageUrl, source: 'openfoodfacts' } : { source: 'placeholder' };
}

export async function resolveSimilarProductImage(product: Record<string, unknown>): Promise<SimilarProductImage | null> {
  const source = product as OffImageCandidate;
  const searchText = [source.brands, source.product_name_fr ?? source.product_name, source.generic_name_fr ?? source.generic_name, source.categories]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (!searchText) return null;
  const fields = 'code,product_name,product_name_fr,generic_name,generic_name_fr,brands,brands_tags,categories,categories_tags,quantity,product_quantity,image_front_url,selected_images';
  const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(searchText)}&page_size=50&fields=${fields}`;
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const payload = await response.json() as { products?: OffImageCandidate[] };
    const sourceBarcode = cleanBarcode(String(source.code ?? ''));
    const rawCandidates = payload.products ?? [];
    similarSearchCandidateCounts.set(sourceBarcode, rawCandidates.length);
    const evaluations = rawCandidates
      .filter((candidate) => cleanBarcode(String(candidate.code ?? '')) !== sourceBarcode)
      .map((candidate) => ({ candidate, rejectionReason: similarRejectionReason(source, candidate), accepted: buildSimilarCandidate(source, candidate) }));
    const accepted = evaluations
      .map(({ accepted }) => accepted)
      .filter((candidate): candidate is SimilarProductImage => Boolean(candidate))
      .sort((left, right) => right.similarityScore - left.similarityScore);
    if (accepted[0]) accepted[0].candidatesCount = rawCandidates.length;
    return accepted[0] ?? null;
  } catch {
    return null;
  }
}

export async function resolveProductImage(barcode: string, productData: Record<string, unknown>): Promise<ProductImageResolution & { canonical?: CanonicalProductImage }> {
  const clean = cleanBarcode(barcode);
  const cached = resolvedImageCache.get(clean);
  if (cached) {
    if (cached.source !== 'placeholder') {
      if (__DEV__) console.log('[ProductImageDiagnostic]', { barcode: clean, cacheHit: true, cachedSource: cached.source, canonicalImageFound: cached.source === 'oummah_admin' || cached.source === 'user_submission', exactOffImageFound: cached.source === 'openfoodfacts', similarSearchAttempted: cached.source === 'openfoodfacts_similar_product', similarCandidatesCount: cached.similarCandidatesCount ?? 0, selectedSourceBarcode: cached.sourceBarcode, selectedImageUrl: cached.url, finalSource: cached.source });
      return cached;
    }
    resolvedImageCache.delete(clean);
  }
  const canonical = await getCanonicalProductImage(barcode);
  if (canonical) {
    const resolved = { url: canonical.imageUrl, source: canonical.source, canonical } as ProductImageResolution & { canonical: CanonicalProductImage };
    resolvedImageCache.set(clean, resolved);
    if (__DEV__) console.log('[ProductImageDiagnostic]', { barcode: clean, cacheHit: Boolean(cached), cachedSource: cached?.source, canonicalImageFound: true, exactOffImageFound: false, similarSearchAttempted: false, similarCandidatesCount: 0, selectedSourceBarcode: clean, selectedImageUrl: canonical.imageUrl, finalSource: canonical.source });
    return resolved;
  }
  const exact = resolveOpenFoodFactsImage(productData);
  if (exact.url) {
    resolvedImageCache.set(clean, exact);
    if (__DEV__) console.log('[ProductImageDiagnostic]', { barcode: clean, cacheHit: Boolean(cached), cachedSource: cached?.source, canonicalImageFound: false, exactOffImageFound: true, similarSearchAttempted: false, similarCandidatesCount: 0, selectedSourceBarcode: clean, selectedImageUrl: exact.url, finalSource: exact.source });
    return exact;
  }
  const similar = await resolveSimilarProductImage({ ...productData, code: clean });
  const resolved: ProductImageResolution = similar
    ? { url: similar.imageUrl, source: 'openfoodfacts_similar_product', sourceBarcode: similar.sourceBarcode, similarityConfidence: similar.confidence, matchReasons: similar.matchReasons, similarCandidatesCount: similar.candidatesCount }
    : { source: 'placeholder' };
  resolvedImageCache.set(clean, resolved);
  if (__DEV__) console.log('[ProductImageDiagnostic]', { barcode: clean, cacheHit: Boolean(cached), cachedSource: cached?.source, canonicalImageFound: false, exactOffImageFound: false, similarSearchAttempted: true, similarCandidatesCount: similar?.candidatesCount ?? similarSearchCandidateCounts.get(clean) ?? 0, selectedSourceBarcode: similar?.sourceBarcode, selectedImageUrl: similar?.imageUrl, finalSource: resolved.source });
  return resolved;
}
