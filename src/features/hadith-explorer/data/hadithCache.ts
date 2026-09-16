import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Hadith, HadithSummary } from "../domain/Hadith";

const DETAILS_KEY = "oumma:hadith:details:v2";
const LEGACY_DETAILS_KEY = "oumma:hadith:details:v1";
const SEARCH_KEY = "oumma:hadith:search:v1";

type DetailCache = Record<string, { value: Hadith; cachedAt: number }>;
type SearchCache = Record<string, { value: HadithSummary[]; cachedAt: number }>;

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const hadithCache = {
  async get(id: string, language: "fr" | "en" = "fr") {
    const cache = await read<DetailCache>(DETAILS_KEY, {});
    const localized = cache[`${language}:${id}`]?.value;
    if (localized) return localized;
    if (language !== "fr") return null;
    const legacy = await read<DetailCache>(LEGACY_DETAILS_KEY, {});
    return legacy[id]?.value ?? null;
  },
  async put(value: Hadith, language: "fr" | "en" = "fr") {
    const cache = await read<DetailCache>(DETAILS_KEY, {});
    cache[`${language}:${value.id}`] = { value, cachedAt: Date.now() };
    const entries = Object.entries(cache).sort((a, b) => b[1].cachedAt - a[1].cachedAt).slice(0, 250);
    await AsyncStorage.setItem(DETAILS_KEY, JSON.stringify(Object.fromEntries(entries)));
  },
  async all() {
    const cache = await read<DetailCache>(DETAILS_KEY, {});
    return Object.entries(cache).filter(([key]) => key.startsWith("fr:")).map(([, entry]) => entry.value);
  },
  async getSearch(key: string) {
    const cache = await read<SearchCache>(SEARCH_KEY, {});
    return cache[key]?.value ?? null;
  },
  async putSearch(key: string, value: HadithSummary[]) {
    const cache = await read<SearchCache>(SEARCH_KEY, {});
    cache[key] = { value, cachedAt: Date.now() };
    const entries = Object.entries(cache).sort((a, b) => b[1].cachedAt - a[1].cachedAt).slice(0, 40);
    await AsyncStorage.setItem(SEARCH_KEY, JSON.stringify(Object.fromEntries(entries)));
  },
};

