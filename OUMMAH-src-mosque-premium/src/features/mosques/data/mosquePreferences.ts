import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredMosque = {
  id: string;
  name: string;
  alternativeName?: string;
  arabicName?: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceLabel?: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  operator?: string;
  denomination?: string;
  wheelchair?: 'yes' | 'no' | 'limited' | 'unknown';
  womenSpace?: 'yes' | 'no' | 'limited' | 'unknown';
  ablutions?: 'yes' | 'no' | 'limited' | 'unknown';
  parking?: 'yes' | 'no' | 'limited' | 'unknown';
  toilets?: 'yes' | 'no' | 'limited' | 'unknown';
  languages?: string[];
  serviceTimes?: string;
  source?: 'openstreetmap';
  sourceUrl?: string;
  lastCheckedAt?: string;
};

const FAVORITES_KEY = 'oummah.mosques.favorites.v1';
const MAIN_MOSQUE_KEY = 'oummah.mosques.main.v1';

function isStoredMosque(value: unknown): value is StoredMosque {
  if (!value || typeof value !== 'object') return false;

  const mosque = value as Partial<StoredMosque>;

  return (
    typeof mosque.id === 'string' &&
    typeof mosque.name === 'string' &&
    typeof mosque.address === 'string' &&
    typeof mosque.latitude === 'number' &&
    typeof mosque.longitude === 'number'
  );
}

export async function getFavoriteMosques(): Promise<StoredMosque[]> {
  const rawValue = await AsyncStorage.getItem(FAVORITES_KEY);

  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isStoredMosque);
  } catch {
    return [];
  }
}

export async function isFavoriteMosque(id: string) {
  const favorites = await getFavoriteMosques();
  return favorites.some((mosque) => mosque.id === id);
}

export async function toggleFavoriteMosque(
  mosque: StoredMosque,
): Promise<boolean> {
  const alreadyFavorite = await isFavoriteMosque(mosque.id);

  await setMosqueFavorite(mosque, !alreadyFavorite);

  return !alreadyFavorite;
}

export async function setMosqueFavorite(
  mosque: StoredMosque,
  favorite: boolean,
): Promise<void> {
  const favorites = await getFavoriteMosques();
  const favoritesWithoutMosque = favorites.filter(
    (storedMosque) => storedMosque.id !== mosque.id,
  );

  const nextFavorites = favorite
    ? [mosque, ...favoritesWithoutMosque]
    : favoritesWithoutMosque;

  await AsyncStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(nextFavorites),
  );

}

export async function getMainMosque(): Promise<StoredMosque | null> {
  const rawValue = await AsyncStorage.getItem(MAIN_MOSQUE_KEY);

  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return isStoredMosque(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function setMainMosque(mosque: StoredMosque) {
  await AsyncStorage.setItem(
    MAIN_MOSQUE_KEY,
    JSON.stringify(mosque),
  );
}

export async function isMainMosque(id: string) {
  const mainMosque = await getMainMosque();
  return mainMosque?.id === id;
}
