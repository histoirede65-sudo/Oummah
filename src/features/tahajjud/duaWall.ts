import { getValidSession } from '../auth/SupabaseAuthService';
import { approximateZone } from './tahajjudCommunity';
import { tx } from './tahajjudI18n';

/** Mur des duas : fil, Amine, réponses, signalements, « Allah m'a exaucé ». */

export type WallPost = {
  id: string;
  body: string;
  /** null = anonymous. */
  author: string | null;
  authorAvatar: string | null;
  answered: boolean;
  gratitude: string | null;
  ameenCount: number;
  replyCount: number;
  myAmeen: boolean;
  mine: boolean;
  pending: boolean;
  createdAt: string;
};

export type WallReply = { id: string; body: string; author: string | null; authorAvatar: string | null; mine: boolean; createdAt: string };
export type WallFilter = 'recent' | 'answered' | 'mine';

export type WallAdminItem = {
  kind: 'post' | 'reply';
  id: string;
  postId: string;
  body: string;
  author: string | null;
  anonymous: boolean;
  reportCount: number;
  status: string;
  createdAt: string;
};

function config() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('NOT_CONFIGURED');
  return { url, key };
}

const KNOWN_ERRORS = ['AUTH_REQUIRED', 'PROFILE_REQUIRED', 'TEXT_REFUSED', 'RATE_LIMIT', 'NOT_FOUND', 'ADMIN_FORBIDDEN'];

async function rpc<T>(name: string, body: object, requireAuth = true): Promise<T> {
  const { url, key } = config();
  const session = await getValidSession().catch(() => null);
  if (requireAuth && !session?.accessToken) throw new Error('AUTH_REQUIRED');
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${session?.accessToken ?? key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(KNOWN_ERRORS.find((code) => text.includes(code)) ?? 'REQUEST_FAILED');
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

type PostRow = {
  id: string; body: string; author: string | null; author_avatar: string | null; answered: boolean; gratitude: string | null;
  ameen_count: number; reply_count: number; my_ameen: boolean; mine: boolean; status: string; created_at: string;
};

function toPost(row: PostRow): WallPost {
  return {
    id: row.id,
    body: row.body,
    author: row.author,
    authorAvatar: row.author_avatar,
    answered: row.answered,
    gratitude: row.gratitude,
    ameenCount: row.ameen_count,
    replyCount: row.reply_count,
    myAmeen: row.my_ameen,
    mine: row.mine,
    pending: row.status === 'pending',
    createdAt: row.created_at,
  };
}

/** One dua (opened from the map). null when removed or hidden. */
export async function getWallPost(id: string): Promise<WallPost | null> {
  const rows = await rpc<PostRow[]>('dua_wall_post', { p_post: id }, false);
  return rows[0] ? toPost(rows[0]) : null;
}

export type DuaMapPost = { id: string; excerpt: string; answered: boolean; ameenCount: number; replyCount: number; createdAt: string };
export type DuaMapZone = { lat: number; lng: number; count: number; posts: DuaMapPost[] };

/** Zones (~28 km) where duas were shared recently, with their latest duas. */
export async function getDuaMap(days = 14): Promise<DuaMapZone[]> {
  const zones = await rpc<Array<{ lat: number; lng: number; count: number; posts: DuaMapPost[] | null }>>('dua_wall_map', { p_days: days }, false);
  return zones.map((zone) => ({ lat: Number(zone.lat), lng: Number(zone.lng), count: Number(zone.count) || 0, posts: zone.posts ?? [] }));
}

export async function getWallFeed(filter: WallFilter = 'recent', before?: string): Promise<WallPost[]> {
  const rows = await rpc<PostRow[]>('dua_wall_feed', { p_filter: filter, p_before: before ?? null, p_limit: 20 }, false);
  return rows.map(toPost);
}

export async function getWallReplies(postId: string): Promise<WallReply[]> {
  const rows = await rpc<Array<{ id: string; body: string; author: string | null; author_avatar: string | null; mine: boolean; created_at: string }>>(
    'dua_wall_replies_of', { p_post: postId }, false,
  );
  return rows.map((row) => ({ id: row.id, body: row.body, author: row.author, authorAvatar: row.author_avatar, mine: row.mine, createdAt: row.created_at }));
}

/** Publishes with an approximate zone (~28 km) for the map, when the member shares their zone. */
export async function publishDua(body: string, anonymous: boolean) {
  const zone = await approximateZone().catch(() => null);
  return rpc<string>('dua_wall_publish', { p_body: body, p_anonymous: anonymous, p_lat: zone?.lat ?? null, p_lng: zone?.lng ?? null });
}
export const setAmeen = (postId: string, on: boolean) => rpc<number>('dua_wall_ameen', { p_post: postId, p_on: on });
export const replyToDua = (postId: string, body: string) => rpc<string>('dua_wall_reply', { p_post: postId, p_body: body });
export const reportWall = (type: 'post' | 'reply', id: string, reason?: string) => rpc<void>('dua_wall_report', { p_type: type, p_id: id, p_reason: reason ?? null });
export const deleteWall = (type: 'post' | 'reply', id: string) => rpc<void>('dua_wall_delete', { p_type: type, p_id: id });
export const markAnswered = (postId: string, gratitude?: string) => rpc<void>('dua_wall_mark_answered', { p_post: postId, p_gratitude: gratitude?.trim() || null });

export async function adminListWall(): Promise<WallAdminItem[]> {
  const rows = await rpc<Array<{ kind: string; id: string; post_id: string; body: string; author: string | null; anonymous: boolean; report_count: number; status: string; created_at: string }>>('admin_list_dua_wall', {});
  return rows.map((row) => ({
    kind: row.kind === 'reply' ? 'reply' : 'post',
    id: row.id, postId: row.post_id, body: row.body, author: row.author, anonymous: row.anonymous,
    reportCount: row.report_count, status: row.status, createdAt: row.created_at,
  }));
}

export const adminReviewWall = (kind: 'post' | 'reply', id: string, approve: boolean) =>
  rpc<void>('admin_review_dua_wall', { p_kind: kind, p_id: id, p_approve: approve });

export function wallErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  switch (code) {
    case 'AUTH_REQUIRED': return tx('Connectez-vous pour participer au Mur des duas.');
    case 'PROFILE_REQUIRED': return tx('Créez votre profil OUMMAH (un pseudo suffit) pour participer.');
    case 'TEXT_REFUSED': return tx('Ce texte contient des mots qui ne sont pas acceptés sur le Mur des duas.');
    case 'RATE_LIMIT': return tx('Vous avez atteint la limite pour aujourd’hui. Réessayez demain.');
    case 'NOT_FOUND': return tx('Cette doua n’est plus disponible.');
    default: return tx('Action impossible pour le moment.');
  }
}

export function timeAgo(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (minutes < 60) return tx("il y a {0} min", [minutes]);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'hier' : tx("il y a {0} jours", [days]);
}
