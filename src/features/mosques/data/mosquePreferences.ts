import AsyncStorage from '@react-native-async-storage/async-storage';
import { getValidSession } from '../../auth/SupabaseAuthService';
import { resolveMosqueId } from './mosqueIdentity';
import { setPrayerScheduleSource } from './mosquePrayerTimes';

export type StoredMosque = {
  id: string;
  /** OUMMAH id (public.mosques), shared by every source of the same mosque. */
  mosqueId?: string;
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
  source?: 'openstreetmap' | 'user';
  imageKey?: string;
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

/** Same mosque, whatever the source it was saved from. */
function sameMosque(first: StoredMosque, second: StoredMosque) {
  return first.id === second.id || Boolean(first.mosqueId && first.mosqueId === second.mosqueId);
}

async function writeFavorites(favorites: StoredMosque[]) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
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
  return favorites.some((mosque) => mosque.id === id || mosque.mosqueId === id);
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
  const mosqueId = mosque.mosqueId ?? await resolveMosqueId(mosque) ?? undefined;
  const withId: StoredMosque = { ...mosque, mosqueId };
  const favorites = await getFavoriteMosques();
  const favoritesWithoutMosque = favorites.filter(
    (storedMosque) => !sameMosque(storedMosque, withId),
  );

  await writeFavorites(favorite ? [withId, ...favoritesWithoutMosque] : favoritesWithoutMosque);
  void pushFavorite(withId, favorite);
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
  const mosqueId = mosque.mosqueId ?? await resolveMosqueId(mosque) ?? undefined;
  const withId: StoredMosque = { ...mosque, mosqueId };
  await Promise.all([
    AsyncStorage.setItem(MAIN_MOSQUE_KEY, JSON.stringify(withId)),
    setPrayerScheduleSource('mosque'),
  ]);
  void pushMain(withId);
}

export async function clearMainMosque() {
  await AsyncStorage.removeItem(MAIN_MOSQUE_KEY);
  void pushMain(null);
}

export async function isMainMosque(id: string) {
  const mainMosque = await getMainMosque();
  return mainMosque?.id === id || mainMosque?.mosqueId === id;
}

// ---------------------------------------------------------------------------------------------
// Account sync: favorites and main mosque follow the user to a new phone. The phone keeps a local
// copy (works offline and without an account); every change is also sent to the account.

type RemoteFavorite = { mosque_id: string; is_main: boolean; is_favorite: boolean; snapshot: unknown };

async function accountRequest(path: string, init: RequestInit = {}): Promise<Response | null> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const session = await getValidSession().catch(() => null);
  if (!url || !key || !session?.accessToken) return null;
  try {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: key, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers ?? {}) },
    });
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

function snapshotOf(mosque: StoredMosque) {
  const { distanceLabel: _distance, ...snapshot } = mosque;
  return snapshot;
}

async function upsertRemote(row: Partial<RemoteFavorite> & { mosque_id: string }) {
  return accountRequest('user_mosque_favorites?on_conflict=user_id,mosque_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(row),
  });
}

async function removeUnusedRemoteRows() {
  await accountRequest('user_mosque_favorites?is_favorite=eq.false&is_main=eq.false', { method: 'DELETE' });
}

async function pushFavorite(mosque: StoredMosque, favorite: boolean) {
  if (!mosque.mosqueId) return;
  await upsertRemote({ mosque_id: mosque.mosqueId, is_favorite: favorite, snapshot: snapshotOf(mosque) });
  if (!favorite) await removeUnusedRemoteRows();
}

async function pushMain(mosque: StoredMosque | null) {
  // One main mosque per account (unique index): clear the previous one first.
  await accountRequest('user_mosque_favorites?is_main=eq.true', { method: 'PATCH', body: JSON.stringify({ is_main: false }) });
  if (mosque?.mosqueId) await upsertRemote({ mosque_id: mosque.mosqueId, is_main: true, snapshot: snapshotOf(mosque) });
  await removeUnusedRemoteRows();
}

let syncInFlight: Promise<boolean> | null = null;

/**
 * Merges the phone's favorites with the account's (union, one entry per mosque) and restores the
 * main mosque on a new phone. Returns true when the local list changed. Silent when logged out.
 */
export function syncMosqueFavorites(): Promise<boolean> {
  syncInFlight ??= (async () => {
    const response = await accountRequest('user_mosque_favorites?select=mosque_id,is_main,is_favorite,snapshot');
    if (!response) return false;
    const remote = (await response.json().catch(() => [])) as RemoteFavorite[];

    // Local entries saved before identities existed get their OUMMAH id now.
    const local: StoredMosque[] = [];
    for (const mosque of await getFavoriteMosques()) {
      const mosqueId = mosque.mosqueId ?? await resolveMosqueId(mosque) ?? undefined;
      const withId = { ...mosque, mosqueId };
      if (!local.some((existing) => sameMosque(existing, withId))) local.push(withId);
    }

    const remoteFavorites = remote
      .filter((row) => row.is_favorite && isStoredMosque(row.snapshot))
      .map((row) => ({ ...(row.snapshot as StoredMosque), mosqueId: row.mosque_id }));
    const merged = [...local, ...remoteFavorites.filter((mosque) => !local.some((existing) => sameMosque(existing, mosque)))];

    for (const mosque of local) {
      if (mosque.mosqueId && !remote.some((row) => row.mosque_id === mosque.mosqueId && row.is_favorite)) {
        await upsertRemote({ mosque_id: mosque.mosqueId, is_favorite: true, snapshot: snapshotOf(mosque) });
      }
    }

    const before = JSON.stringify(await getFavoriteMosques());
    await writeFavorites(merged);

    const localMain = await getMainMosque();
    const remoteMain = remote.find((row) => row.is_main && isStoredMosque(row.snapshot));
    let mainChanged = false;
    if (localMain) {
      const mosqueId = localMain.mosqueId ?? await resolveMosqueId(localMain) ?? undefined;
      if (mosqueId && remoteMain?.mosque_id !== mosqueId) await pushMain({ ...localMain, mosqueId });
      if (mosqueId && !localMain.mosqueId) await AsyncStorage.setItem(MAIN_MOSQUE_KEY, JSON.stringify({ ...localMain, mosqueId }));
    } else if (remoteMain) {
      await Promise.all([
        AsyncStorage.setItem(MAIN_MOSQUE_KEY, JSON.stringify({ ...(remoteMain.snapshot as StoredMosque), mosqueId: remoteMain.mosque_id })),
        setPrayerScheduleSource('mosque'),
      ]);
      mainChanged = true;
    }

    return mainChanged || before !== JSON.stringify(merged);
  })().finally(() => { syncInFlight = null; });
  return syncInFlight;
}
