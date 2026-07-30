import type { Hadith, HadithSummary } from "../domain/Hadith";
import { fetchHadith, fetchHadithPage, searchHadiths } from "./hadithDataSource";
import { hadithCache } from "./hadithCache";

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

export const hadithRepository = {
  async get(id: string): Promise<Hadith> {
    try {
      const value = await fetchHadith(id);
      await hadithCache.put(value);
      return value;
    } catch (error) {
      const cached = await hadithCache.get(id);
      if (cached) return cached;
      throw error;
    }
  },
  async search(query: string): Promise<HadithSummary[]> {
    const normalized = normalizeHadithQuery(query);
    if (!normalized) return [];
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
  async daily(): Promise<Hadith | null> {
    try {
      const page = await fetchHadithPage(1, 40);
      if (!page.length) return null;
      const start = new Date(new Date().getFullYear(), 0, 0);
      const day = Math.floor((Date.now() - start.getTime()) / 86400000);
      return this.get(page[day % page.length].id);
    } catch {
      const local = await hadithCache.all();
      return local[0] ?? null;
    }
  },
};

