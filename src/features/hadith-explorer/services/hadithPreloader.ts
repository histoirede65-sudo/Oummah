import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchSupabaseCollectionPage } from "../data/hadithDataSource";
import type { HadithSummary } from "../domain/Hadith";
import { getHadithCollection } from "../domain/HadithCollection";
import { hadithRepository } from "../data/hadithRepository";

const PRELOAD_PREFIX = "preload-v1:";
const PRELOAD_COLLECTIONS = ["bukhari", "muslim", "nawawi"] as const;

export type HadithPreload = {
  partial: true;
  collectionId: string;
  items: HadithSummary[];
  createdAt: number;
};

export function hadithPreloadKey(collectionId: string) {
  return `${PRELOAD_PREFIX}${collectionId}`;
}

export async function getHadithPreload(collectionId: string): Promise<HadithPreload | null> {
  try {
    const raw = await AsyncStorage.getItem(hadithPreloadKey(collectionId));
    if (!raw) return null;
    const value = JSON.parse(raw) as HadithPreload;
    return value.partial === true && value.collectionId === collectionId && Array.isArray(value.items) ? value : null;
  } catch {
    return null;
  }
}

export async function preloadHadithCollections() {
  for (const collectionId of PRELOAD_COLLECTIONS) {
    const collection = getHadithCollection(collectionId);
    if (!collection || await getHadithPreload(collectionId)) continue;
    try {
      const items = await fetchSupabaseCollectionPage(
        [collection.query, ...(collection.queryAliases ?? [])],
        0,
        20,
        collection.id,
      );
      const value: HadithPreload = { partial: true, collectionId, items, createdAt: Date.now() };
      await AsyncStorage.setItem(hadithPreloadKey(collectionId), JSON.stringify(value));
    } catch {
      // The full collection load remains the source of truth.
    }
  }
  for (const collectionId of PRELOAD_COLLECTIONS) {
    const collection = getHadithCollection(collectionId);
    if (collection) await hadithRepository.listCollectionCategories(collection).catch(() => undefined);
  }
}
