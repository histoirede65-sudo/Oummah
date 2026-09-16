import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'oummah:muslim-names:favorites:v1';
const HISTORY_KEY = 'oummah:muslim-names:history:v1';
const HISTORY_LIMIT = 20;

function parseIds(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function loadNameFavorites() {
  return parseIds(await AsyncStorage.getItem(FAVORITES_KEY).catch(() => null));
}

export async function toggleNameFavorite(id: string) {
  const current = await loadNameFavorites();
  const exists = current.includes(id);
  const next = exists ? current.filter((item) => item !== id) : [id, ...current];
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export async function loadNameHistory() {
  return parseIds(await AsyncStorage.getItem(HISTORY_KEY).catch(() => null));
}

export async function addNameToHistory(id: string) {
  const current = await loadNameHistory();
  const next = [id, ...current.filter((item) => item !== id)].slice(0, HISTORY_LIMIT);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}
