import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NearbyMosque } from './nearbyMosques';

export type CachedMosqueSearch = {
  latitude: number;
  longitude: number;
  createdAt: number;
  mosques: NearbyMosque[];
};

const CACHE_KEY = 'oummah.mosques.search.v5';
const OLD_CACHE_KEYS = [
  'oummah.mosques.search.v1',
  'oummah.mosques.search.v2',
  'oummah.mosques.search.v3',
  'oummah.mosques.search.v4',
];
const CACHE_MAX_AGE_MS = 45 * 60 * 1000;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNearbyMosque(value: unknown): value is NearbyMosque {
  if (!value || typeof value !== 'object') return false;

  const mosque = value as Partial<NearbyMosque>;

  return (
    typeof mosque.id === 'string' &&
    typeof mosque.name === 'string' &&
    typeof mosque.address === 'string' &&
    isFiniteNumber(mosque.latitude) &&
    isFiniteNumber(mosque.longitude) &&
    isFiniteNumber(mosque.distanceMeters) &&
    typeof mosque.distanceLabel === 'string' &&
    typeof mosque.walkingTimeLabel === 'string'
  );
}

export async function readMosqueSearchCache(): Promise<CachedMosqueSearch | null> {
  const rawValue = await AsyncStorage.getItem(CACHE_KEY);

  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<CachedMosqueSearch>;

    if (
      !isFiniteNumber(parsed.latitude) ||
      !isFiniteNumber(parsed.longitude) ||
      !isFiniteNumber(parsed.createdAt) ||
      !Array.isArray(parsed.mosques)
    ) {
      return null;
    }

    const mosques = parsed.mosques.filter(isNearbyMosque);

    if (mosques.length === 0) return null;

    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      createdAt: parsed.createdAt,
      mosques,
    };
  } catch {
    return null;
  }
}

export async function writeMosqueSearchCache(
  cache: CachedMosqueSearch,
): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  await AsyncStorage.multiRemove(OLD_CACHE_KEYS);
}

export function isMosqueSearchCacheFresh(cache: CachedMosqueSearch) {
  return Date.now() - cache.createdAt <= CACHE_MAX_AGE_MS;
}

export async function clearMosqueSearchCache(): Promise<void> {
  await AsyncStorage.multiRemove([CACHE_KEY, ...OLD_CACHE_KEYS]);
}
