import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BarcodeLookupResult, ProductHalalData } from './data/BoycottRepository';
import { findBoycottEntityByBrand, findByBarcode } from './data/BoycottRepository';
import { resolveCanonicalCommercialEntity } from './commercialEntityResolver';
import type { BoycottEntity } from './domain/BoycottEntity';
import { analyzeHalalCertification } from './halalCertificationAnalyzer';
import { analyzeHealthScore, type HealthGrade } from './healthScoreAnalyzer';

/**
 * Alternatives produits, version précalculée.
 *
 * - « Même type » : la catégorie Open Food Facts la plus précise que le produit partage avec les candidats
 *   (« colas » plutôt que « boissons sucrées ») ; les catégories trop larges sont exclues par le script.
 * - Jamais la même marque que le produit scanné, et au plus deux produits par marque.
 * - « Pas à boycotter » : filtré ici, au moment du scan, avec le catalogue boycott à jour
 *   (code-barres connu, préfixe GS1, marque, groupe propriétaire).
 * - « Meilleur Nutri-Score » : strictement meilleur ; pour un produit à boycotter, au moins aussi bon
 *   (le but est d'abord de le remplacer, jamais par un produit moins bon).
 * - Score Santé OUMMAH (même moteur que la fiche) : au moins 50/100, et meilleur que celui du produit
 *   scanné (au moins égal s'il est à boycotter). Une alternative mal notée n'aide personne.
 * - Produit certifié halal : seules des alternatives certifiées sont proposées.
 *
 * Les candidats viennent de public.product_alternative_candidates (scripts/product-alternatives).
 */

export type ProductAlternative = {
  barcode: string;
  productName: string;
  brand?: string;
  imageUrl?: string;
  quantity?: string;
  nutritionGrade: NutriGrade;
  novaGroup?: number;
  healthScore: number;
  healthGrade: HealthGrade;
  halalData: ProductHalalData;
  reasons: string[];
};

export type NutriGrade = 'a' | 'b' | 'c' | 'd' | 'e';

export type AlternativeCandidateRow = {
  barcode: string;
  category: string;
  category_size?: number | null;
  category_depth?: number | null;
  category_name?: string | null;
  product_name: string;
  brands?: string | null;
  brands_tags?: string[] | null;
  nutriscore_grade: NutriGrade;
  nutriscore_score?: number | null;
  nova_group?: number | null;
  additives_tags?: string[] | null;
  popularity?: number | null;
  halal_labels?: string[] | null;
  quantity?: string | null;
  image_url?: string | null;
  owner?: string | null;
};

const GRADES: NutriGrade[] = ['a', 'b', 'c', 'd', 'e'];
const MAX_ALTERNATIVES = 10;
/** Below this OUMMAH health score (grade C = 40–59), an alternative is not worth recommending. */
export const MIN_ALTERNATIVE_HEALTH_SCORE = 50;
const MAX_PER_BRAND = 2;
const MAX_QUERY_TAGS = 40;
const CANDIDATE_CACHE_PREFIX = 'oummah.boycott.alternative-candidates.v3.';
const CANDIDATE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6000;

const memoryCandidates = new Map<string, AlternativeCandidateRow[]>();
const inflight = new Map<string, Promise<AlternativeCandidateRow[]>>();

function normalize(value: string) { return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

export function toNutriGrade(value?: string): NutriGrade | undefined {
  const grade = value?.trim().toLowerCase();
  return GRADES.includes(grade as NutriGrade) ? grade as NutriGrade : undefined;
}

/** Grades an alternative may have: strictly better, or at least as good when the scanned product is boycotted. */
export function acceptedGrades(originalGrade: NutriGrade | undefined, originalBoycotted: boolean): NutriGrade[] {
  if (!originalGrade) return ['a', 'b'];
  const index = GRADES.indexOf(originalGrade);
  return GRADES.slice(0, originalBoycotted ? index + 1 : index);
}

/** Never recommend a product tied to the boycott catalog, whatever the signal. */
export function isBoycottCandidate(catalog: BoycottEntity[], row: AlternativeCandidateRow) {
  if (findByBarcode(catalog, row.barcode)) return true;
  if (catalog.some((entity) => entity.barcodePrefixes?.some((prefix) => prefix && row.barcode.startsWith(prefix)))) return true;
  if (findBoycottEntityByBrand(catalog, row.brands ?? undefined, row.product_name)) return true;
  const resolution = resolveCanonicalCommercialEntity(catalog, { productName: row.product_name, brands: row.brands ?? undefined, brandsTags: row.brands_tags ?? undefined, owner: row.owner?.replace(/^org-/, '').replace(/-/g, ' ') || undefined });
  return resolution.status === 'BOYCOTT';
}

function supabaseConfig() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

async function fetchJson(url: string, headers: Record<string, string>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json', ...headers }, signal: controller.signal });
    return response.ok ? await response.json() as unknown : undefined;
  } finally {
    clearTimeout(timer);
  }
}

/** Category tags of the scanned product; one small OFF request when the stored scan has none. */
async function resolveCategoryTags(original: BarcodeLookupResult): Promise<string[]> {
  const known = [...(original.comparisonData?.categoriesTags ?? []), original.comparisonData?.comparedToCategory].filter((tag): tag is string => Boolean(tag));
  if (known.length) return Array.from(new Set(known));
  try {
    const payload = await fetchJson(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(original.barcode)}.json?fields=categories_tags`, { 'User-Agent': 'OUMMAH/1.0' }) as { product?: { categories_tags?: string[] } } | undefined;
    return payload?.product?.categories_tags ?? [];
  } catch {
    return [];
  }
}

function brandKeys(value?: string | null) {
  return (value ?? '').split(',').map((part) => normalize(part)).filter(Boolean);
}

async function readCachedCandidates(cacheKey: string) {
  try {
    const raw = await AsyncStorage.getItem(CANDIDATE_CACHE_PREFIX + cacheKey);
    const cached = raw ? JSON.parse(raw) as { savedAt: number; rows: AlternativeCandidateRow[] } : undefined;
    return cached && Array.isArray(cached.rows) ? cached : undefined;
  } catch {
    return undefined;
  }
}

type CategoryLinkRow = { category: string; nutriscore_grade: NutriGrade; popularity?: number | null; product?: Omit<AlternativeCandidateRow, 'category' | 'category_size'> | null };

/**
 * Two small requests: the sizes of the product's type categories (the smallest = most precise wins),
 * then that category's candidates. Cached per product; boycott filtering stays live.
 */
async function loadCandidates(cacheKey: string, tags: string[]): Promise<AlternativeCandidateRow[]> {
  const memory = memoryCandidates.get(cacheKey);
  if (memory) return memory;
  const pending = inflight.get(cacheKey);
  if (pending) return pending;
  const task = (async () => {
    const cached = await readCachedCandidates(cacheKey);
    if (cached && Date.now() - cached.savedAt < CANDIDATE_CACHE_TTL_MS) return cached.rows;
    const config = supabaseConfig();
    if (!config) return cached?.rows ?? [];
    try {
      const auth = { apikey: config.key, Authorization: `Bearer ${config.key}` };
      const list = tags.slice(0, MAX_QUERY_TAGS).map((tag) => `"${tag.replace(/["\\]/g, '')}"`).join(',');
      const categories = await fetchJson(`${config.url}/rest/v1/product_alternative_categories?select=category,size,depth,name_fr&category=in.(${encodeURIComponent(list)})&order=depth.desc,size.asc&limit=1`, auth);
      if (!Array.isArray(categories)) return cached?.rows ?? [];
      const precise = categories[0] as { category: string; size: number; depth: number; name_fr?: string | null } | undefined;
      let rows: AlternativeCandidateRow[] = [];
      if (precise) {
        const links = await fetchJson(`${config.url}/rest/v1/product_alternative_category_products?select=category,nutriscore_grade,popularity,product:product_alternative_candidates(*)&category=eq.${encodeURIComponent(precise.category)}&limit=500`, auth);
        if (!Array.isArray(links)) return cached?.rows ?? [];
        rows = (links as CategoryLinkRow[]).filter((link) => link.product).map((link) => ({ ...link.product!, category: link.category, category_size: precise.size, category_depth: precise.depth, category_name: precise.name_fr }));
      }
      void AsyncStorage.setItem(CANDIDATE_CACHE_PREFIX + cacheKey, JSON.stringify({ savedAt: Date.now(), rows })).catch(() => undefined);
      return rows as AlternativeCandidateRow[];
    } catch {
      return cached?.rows ?? [];
    }
  })();
  inflight.set(cacheKey, task);
  try {
    const rows = await task;
    memoryCandidates.set(cacheKey, rows);
    return rows;
  } finally {
    inflight.delete(cacheKey);
  }
}

/**
 * Pure selection step (tested): candidate rows → ranked, filtered alternatives.
 * Only the most precise category (deepest in the OFF taxonomy, then fewest products) is used: a broader one would compare a hazelnut
 * spread with peanut butter. No better product of the same type = no alternative, said plainly.
 */
export function selectAlternatives(original: BarcodeLookupResult, rows: AlternativeCandidateRow[], catalog: BoycottEntity[]): ProductAlternative[] {
  const rank = (row: AlternativeCandidateRow) => (row.category_depth ?? 0) * 100000000 - (row.category_size ?? 0);
  const precise = rows.reduce<AlternativeCandidateRow | undefined>((best, row) => !best || rank(row) > rank(best) ? row : best, undefined);
  return precise ? selectInCategory(original, rows.filter((row) => row.category === precise.category), catalog) : [];
}

/** Same brand under another spelling: "H.J. Heinz B.V." / "Heinz", "Danone" / "Activia Céréales" / "DANONE S.A.". */
function isSameBrand(originalBrands: string[], originalName: string, candidateBrands: string[], candidateName: string) {
  const contains = (text: string, word: string) => word.length >= 3 && ` ${text} `.includes(` ${word} `);
  const originalText = [originalName, ...originalBrands].join(' ');
  const candidateText = [candidateName, ...candidateBrands].join(' ');
  return candidateBrands.some((brand) => originalBrands.includes(brand) || contains(originalText, brand))
    || originalBrands.some((brand) => contains(candidateText, brand));
}

function selectInCategory(original: BarcodeLookupResult, rows: AlternativeCandidateRow[], catalog: BoycottEntity[]): ProductAlternative[] {
  const originalGrade = toNutriGrade(original.healthData?.nutritionGrade);
  const originalBoycotted = original.assessment === 'boycott';
  const grades = acceptedGrades(originalGrade, originalBoycotted);
  if (!grades.length) return [];
  const originalCertifier = analyzeHalalCertification(original.halalData).certifierId;
  const originalHealth = analyzeHealthScore(original.healthData);
  const originalScore = originalHealth.available ? originalHealth.score : undefined;
  const originalName = normalize(original.productName ?? '');
  const originalBrands = [...brandKeys(original.brandLabel), ...brandKeys(original.commercialIdentity?.brands)];
  const seen = new Set<string>();
  const perBrand = new Map<string, number>();
  const selected: ProductAlternative[] = [];

  const ranked = rows
    .filter((row) => row.barcode !== original.barcode && grades.includes(row.nutriscore_grade))
    .map((row) => ({ row, health: analyzeHealthScore({ nutritionGrade: row.nutriscore_grade, novaGroup: row.nova_group ?? undefined, additivesTags: row.additives_tags ?? undefined }) }))
    .flatMap(({ row, health }) => health.available ? [{ row, score: health.score, grade: health.finalGrade }] : [])
    .filter(({ score }) => score >= MIN_ALTERNATIVE_HEALTH_SCORE && (originalScore === undefined || (originalBoycotted ? score >= originalScore : score > originalScore)))
    .sort((a, b) => b.score - a.score || (b.row.popularity ?? 0) - (a.row.popularity ?? 0));

  for (const { row, score, grade: healthGrade } of ranked) {
    if (selected.length >= MAX_ALTERNATIVES) break;
    // Same product in another size or a duplicate entry: one card only.
    const key = normalize(`${row.brands?.split(',')[0] ?? ''} ${row.product_name}`);
    if (seen.has(key) || (originalName && normalize(row.product_name) === originalName)) continue;
    // Without a photo the product cannot be recognised on the shelf.
    if (!row.image_url) continue;
    const brands = brandKeys(row.brands);
    // No brand = the boycott catalog cannot be checked. The same brand is not an alternative.
    if (!brands.length || isSameBrand(originalBrands, originalName, brands, normalize(row.product_name))) continue;
    if (brands[0] && (perBrand.get(brands[0]) ?? 0) >= MAX_PER_BRAND) continue;
    if (isBoycottCandidate(catalog, row)) continue;
    const halalData: ProductHalalData = { labels: row.halal_labels ?? [] };
    const certifier = analyzeHalalCertification(halalData).certifierId;
    if (originalCertifier && !certifier) continue;
    seen.add(key);
    if (brands[0]) perBrand.set(brands[0], (perBrand.get(brands[0]) ?? 0) + 1);

    const reasons: string[] = [];
    const grade = row.nutriscore_grade.toUpperCase();
    reasons.push(originalScore !== undefined ? `Score Santé ${score}/100 au lieu de ${originalScore}/100` : `Score Santé ${score}/100`);
    reasons.push(originalGrade ? (row.nutriscore_grade === originalGrade ? `Même Nutri-Score (${grade})` : `Nutri-Score ${grade} au lieu de ${originalGrade.toUpperCase()}`) : `Nutri-Score ${grade}`);
    reasons.push(row.category_name ? `Même catégorie : ${row.category_name.toLowerCase()}` : 'Même catégorie de produit');
    reasons.push('Aucun lien avec le catalogue boycott OUMMAH');
    if (certifier) reasons.push('Certification halal détectée');

    selected.push({
      barcode: row.barcode,
      productName: row.product_name,
      brand: row.brands?.split(',')[0]?.trim() || undefined,
      imageUrl: row.image_url ?? undefined,
      quantity: row.quantity ?? undefined,
      nutritionGrade: row.nutriscore_grade,
      novaGroup: row.nova_group ?? undefined,
      healthScore: score,
      healthGrade,
      halalData,
      reasons,
    });
  }
  return selected;
}

export async function findProductAlternatives(original: BarcodeLookupResult, catalog: BoycottEntity[]): Promise<ProductAlternative[]> {
  if (original.productKind && original.productKind !== 'food') return [];
  const tags = await resolveCategoryTags(original);
  if (!tags.length) return [];
  return selectAlternatives(original, await loadCandidates(original.barcode, tags), catalog);
}
