import type { Href } from 'expo-router';
import { router } from 'expo-router';
import type { Region } from 'react-native-maps';
import type { LanguageCode, TranslationKey } from '../../i18n';
import type { MosquePost } from './data/mosquePosts';
import type { StoredMosque } from './data/mosquePreferences';
import type { NearbyMosque } from './data/nearbyMosques';
import type { UserMosque } from './data/userMosques';

/** Constants and helpers of the Mosquées screen (src/app/mosques.tsx). */

type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

export type UserCoordinates = {
  latitude: number;
  longitude: number;
};

export const MOSQUE_RENDER_BATCH_SIZE = 24;
export const SAME_ZONE_MAX_DISTANCE_METERS = 3_000;

export type DisplayMosque = Omit<
  NearbyMosque,
  'source' | 'serviceTimes' | 'lastCheckedAt'
> & {
  source: 'openstreetmap' | 'islamic_app' | 'google' | 'user';
  serviceTimes?: string | string[];
  lastCheckedAt?: string;
  imageKey?: string;
};

export function distanceBetween(
  first: UserCoordinates,
  second: UserCoordinates,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(distanceMeters: number, language: LanguageCode = 'fr') {
  if (distanceMeters < 1_000) return `${Math.max(1, Math.round(distanceMeters))} m`;
  const kilometers = (distanceMeters / 1_000).toFixed(distanceMeters < 10_000 ? 1 : 0);
  return `${language === 'fr' ? kilometers.replace('.', ',') : kilometers} km`;
}

/** Minutes de marche, à 80 m par minute. */
export function walkingMinutes(distanceMeters: number) {
  return Math.max(1, Math.round(distanceMeters / 80));
}

export function normalizeMosqueName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .trim();
}

export function namesLookSimilar(first: string, second: string) {
  const left = normalizeMosqueName(first);
  const right = normalizeMosqueName(second);
  return left === right || left.includes(right) || right.includes(left);
}

export function userMosqueToDisplay(
  mosque: UserMosque,
  userCoordinates: UserCoordinates | null,
  language: LanguageCode,
  t: Translate,
): DisplayMosque {
  const distanceMeters = userCoordinates
    ? distanceBetween(userCoordinates, {
        latitude: mosque.latitude,
        longitude: mosque.longitude,
      })
    : null;

  return {
    id: mosque.id,
    name: mosque.name,
    alternativeName: mosque.alternativeName,
    arabicName: mosque.arabicName,
    address: mosque.address,
    latitude: mosque.latitude,
    longitude: mosque.longitude,
    distanceMeters: distanceMeters ?? 0,
    distanceLabel:
      distanceMeters === null
        ? t('mosques.distanceUnavailable')
        : formatDistance(distanceMeters, language),
    walkingTimeLabel:
      distanceMeters === null
        ? '—'
        : t('mosques.walkMinutes', { count: walkingMinutes(distanceMeters) }),
    phone: mosque.phone,
    email: mosque.email,
    website: mosque.website,
    openingHours: mosque.openingHours,
    operator: mosque.operator,
    denomination: mosque.denomination,
    wheelchair: mosque.wheelchair,
    womenSpace: mosque.womenSpace,
    ablutions: mosque.ablutions,
    parking: mosque.parking,
    toilets: mosque.toilets,
    languages: mosque.languages,
    serviceTimes: mosque.serviceTimes,
    source: 'user',
    imageKey: mosque.imageKey,
  };
}

export const INITIAL_REGION: Region = {
  latitude: 46.603354,
  longitude: 1.888334,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

export function getLocationErrorMessage(error: unknown, t: Translate) {
  if (error instanceof Error && error.message.startsWith('OVERPASS_')) {
    return t('mosques.serviceUnavailable');
  }

  return t('mosques.searchError');
}

export function openMosqueDetails(mosque: DisplayMosque) {
  router.push({
    pathname: '/mosque/[id]',
    params: {
      id: mosque.id,
      name: mosque.name,
      address: mosque.address,
      latitude: String(mosque.latitude),
      longitude: String(mosque.longitude),
      distance: mosque.distanceLabel,
      phone: mosque.phone ?? '',
      website: mosque.website ?? '',
      openingHours: mosque.openingHours ?? '',
      alternativeName: mosque.alternativeName ?? '',
      arabicName: mosque.arabicName ?? '',
      email: mosque.email ?? '',
      operator: mosque.operator ?? '',
      denomination: mosque.denomination ?? '',
      wheelchair: mosque.wheelchair ?? 'unknown',
      womenSpace: mosque.womenSpace ?? 'unknown',
      ablutions: mosque.ablutions ?? 'unknown',
      parking: mosque.parking ?? 'unknown',
      toilets: mosque.toilets ?? 'unknown',
      languages: JSON.stringify(mosque.languages ?? []),
       serviceTimes: Array.isArray(mosque.serviceTimes)
         ? JSON.stringify(mosque.serviceTimes)
         : mosque.serviceTimes ?? '',
      source: mosque.source,
      imageKey: mosque.imageKey ?? '',
      sourceUrl: mosque.sourceUrl ?? '',
      lastCheckedAt: mosque.lastCheckedAt,
    },
  } as Href);
}

export function openStoredMosque(mosque: StoredMosque) {
  router.push({
    pathname: '/mosque/[id]',
    params: {
      id: mosque.id,
      name: mosque.name,
      address: mosque.address,
      latitude: String(mosque.latitude),
      longitude: String(mosque.longitude),
      distance: mosque.distanceLabel ?? '',
      phone: mosque.phone ?? '',
      website: mosque.website ?? '',
      openingHours: mosque.openingHours ?? '',
      source: mosque.source ?? '',
      imageKey: mosque.imageKey ?? '',
    },
  } as Href);
}

export function formatEventMoment(post: MosquePost, language: LanguageCode, t: Translate) {
  if (!post.startsAt) return '';
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const start = new Date(post.startsAt);
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const day = start.toDateString() === today.toDateString()
    ? t('mosques.today')
    : start.toDateString() === tomorrow.toDateString()
      ? t('mosques.tomorrow')
      : start.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  return t('mosques.eventMoment', {
    day,
    time: start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
  });
}
