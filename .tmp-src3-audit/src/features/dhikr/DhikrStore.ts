import { storageService } from "../../core/storage";

const FAVORITES_KEY = "oummah.dhikr.favorites.v1";
const PROGRESS_KEY = "oummah.dhikr.progress.v1";

export type DhikrProgress = {
  categoryId: number;
  itemIndex: number;
  counters: Record<string, number>;
  updatedAt: number;
};

export async function getDhikrFavorites() {
  return (
    (await storageService
      .get<readonly string[]>(FAVORITES_KEY)
      .catch(() => null)) ?? []
  );
}

export async function toggleDhikrFavorite(itemId: string) {
  const favorites = await getDhikrFavorites();
  const selected = !favorites.includes(itemId);
  const next = selected
    ? [...favorites, itemId]
    : favorites.filter((id) => id !== itemId);
  await storageService.set(FAVORITES_KEY, next);
  return { selected, favorites: next };
}

export async function getDhikrProgress() {
  return storageService.get<DhikrProgress>(PROGRESS_KEY).catch(() => null);
}

export async function saveDhikrProgress(progress: DhikrProgress) {
  return storageService.set(PROGRESS_KEY, progress);
}
