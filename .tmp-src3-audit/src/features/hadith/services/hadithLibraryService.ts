import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Hadith } from "../domain/Hadith";

const FAVORITES_KEY = "oumma:hadith:favorites:v1";
const HISTORY_KEY = "oumma:hadith:history:v1";

export type HadithLibraryEntry = Pick<Hadith, "id" | "title" | "grade" | "reference"> & { savedAt: number };

async function load(key: string): Promise<HadithLibraryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as HadithLibraryEntry[]) : [];
  } catch {
    return [];
  }
}

function entry(hadith: Hadith): HadithLibraryEntry {
  return { id: hadith.id, title: hadith.title, grade: hadith.grade, reference: hadith.reference, savedAt: Date.now() };
}

export const hadithLibraryService = {
  favorites: () => load(FAVORITES_KEY),
  history: () => load(HISTORY_KEY),
  async isFavorite(id: string) {
    return (await load(FAVORITES_KEY)).some((item) => item.id === id);
  },
  async toggleFavorite(hadith: Hadith) {
    const current = await load(FAVORITES_KEY);
    const exists = current.some((item) => item.id === hadith.id);
    const next = exists ? current.filter((item) => item.id !== hadith.id) : [entry(hadith), ...current];
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    return !exists;
  },
  async markRead(hadith: Hadith) {
    const current = await load(HISTORY_KEY);
    const next = [entry(hadith), ...current.filter((item) => item.id !== hadith.id)].slice(0, 80);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  },
};
