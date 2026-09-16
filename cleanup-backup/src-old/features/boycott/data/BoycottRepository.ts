import AsyncStorage from '@react-native-async-storage/async-storage';
import { BOYCOTT_SEED } from './boycottSeed';
import type { BoycottCategory, BoycottEntity } from '../domain/BoycottEntity';

export type BoycottSubmissionInput = {
  name: string;
  brand?: string;
  category: BoycottCategory;
  barcode?: string;
  sourceUrl?: string;
  note?: string;
};

export type BarcodeAssessment = 'boycott' | 'ok' | 'unknown';

export type BarcodeLookupResult = {
  barcode: string;
  productName?: string;
  brandLabel?: string;
  imageUrl?: string;
  boycottEntity?: BoycottEntity;
  assessment: BarcodeAssessment;
  source: 'catalog' | 'cache' | 'openfoodfacts' | 'none';
};

const CACHE_KEY = 'oummah.boycott.catalog.v3';
const PENDING_KEY = 'oummah.boycott.pending-submissions.v1';
const SCAN_CACHE_KEY = 'oummah.boycott.scanned-products.v3';
const PRODUCT_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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
  const productValues = brandCandidates(productName);
  if (!brandValues.length && !productValues.length) return undefined;

  const scoreCandidate = (candidate: string, item: BoycottEntity) => {
    const name = normalize(item.name);
    const aliases = (item.aliases ?? []).map(normalize).filter(Boolean);
    const parent = item.parentGroup ? normalize(item.parentGroup) : '';

    if (candidate === name) return 1000 + name.length;
    if (aliases.includes(candidate)) return 950 + candidate.length;
    if (candidate.startsWith(`${name} `) || candidate.endsWith(` ${name}`) || candidate.includes(` ${name} `)) {
      return 850 + name.length;
    }
    for (const alias of aliases) {
      if (candidate.startsWith(`${alias} `) || candidate.endsWith(` ${alias}`) || candidate.includes(` ${alias} `)) {
        return 800 + alias.length;
      }
    }

    // Le groupe parent sert uniquement de filet de sécurité.
    // Il ne doit jamais battre une marque exacte : Pepsi doit donc gagner sur SodaStream → PepsiCo.
    if (parent && candidate === parent) return 250 + parent.length;
    if (parent && (candidate.startsWith(`${parent} `) || candidate.includes(` ${parent} `))) return 180 + parent.length;
    return 0;
  };

  let best: { item: BoycottEntity; score: number } | undefined;
  for (const item of catalog) {
    for (const candidate of brandValues) {
      const score = scoreCandidate(candidate, item) + 100;
      if (score > (best?.score ?? 0)) best = { item, score };
    }
    for (const candidate of productValues) {
      const score = scoreCandidate(candidate, item);
      if (score > (best?.score ?? 0)) best = { item, score };
    }
  }
  return best?.item;
}

function dedupeCatalog(items: BoycottEntity[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item?.id ? String(item.id) : '';
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
  return catalog.filter((item) => {
    if (category && category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    return normalize([item.name, item.parentGroup, ...(item.aliases ?? [])].filter(Boolean).join(' ')).includes(q);
  });
}

export function findByBarcode(catalog: BoycottEntity[], barcode: string) {
  const clean = cleanBarcode(barcode);
  // Un code-barres identifie un produit exact. Les préfixes EAN/UPC ne permettent pas
  // d'identifier une marque de façon fiable et peuvent créer de faux positifs.
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
  if (!result.productName && !result.brandLabel) return;
  const cached: CachedScan = {
    barcode: result.barcode,
    productName: result.productName,
    brandLabel: result.brandLabel,
    imageUrl: result.imageUrl,
    cachedAt: Date.now(),
  };
  await writeLocalScan(cached);

  const config = supabaseConfig();
  if (!config) return;
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
    boycottEntity: entity,
    assessment: entity ? 'boycott' : 'ok',
    source,
  };
}

export async function lookupBoycottBarcode(catalog: BoycottEntity[], barcode: string): Promise<BarcodeLookupResult> {
  const clean = cleanBarcode(barcode);
  const direct = findByBarcode(catalog, clean);
  if (direct) {
    const result: BarcodeLookupResult = {
      barcode: clean,
      boycottEntity: direct,
      brandLabel: direct.name,
      assessment: 'boycott',
      source: 'catalog',
    };
    void rememberScannedProduct(result);
    return result;
  }

  const local = await readLocalScan(clean);
  if (local) return assessCachedProduct(catalog, local, 'cache');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json?fields=product_name,product_name_fr,brands,brands_tags,image_front_small_url`,
      { headers: { Accept: 'application/json' }, signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!response.ok) return { barcode: clean, assessment: 'unknown', source: 'none' };
    const payload = await response.json() as {
      status?: number;
      product?: {
        product_name?: string;
        product_name_fr?: string;
        brands?: string;
        brands_tags?: string[];
        image_front_small_url?: string;
      };
    };
    const product = payload.product;
    if (!product || payload.status === 0) return { barcode: clean, assessment: 'unknown', source: 'none' };
    const rawBrands = [product.brands, ...(product.brands_tags ?? [])].filter(Boolean).join(', ');
    const entity = findBoycottEntityByBrand(catalog, rawBrands, product.product_name_fr || product.product_name);
    const result: BarcodeLookupResult = {
      barcode: clean,
      productName: product.product_name_fr || product.product_name,
      brandLabel: product.brands || rawBrands || undefined,
      imageUrl: product.image_front_small_url,
      boycottEntity: entity,
      assessment: entity ? 'boycott' : 'ok',
      source: 'openfoodfacts',
    };
    await rememberScannedProduct(result);
    return result;
  } catch {
    return { barcode: clean, assessment: 'unknown', source: 'none' };
  }
}
