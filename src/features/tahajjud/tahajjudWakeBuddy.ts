import { getValidSession } from '../auth/SupabaseAuthService';
import { COMMUNITY_AVATARS, type CommunityAvatar } from './tahajjudCommunity';

/** Binôme de réveil : « réveillez-moi cette nuit », et réveiller ceux qui comptent sur moi. */

export type MyWakeRequest = { id: string; targets: number; wakeAt: string | null; wokenBy: string | null; wokenAt: string | null };
export type WakeRequestForMe = { id: string; pseudo: string; avatar: CommunityAvatar; wakeAt: string | null; woken: boolean; wokenByMe: boolean };

const KNOWN_ERRORS = ['AUTH_REQUIRED', 'PROFILE_REQUIRED', 'NOT_MEMBER', 'NO_TARGET', 'NOT_FOUND', 'INVALID'];

async function rpc<T>(name: string, body: object = {}): Promise<T> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('NOT_CONFIGURED');
  const session = await getValidSession().catch(() => null);
  if (!session?.accessToken) throw new Error('AUTH_REQUIRED');
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(KNOWN_ERRORS.find((code) => text.includes(code)) ?? 'REQUEST_FAILED');
  return (text ? JSON.parse(text) : undefined) as T;
}

export const requestWakeUp = (night: string, users: string[], group: string | null, wakeAt: Date | null) =>
  rpc<number>('wake_request_create', { p_night: night, p_users: users, p_group: group, p_wake_at: wakeAt ? wakeAt.toISOString() : null });

export const cancelWakeRequest = (night: string) => rpc<void>('wake_request_cancel', { p_night: night });

export async function getMyWakeRequest(night: string): Promise<MyWakeRequest | null> {
  const raw = await rpc<MyWakeRequest | null>('wake_request_mine', { p_night: night });
  return raw ? { ...raw, targets: Number(raw.targets) || 0 } : null;
}

export async function getWakeRequestsForMe(): Promise<WakeRequestForMe[]> {
  const rows = await rpc<Array<{ id: string; pseudo: string; avatar: string; wake_at: string | null; woken: boolean; woken_by_me: boolean }>>('wake_requests_for_me');
  return rows.map((row) => ({
    id: row.id,
    pseudo: row.pseudo,
    avatar: (COMMUNITY_AVATARS as readonly string[]).includes(row.avatar) ? row.avatar as CommunityAvatar : 'moon',
    wakeAt: row.wake_at,
    woken: row.woken,
    wokenByMe: row.woken_by_me,
  }));
}

/** Returns the pseudo of whoever already woke them, or null when my wake-up was sent. */
export const sendWakeUp = (requestId: string) => rpc<string | null>('wake_send', { p_request: requestId });

export function wakeErrorMessage(error: unknown) {
  switch (error instanceof Error ? error.message : '') {
    case 'AUTH_REQUIRED': return 'Connectez-vous pour utiliser le binôme de réveil.';
    case 'PROFILE_REQUIRED': return 'Créez votre profil OUMMAH (un pseudo suffit).';
    case 'NO_TARGET': return 'Choisissez au moins un ami.';
    case 'NOT_FOUND': return 'Cette demande n’est plus disponible.';
    default: return 'Action impossible pour le moment.';
  }
}
