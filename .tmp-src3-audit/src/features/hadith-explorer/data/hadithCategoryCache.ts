import AsyncStorage from "@react-native-async-storage/async-storage";
import type { HadithDocumentaryCategory } from "../domain/HadithCollection";

const PREFIX = "categories-v1:";
const TTL_MS = 24 * 60 * 60 * 1000;

export type HadithCategoryCacheEntry = {
  collectionId: string;
  complete: true;
  categories: HadithDocumentaryCategory[];
  createdAt: number;
};

export function hadithCategoryCacheKey(collectionId: string) { return `${PREFIX}${collectionId}`; }
export function isHadithCategoryCacheFresh(entry: HadithCategoryCacheEntry) { return Date.now() - entry.createdAt <= TTL_MS; }

export async function getHadithCategoryCache(collectionId: string): Promise<HadithCategoryCacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(hadithCategoryCacheKey(collectionId));
    if (!raw) return null;
    const entry = JSON.parse(raw) as HadithCategoryCacheEntry;
    return entry.collectionId === collectionId && entry.complete === true && Array.isArray(entry.categories) ? entry : null;
  } catch { return null; }
}

export async function putHadithCategoryCache(collectionId: string, categories: HadithDocumentaryCategory[]) {
  const entry: HadithCategoryCacheEntry = { collectionId, complete: true, categories, createdAt: Date.now() };
  await AsyncStorage.setItem(hadithCategoryCacheKey(collectionId), JSON.stringify(entry));
}
