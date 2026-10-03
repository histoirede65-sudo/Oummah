import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { getValidSession } from '../auth/SupabaseAuthService';
import { getMainMosque } from '../mosques/data/mosquePreferences';

/**
 * Communauté Tahajjud : profil OUMMAH (pseudo), déclaration volontaire « Je suis réveillé », et
 * « La Oummah cette nuit » (compteur + zones). Jamais de position précise : le téléphone arrondit déjà
 * à ~28 km, le serveur arrondit de nouveau et n'affiche une zone qu'à partir de 3 personnes.
 */

export const COMMUNITY_AVATARS = ['moon', 'star', 'sparkles', 'leaf', 'water', 'flame', 'sunny', 'heart'] as const;
export type CommunityAvatar = typeof COMMUNITY_AVATARS[number];

export type CommunityProfile = {
  pseudo: string;
  avatar: CommunityAvatar;
  shareTahajjud: boolean;
  shareZone: boolean;
};

export type LiveZone = { lat: number; lng: number; count: number };
export type TahajjudLive = { awake: number; prayed: number; zones: LiveZone[]; generatedAt: string };
export type PresenceStatus = 'awake' | 'prayed';

/** Below this many members awake, the map stays off (a near-empty map says the opposite). */
export const MAP_THRESHOLD = 20;

const PROFILE_CACHE_KEY = 'oummah.tahajjud.community-profile.v1';

function config() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('NOT_CONFIGURED');
  return { url, key };
}

async function request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { url, key } = config();
  let token = key;
  if (init.auth !== false) {
    const session = await getValidSession().catch(() => null);
    if (!session?.accessToken) throw new Error('AUTH_REQUIRED');
    token = session.accessToken;
  }
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await response.text();
  if (!response.ok) {
    if (text.includes('23505') || text.includes('community_profiles_pseudo_idx')) throw new Error('PSEUDO_TAKEN');
    if (text.includes('PROFILE_REQUIRED')) throw new Error('PROFILE_REQUIRED');
    if (text.includes('AUTH_REQUIRED')) throw new Error('AUTH_REQUIRED');
    throw new Error('REQUEST_FAILED');
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function isSignedIn() {
  return Boolean((await getValidSession().catch(() => null))?.accessToken);
}

// ----- Profile -------------------------------------------------------------------------------

type ProfileRow = { pseudo: string; avatar: string; share_tahajjud: boolean; share_zone: boolean };

function toProfile(row: ProfileRow): CommunityProfile {
  return {
    pseudo: row.pseudo,
    avatar: (COMMUNITY_AVATARS as readonly string[]).includes(row.avatar) ? row.avatar as CommunityAvatar : 'moon',
    shareTahajjud: row.share_tahajjud,
    shareZone: row.share_zone,
  };
}

/** The signed-in user's community profile, or null (none yet / signed out). */
export async function getCommunityProfile(): Promise<CommunityProfile | null> {
  const session = await getValidSession().catch(() => null);
  if (!session?.accessToken) return null;
  try {
    const rows = await request<ProfileRow[]>(`community_profiles?user_id=eq.${session.user.id}&select=pseudo,avatar,share_tahajjud,share_zone`);
    const profile = rows[0] ? toProfile(rows[0]) : null;
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile)).catch(() => undefined);
    return profile;
  } catch {
    // Offline: last known profile.
    try {
      return JSON.parse((await AsyncStorage.getItem(PROFILE_CACHE_KEY)) ?? 'null') as CommunityProfile | null;
    } catch {
      return null;
    }
  }
}

export async function saveCommunityProfile(profile: CommunityProfile): Promise<CommunityProfile> {
  const session = await getValidSession().catch(() => null);
  if (!session?.accessToken) throw new Error('AUTH_REQUIRED');
  const pseudo = profile.pseudo.trim().replace(/\s+/g, ' ');
  if (!/^[\p{L}\p{N} _.'’-]{3,24}$/u.test(pseudo)) throw new Error('PSEUDO_INVALID');
  const rows = await request<ProfileRow[]>('community_profiles?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      user_id: session.user.id,
      pseudo,
      avatar: profile.avatar,
      share_tahajjud: profile.shareTahajjud,
      share_zone: profile.shareZone,
      updated_at: new Date().toISOString(),
    }),
  });
  const saved = rows[0] ? toProfile(rows[0]) : { ...profile, pseudo };
  await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(saved)).catch(() => undefined);
  return saved;
}

// ----- Presence ------------------------------------------------------------------------------

/** Approximate zone, rounded on the phone (~28 km): never the precise position. */
async function approximateZone(): Promise<{ lat: number; lng: number } | null> {
  const round = (value: number) => Math.round(value * 4) / 4;
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.granted) {
      const position = await Location.getLastKnownPositionAsync({ maxAge: 24 * 3_600_000 });
      if (position) return { lat: round(position.coords.latitude), lng: round(position.coords.longitude) };
    }
  } catch {
    // Falls back to the main mosque.
  }
  const mosque = await getMainMosque().catch(() => null);
  return mosque ? { lat: round(mosque.latitude), lng: round(mosque.longitude) } : null;
}

export async function declareTahajjud(night: string, status: PresenceStatus) {
  const zone = await approximateZone();
  await request('rpc/declare_tahajjud', {
    method: 'POST',
    body: JSON.stringify({ p_night: night, p_status: status, p_lat: zone?.lat ?? null, p_lng: zone?.lng ?? null }),
  });
}

export async function withdrawTahajjud(night: string) {
  await request('rpc/withdraw_tahajjud', { method: 'POST', body: JSON.stringify({ p_night: night }) });
}

export async function getMyPresence(night: string): Promise<PresenceStatus | null> {
  if (!(await isSignedIn())) return null;
  const status = await request<string | null>('rpc/my_tahajjud_presence', { method: 'POST', body: JSON.stringify({ p_night: night }) }).catch(() => null);
  return status === 'awake' || status === 'prayed' ? status : null;
}

/** After « J'ai prié » : counted in the community when the member chose to appear. Silent otherwise. */
export async function shareValidationWithCommunity(night: string) {
  const profile = await getCommunityProfile();
  if (!profile?.shareTahajjud) return;
  await declareTahajjud(night, 'prayed').catch(() => undefined);
}

// ----- Live ----------------------------------------------------------------------------------

export async function getTahajjudLive(): Promise<TahajjudLive> {
  const live = await request<TahajjudLive>('rpc/tahajjud_live', { method: 'POST', body: '{}', auth: false });
  return {
    awake: Number(live.awake) || 0,
    prayed: Number(live.prayed) || 0,
    zones: (live.zones ?? []).map((zone) => ({ lat: Number(zone.lat), lng: Number(zone.lng), count: Number(zone.count) })),
    generatedAt: live.generatedAt,
  };
}
