import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Identifiant OUMMAH unique d'une mosquée (table public.mosques). Une même mosquée trouvée via
 * OpenStreetMap, Google, islamic.app ou ajoutée par un utilisateur a des identifiants de source
 * différents : resolve_mosque les rattache à la même ligne (même identifiant, ou même bâtiment).
 */

type MosqueLocator = { id: string; name: string; address?: string; latitude: number; longitude: number };

const CACHE_KEY = 'oummah.mosques.identity.v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let memory: Record<string, string> | null = null;
const inflight = new Map<string, Promise<string | null>>();

function config() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

async function readCache() {
  if (memory) return memory;
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(CACHE_KEY)) ?? '{}') as unknown;
    memory = parsed && typeof parsed === 'object' ? parsed as Record<string, string> : {};
  } catch {
    memory = {};
  }
  return memory;
}

async function remember(externalId: string, mosqueId: string) {
  const cache = await readCache();
  if (cache[externalId] === mosqueId) return;
  cache[externalId] = mosqueId;
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache)).catch(() => undefined);
}

/** OUMMAH id of a mosque, or null offline / not configured. Never throws. */
export async function resolveMosqueId(mosque: MosqueLocator): Promise<string | null> {
  const cached = (await readCache())[mosque.id];
  if (cached) return cached;
  const pending = inflight.get(mosque.id);
  if (pending) return pending;
  const task = (async () => {
    const supabase = config();
    if (!supabase || !Number.isFinite(mosque.latitude) || !Number.isFinite(mosque.longitude)) return null;
    try {
      const response = await fetch(`${supabase.url}/rest/v1/rpc/resolve_mosque`, {
        method: 'POST',
        headers: { apikey: supabase.key, Authorization: `Bearer ${supabase.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_external_id: mosque.id, p_name: mosque.name, p_address: mosque.address ?? null, p_latitude: mosque.latitude, p_longitude: mosque.longitude }),
      });
      if (!response.ok) return null;
      const mosqueId = await response.json() as unknown;
      if (typeof mosqueId !== 'string' || !UUID.test(mosqueId)) return null;
      await remember(mosque.id, mosqueId);
      return mosqueId;
    } catch {
      return null;
    }
  })();
  inflight.set(mosque.id, task);
  try {
    return await task;
  } finally {
    inflight.delete(mosque.id);
  }
}
