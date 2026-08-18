import { storageService } from "../../core/storage";

const FAVORITES_KEY = "oummah.dua.favorites.v1";
const PROGRESS_KEY = "oummah.dua.progress.v1";

export type DuaProgress = {
  categoryId: number;
  itemIndex: number;
  counters: Record<string, number>;
  updatedAt: number;
};

export async function getDuaFavorites() {
  return (
    (await storageService
      .get<readonly string[]>(FAVORITES_KEY)
      .catch(() => null)) ?? []
  );
}

export async function toggleDuaFavorite(itemId: string) {
  const favorites = await getDuaFavorites();
  const selected = !favorites.includes(itemId);
  const next = selected
    ? [...favorites, itemId]
    : favorites.filter((id) => id !== itemId);
  await storageService.set(FAVORITES_KEY, next);
  return { selected, favorites: next };
}

export async function getDuaProgress() {
  return storageService.get<DuaProgress>(PROGRESS_KEY).catch(() => null);
}

export async function saveDuaProgress(progress: DuaProgress) {
  return storageService.set(PROGRESS_KEY, progress);
}
