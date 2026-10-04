import type { Hadith, HadithSummary } from "../domain/Hadith";
import type { HadithCollection, HadithDocumentaryCategory } from "../domain/HadithCollection";
import {
  fetchHadith,
  fetchHadithPage,
  fetchHadeethEncCategoryTree,
  type HadeethEncCategory,
  fetchHadeethEncCategories,
  fetchSupabaseCollectionPage,
  fetchSupabaseHadith,
  fetchSupabaseHadithPreviews,
  fetchSupabaseSourceCategories,
  fetchSupabaseSourceCategoryAssignments,
  searchSupabaseHadiths,
  searchHadiths,
  resolveHadeethEncHadithIds,
} from "./hadithDataSource";
import { hadithCache } from "./hadithCache";
import { getHadithCategoryCache, isHadithCategoryCacheFresh, putHadithCategoryCache } from "./hadithCategoryCache";
import { createHadithPreview, type HadithPreview } from "../presentation/hadithPreview";

const themeCategoryCache = new Map<string, Promise<HadithSummary[]>>();
const categoryTreeCache = new Map<string, Promise<HadeethEncCategory[]>>();

export function normalizeHadithQuery(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

function locallyMatches(hadith: Hadith, query: string) {
  const haystack = normalizeHadithQuery([hadith.title, hadith.french, hadith.attribution, hadith.grade, hadith.reference].join(" "));
  if (haystack.includes(query)) return true;
  return query.split(/\s+/).some((word) => word.length > 3 && haystack.split(/\s+/).some((candidate) => editDistance(word, candidate) <= 1));
}

function uniqueSummaries(items: HadithSummary[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

const collectionItemsCache = new Map<string, Promise<HadithSummary[]>>();
const collectionCategoriesCache = new Map<string, HadithDocumentaryCategory[]>();
const collectionCategoriesRequests = new Map<string, Promise<HadithDocumentaryCategory[]>>();
const collectionCategoryItemsCache = new Map<string, HadithSummary[]>();
const previewMemoryCache = new Map<string, HadithPreview>();
const previewRequests = new Map<string, Promise<HadithPreview>>();
const detailRequests = new Map<string, Promise<Hadith>>();

async function mapWithConcurrency<T, R>(items: readonly T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;
  const run = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

export async function getHadithPreviews(items: readonly HadithSummary[], language: "fr" | "en"): Promise<Record<string, HadithPreview>> {
  const result: Record<string, HadithPreview> = {};
  const missing = items.filter((item) => {
    const key = `${language}:${item.id}`;
    const cached = previewMemoryCache.get(key);
    if (cached) result[item.id] = cached;
    return !cached;
  });
  if (language === "fr" && missing.length) {
    const rows = await fetchSupabaseHadithPreviews(missing.map((item) => item.id)).catch(() => []);
    rows.forEach((row) => {
      const preview = createHadithPreview(row.translation_text ?? "");
      previewMemoryCache.set(`fr:${row.hadith_id}`, preview);
      result[row.hadith_id] = preview;
    });
  }
  const remaining = missing.filter((item) => !result[item.id]);
  const officialIds = language === "en"
    ? await resolveHadeethEncHadithIds(remaining.map((item) => item.id)).catch(() => new Map<string, string>())
    : new Map<string, string>();
  await mapWithConcurrency(remaining, 4, async (item) => {
    const key = `${language}:${item.id}`;
    const existing = previewRequests.get(key);
    const request = existing ?? (async () => {
      const hadith = await hadithRepository.get(officialIds.get(item.id) ?? item.id, language);
      const preview = createHadithPreview(hadith.french);
      previewMemoryCache.set(key, preview);
      return preview;
    })();
    previewRequests.set(key, request);
    try { result[item.id] = await request; } catch { result[item.id] = createHadithPreview(item.title); }
    finally { previewRequests.delete(key); }
    return result[item.id];
  });
  return result;
}

async function refreshCollectionCategories(collection: HadithCollection, cacheKey: string, language: "fr" | "en") {
  const inFlight = collectionCategoriesRequests.get(cacheKey);
  if (inFlight) return inFlight;
  const request = (async () => {
    const items = await hadithRepository.searchCollection(collection);
    const storedCategories = await fetchSupabaseSourceCategories();
    let categories = storedCategories;
    if (language === "en") {
      const [officialFrench, officialEnglish] = await Promise.all([
        fetchHadeethEncCategories("fr").catch(() => []),
        fetchHadeethEncCategories("en").catch(() => []),
      ]);
      const englishByOfficialId = new Map(officialEnglish.map((category) => [category.id, category.source_category_label ?? ""]));
      const englishByFrenchLabel = new Map(
        officialFrench.map((category) => [normalizeHadithQuery(category.source_category_label ?? ""), englishByOfficialId.get(category.id) ?? ""]),
      );
      categories = storedCategories.map((category) => ({
        ...category,
        source_category_label: englishByOfficialId.get(category.id)
          || englishByFrenchLabel.get(normalizeHadithQuery(category.source_category_label ?? ""))
          || category.source_category_label,
      }));
    }
    const assignments = await fetchSupabaseSourceCategoryAssignments(
      categories.map((category) => category.id),
      items.map((item) => item.id),
    );
    const counts = new Map<string, Set<string>>();
    for (const assignment of assignments) {
      const ids = counts.get(assignment.source_category_id) ?? new Set<string>();
      ids.add(assignment.hadith_id);
      counts.set(assignment.source_category_id, ids);
    }
    const result = categories
      .filter((category) => counts.has(category.id))
      .map((category) => ({ id: category.id, name: category.source_category_label?.trim() || (language === "en" ? "Category" : "Catégorie"), hadithCount: counts.get(category.id)?.size ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name, language));
    collectionCategoriesCache.set(cacheKey, result);
    await putHadithCategoryCache(`${collection.id}:${language}:v2`, result);
    return result;
  })();
  collectionCategoriesRequests.set(cacheKey, request);
  request.then(() => collectionCategoriesRequests.delete(cacheKey), () => collectionCategoriesRequests.delete(cacheKey));
  return request;
}

export const hadithRepository = {
  async get(id: string, language: "fr" | "en" = "fr"): Promise<Hadith> {
    const cached = await hadithCache.get(id, language);
    if (cached) return cached;
    const key = `${language}:${id}`;
    const inFlight = detailRequests.get(key);
    if (inFlight) return inFlight;
    const request = (async () => {
      if (language === "en") {
        const officialId = await resolveHadeethEncHadithIds([id]).then((ids) => ids.get(id) ?? id);
        const officialCached = await hadithCache.get(officialId, language);
        if (officialCached) return officialCached;
        const value = await fetchHadith(officialId, "en");
        await hadithCache.put(value, language);
        return value;
      }
      try {
        const value = await fetchSupabaseHadith(id).catch(() => fetchHadith(id));
        await hadithCache.put(value, language);
        return value;
      } catch (error) {
        const fallback = await hadithCache.get(id, language);
        if (fallback) return fallback;
        throw error;
      }
    })();
    detailRequests.set(key, request);
    request.finally(() => detailRequests.delete(key)).catch(() => undefined);
    return request;
  },

  /** The direct subcategories of a HadeethEnc category, largest first. */
  async subCategories(categoryId: string, language: "fr" | "en" = "fr"): Promise<HadeethEncCategory[]> {
    let tree = categoryTreeCache.get(language);
    if (!tree) {
      tree = fetchHadeethEncCategoryTree(language);
      categoryTreeCache.set(language, tree);
      tree.catch(() => categoryTreeCache.delete(language));
    }
    return (await tree)
      .filter((category) => category.parentId === categoryId && category.count > 0)
      .sort((left, right) => right.count - left.count);
  },

  /** Every hadith HadeethEnc files under a category (subcategories included), in its own order. */
  listCategory(categoryId: string, language: "fr" | "en" = "fr"): Promise<HadithSummary[]> {
    const key = `${language}:${categoryId}`;
    const cached = themeCategoryCache.get(key);
    if (cached) return cached;
    const request = (async () => {
      const value: HadithSummary[] = [];
      for (let page = 1; page <= 12; page += 1) {
        const items = await fetchHadithPage(page, 100, categoryId, language);
        value.push(...items);
        if (items.length < 100) break;
      }
      return value;
    })();
    themeCategoryCache.set(key, request);
    request.catch(() => themeCategoryCache.delete(key));
    return request;
  },

  async search(query: string, language: "fr" | "en" = "fr"): Promise<HadithSummary[]> {
    const normalized = normalizeHadithQuery(query);
    if (!normalized) return [];
    if (language === "en") return searchHadiths(query, "en");
    try {
      const value = await searchHadiths(query);
      await hadithCache.putSearch(normalized, value);
      return value;
    } catch {
      const exactCache = await hadithCache.getSearch(normalized);
      if (exactCache) return exactCache;
      const local = await hadithCache.all();
      return local.filter((item) => locallyMatches(item, normalized)).map(({ id, title }) => ({ id, title, translations: ["fr"] }));
    }
  },

  async searchCollection(collection: HadithCollection): Promise<HadithSummary[]> {
    const cacheKey = normalizeHadithQuery(`collection-v3:${collection.id}`);
    const cached = collectionItemsCache.get(cacheKey);
    if (collection.id === "nawawi") {
      console.log("[Nawawi Debug: memory cache]", {
        cacheKey,
        hasCachedPromise: Boolean(cached),
      });
    }
    if (cached) {
      return cached;
    }
    const request = (async () => {
      try {
      const value: HadithSummary[] = [];
      const pageSize = 1000;
      const sourceReferences = [collection.query, ...(collection.queryAliases ?? [])];
      for (let offset = 0; ; offset += pageSize) {
        const page = await fetchSupabaseCollectionPage(sourceReferences, offset, pageSize, collection.id);
        if (collection.id === "nawawi") {
          console.log("[Nawawi Debug: Supabase page]", {
            offset,
            pageSize,
            pageCount: page.length,
            sample: page.slice(0, 5),
          });
        }
        value.push(...page);
        if (page.length === 0) break;
      }
      const unique = uniqueSummaries(value);
      if (collection.id === "nawawi") {
        console.log("[Nawawi Debug: repository result]", {
          rawCount: value.length,
          uniqueCount: unique.length,
        });
      }
      if (unique.length > 0) {
        await hadithCache.putSearch(cacheKey, unique);
        return unique;
      }
      const cachedSearch = await hadithCache.getSearch(cacheKey);
      if (collection.id === "nawawi") {
        console.log("[Nawawi Debug: persistent cache]", {
          cacheKey,
          count: cachedSearch?.length ?? 0,
        });
      }
      return cachedSearch ?? [];
      } catch (error) {
        if (collection.id === "nawawi") {
          console.log("[Nawawi Debug: error]", {
            message: error instanceof Error ? error.message : String(error),
          });
        }
        const cachedSearch = await hadithCache.getSearch(cacheKey);
        if (cachedSearch?.length) return cachedSearch;
        return [];
      }
    })();
    collectionItemsCache.set(cacheKey, request);
    request.catch(() => collectionItemsCache.delete(cacheKey));
    return request;
  },

  async searchWithinCollection(collection: HadithCollection, query: string): Promise<HadithSummary[]> {
    const [collectionItems, searchResults] = await Promise.all([
      this.searchCollection(collection),
      searchSupabaseHadiths(query).catch(() => this.search(query)),
    ]);
    const collectionIds = new Set(collectionItems.map((item) => item.id));
    return searchResults.filter((item) => collectionIds.has(item.id));
  },

  async searchCollectionTheme(collection: HadithCollection, themeQuery: string): Promise<HadithSummary[]> {
    const cacheKey = normalizeHadithQuery(`collection:${collection.id}:theme:${themeQuery}`);
    try {
      const collectionItems = await this.searchCollection(collection);
      if (!collectionItems.length) return [];

      const queryTerms = normalizeHadithQuery(themeQuery)
        .split(/\s+/)
        .filter((term) => term.length >= 4);
      if (!queryTerms.length) return [];

      const categories = await fetchSupabaseSourceCategories();
      const categoryIds = categories
        .filter((category) => {
          const label = normalizeHadithQuery(category.source_category_label ?? "");
          return queryTerms.some((term) => label.includes(term));
        })
        .map((category) => category.id);
      if (!categoryIds.length) return [];

      const assignments = await fetchSupabaseSourceCategoryAssignments(
        categoryIds,
        collectionItems.map((item) => item.id),
      );
      const matchingIds = new Set(assignments.map((assignment) => assignment.hadith_id));
      const result = collectionItems.filter((item) => matchingIds.has(item.id));
      await hadithCache.putSearch(cacheKey, result);
      return result;
    } catch {
      return (await hadithCache.getSearch(cacheKey)) ?? [];
    }
  },

  async listCollectionCategories(collection: HadithCollection, language: "fr" | "en" = "fr"): Promise<HadithDocumentaryCategory[]> {
    const cacheKey = normalizeHadithQuery(`collection:${collection.id}:categories:${language}:v2`);
    const cached = collectionCategoriesCache.get(cacheKey);
    if (cached) return cached;
    const persistent = await getHadithCategoryCache(`${collection.id}:${language}:v2`);
    if (persistent) {
      collectionCategoriesCache.set(cacheKey, persistent.categories);
      if (!isHadithCategoryCacheFresh(persistent)) void refreshCollectionCategories(collection, cacheKey, language).catch(() => undefined);
      return persistent.categories;
    }
    return refreshCollectionCategories(collection, cacheKey, language);
  },

  async searchCollectionCategory(collection: HadithCollection, categoryId: string): Promise<HadithSummary[]> {
    const cacheKey = normalizeHadithQuery(`collection:${collection.id}:category:${categoryId}`);
    const cached = collectionCategoryItemsCache.get(cacheKey);
    if (cached) return cached;
    const items = await this.searchCollection(collection);
    const assignments = await fetchSupabaseSourceCategoryAssignments(
      [categoryId],
      items.map((item) => item.id),
    );
    const ids = new Set(assignments.map((assignment) => assignment.hadith_id));
    const result = items.filter((item) => ids.has(item.id));
    collectionCategoryItemsCache.set(cacheKey, result);
    return result;
  },

  async daily(language: "fr" | "en" = "fr"): Promise<Hadith | null> {
    try {
      // Keep one canonical daily selection for every language. Only the
      // official translation fetched for the selected identifier changes.
      const page = await fetchHadithPage(1, 40, "5", "fr");
      if (!page.length) return null;
      const start = new Date(new Date().getFullYear(), 0, 0);
      const day = Math.floor((Date.now() - start.getTime()) / 86400000);
      return this.get(page[day % page.length].id, language);
    } catch {
      if (language === "en") return null;
      const local = await hadithCache.all();
      return local[0] ?? null;
    }
  },
};
