import type { BarcodeLookupResult, ProductComparisonData, ProductHalalData, ProductHealthData } from './data/BoycottRepository';
import { analyzeHalalCertification } from './halalCertificationAnalyzer';

export type AlternativeProduct = {
  barcode: string;
  productName: string;
  brand?: string;
  imageUrl?: string;
  nutritionGrade?: string;
  healthData?: ProductHealthData;
  halalData?: ProductHalalData;
  comparisonData?: ProductComparisonData;
  reasons: string[];
};

type Candidate = Omit<AlternativeProduct, 'reasons'>;
const MAX_CANDIDATES = 8;
const BROAD_CATEGORIES = new Set(['beverages', 'drinks', 'food', 'foods', 'snacks', 'en:beverages', 'en:food']);

function normalizedTags(tags?: string[]) {
  return new Set((tags ?? []).map((tag) => tag.toLowerCase().replace(/^(en|fr):/, '').trim()).filter((tag) => tag.length > 2));
}

function nutritionRank(value?: string) {
  const grade = value?.trim().toLowerCase();
  return grade && /^[a-e]$/.test(grade) ? grade.charCodeAt(0) - 97 : 10;
}

function highCount(data?: ProductHealthData) {
  return Object.values(data?.nutrientLevels ?? {}).filter((value) => value === 'high').length;
}

function additiveCount(data?: ProductHealthData) {
  return data?.additivesTags?.length ?? 0;
}

function genericFamily(name?: string, tags?: string[]) {
  const value = `${name ?? ''} ${(tags ?? []).join(' ')}`.toLowerCase();
  if (/water|eau/.test(value)) return 'water';
  if (/cola|soda|soft drink|boisson gazeuse|carbonated/.test(value)) return 'soda';
  if (/juice|jus/.test(value)) return 'juice';
  if (/energy|énergisante|energisante/.test(value)) return 'energy';
  if (/milk|lait|dairy/.test(value)) return 'milk';
  if (/tea|thé|the/.test(value)) return 'tea';
  return undefined;
}


function candidateFromProduct(product: Record<string, unknown>): Candidate | undefined {
  const code = typeof product.code === 'string' ? product.code : undefined;
  const productName = typeof product.product_name_fr === 'string' ? product.product_name_fr : typeof product.product_name === 'string' ? product.product_name : undefined;
  if (!code || !productName?.trim()) return undefined;
  const brands = typeof product.brands === 'string' ? product.brands.split(',')[0]?.trim() : undefined;
  const nutritionLevels = product.nutrient_levels && typeof product.nutrient_levels === 'object' ? product.nutrient_levels as ProductHealthData['nutrientLevels'] : undefined;
  const ingredientsText = typeof product.ingredients_text_fr === 'string' ? product.ingredients_text_fr : typeof product.ingredients_text === 'string' ? product.ingredients_text : undefined;
  const labels = [typeof product.labels === 'string' ? product.labels : undefined, ...(Array.isArray(product.labels_tags) ? product.labels_tags.filter((value): value is string => typeof value === 'string') : [])].filter((value): value is string => Boolean(value));
  const certifications = [typeof product.certifications === 'string' ? product.certifications : undefined, ...(Array.isArray(product.certifications_tags) ? product.certifications_tags.filter((value): value is string => typeof value === 'string') : [])].filter((value): value is string => Boolean(value));
  return {
    barcode: code,
    productName: productName.trim(),
    brand: brands,
    imageUrl: typeof product.image_front_small_url === 'string' ? product.image_front_small_url : undefined,
    nutritionGrade: typeof product.nutrition_grades === 'string' ? product.nutrition_grades : undefined,
    healthData: { ingredientsText, additivesTags: Array.isArray(product.additives_tags) ? product.additives_tags.filter((value): value is string => typeof value === 'string') : undefined, nutrientLevels: nutritionLevels, nutritionGrade: typeof product.nutrition_grades === 'string' ? product.nutrition_grades : undefined, novaGroup: typeof product.nova_group === 'number' ? product.nova_group : undefined },
    halalData: { labels, certifications, countries: Array.isArray(product.countries_tags) ? product.countries_tags.filter((value): value is string => typeof value === 'string') : undefined },
    comparisonData: { categories: typeof product.categories === 'string' ? product.categories : undefined, categoriesTags: Array.isArray(product.categories_tags) ? product.categories_tags.filter((value): value is string => typeof value === 'string') : undefined, quantity: typeof product.quantity === 'string' ? product.quantity : undefined },
  };
}

function scoreCandidate(original: BarcodeLookupResult, candidate: Candidate, sharedCategories: number) {
  const originalGrade = nutritionRank(original.healthData?.nutritionGrade);
  const candidateGrade = nutritionRank(candidate.nutritionGrade);
  const originalHalal = analyzeHalalCertification(original.halalData, original.healthData?.ingredientsText);
  const candidateHalal = analyzeHalalCertification(candidate.halalData, candidate.healthData?.ingredientsText);
  const gradeImproved = candidateGrade < originalGrade;
  const highImproved = highCount(candidate.healthData) < highCount(original.healthData);
  const additivesImproved = additiveCount(candidate.healthData) < additiveCount(original.healthData);
  const halalImproved = candidateHalal.level === 'verified' && originalHalal.level !== 'verified';
  const dataQuality = Number(Boolean(candidate.imageUrl)) + Number(Boolean(candidate.healthData?.ingredientsText)) + Number(Boolean(candidate.nutritionGrade)) + Number(Boolean(candidate.comparisonData?.categoriesTags?.length));
  const france = (candidate.halalData?.countries ?? []).some((value) => /(^|:)(france|fr)$/i.test(value));
  const score = sharedCategories * 100 + Number(gradeImproved) * 20 + Number(highImproved) * 12 + Number(additivesImproved) * 8 + Number(halalImproved) * 18 + Number(france) * 4 + dataQuality;
  const reasons = [
    gradeImproved && original.healthData?.nutritionGrade && candidate.nutritionGrade ? `Nutri-Score ${candidate.nutritionGrade.toUpperCase()} au lieu de ${original.healthData.nutritionGrade.toUpperCase()}` : undefined,
    highImproved ? 'Moins de niveaux nutritionnels élevés' : undefined,
    additivesImproved ? `Moins d’additifs déclarés (${additiveCount(candidate.healthData)} contre ${additiveCount(original.healthData)})` : undefined,
    halalImproved ? 'Certification halal identifiée' : undefined,
  ].filter((reason): reason is string => Boolean(reason)).slice(0, 3);
  return { score, reasons };
}

export async function findProductAlternative(original: BarcodeLookupResult): Promise<AlternativeProduct | null> {
  const originalCategories = normalizedTags(original.comparisonData?.categoriesTags);
  if (originalCategories.size === 0) return null;
  const preciseCategories = [...originalCategories].filter((tag) => !BROAD_CATEGORIES.has(tag));
  if (preciseCategories.length === 0) return null;
  const category = [...originalCategories].sort((a, b) => b.length - a.length)[0];
  const originalFamily = genericFamily(original.productName, original.comparisonData?.categoriesTags);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const fields = 'code,product_name,product_name_fr,brands,image_front_small_url,ingredients_text,ingredients_text_fr,additives_tags,nutrient_levels,nutrition_grades,nova_group,labels,labels_tags,certifications,certifications_tags,countries_tags,categories,categories_tags,quantity';
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/search?categories_tags=${encodeURIComponent(category)}&page_size=${MAX_CANDIDATES}&fields=${fields}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) return null;
    const payload = await response.json() as { products?: Array<Record<string, unknown>> };
    const candidates = (payload.products ?? []).map(candidateFromProduct).filter((candidate): candidate is Candidate => Boolean(candidate)).filter((candidate) => candidate.barcode !== original.barcode);
    const ranked = candidates.map((candidate) => { const sharedCategories = [...normalizedTags(candidate.comparisonData?.categoriesTags)].filter((tag) => originalCategories.has(tag)).length; return { candidate, sharedCategories, ...scoreCandidate(original, candidate, sharedCategories) }; }).filter((item) => item.sharedCategories > 0 && item.reasons.length > 0 && (!originalFamily || !genericFamily(item.candidate.productName, item.candidate.comparisonData?.categoriesTags) || genericFamily(item.candidate.productName, item.candidate.comparisonData?.categoriesTags) === originalFamily)).sort((a, b) => b.score - a.score);
    const best = ranked[0];
    return best ? { ...best.candidate, reasons: best.reasons } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
