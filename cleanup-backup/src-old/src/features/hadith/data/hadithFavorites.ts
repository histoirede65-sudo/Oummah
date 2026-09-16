import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "oummah.hadith.favorites.v1";

export async function loadHadithFavorites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export async function saveHadithFavorites(ids: string[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
