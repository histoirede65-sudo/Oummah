import AsyncStorage from '@react-native-async-storage/async-storage';
import { getValidSession } from '../auth/SupabaseAuthService';
import { COMMUNITY_AVATARS, type CommunityAvatar } from './tahajjudCommunity';
import { tx } from './tahajjudI18n';

/**
 * Amis OUMMAH : demandes, activité (selon les réglages de chacun), encouragements prédéfinis,
 * blocage et signalement. Pas de classement ni de comparaison.
 */

export type FriendRelation = 'none' | 'friend' | 'sent' | 'received';
export type Member = { id: string; pseudo: string; avatar: CommunityAvatar };
export type Friend = Member & {
  /** false = the friend chose not to share their nights. */
  shared: boolean;
  tonight: 'awake' | 'prayed' | null;
  /** Nights prayed over the last 7 days. */
  week: number;
};
export type Encouragement = { id: string; from: string; avatar: CommunityAvatar; kind: EncouragementKind; at: string; unread: boolean };
export type FriendsOverview = {
  friends: Friend[];
  received: Member[];
  sent: Member[];
  blocked: Member[];
  encouragements: Encouragement[];
};

export const ENCOURAGEMENTS = [
  { kind: 'wake', get text() { return tx('On se réveille pour prier cette nuit ?'); }, icon: 'alarm-outline' },
  { kind: 'ease', get text() { return tx('Qu’Allah te facilite ta nuit.'); }, icon: 'moon-outline' },
  { kind: 'dua', get text() { return tx('J’ai fait dua pour toi cette nuit.'); }, icon: 'hand-left-outline' },
  { kind: 'keep', get text() { return tx('Barak Allahou fik, continue comme ça !'); }, icon: 'heart-outline' },
  { kind: 'mashallah', get text() { return tx('Ma sha Allah, qu’Allah t’accorde la constance.'); }, icon: 'sparkles-outline' },
] as const;
export type EncouragementKind = typeof ENCOURAGEMENTS[number]['kind'];

export const encouragementText = (kind: string) => ENCOURAGEMENTS.find((item) => item.kind === kind)?.text ?? '';

const KNOWN_ERRORS = ['AUTH_REQUIRED', 'PROFILE_REQUIRED', 'NOT_FOUND', 'REQUESTS_CLOSED', 'RATE_LIMIT', 'NOT_FRIENDS', 'ALREADY_SENT', 'MESSAGES_CLOSED', 'TEXT_REFUSED', 'INVALID'];

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

const avatarOf = (value: unknown): CommunityAvatar =>
  (COMMUNITY_AVATARS as readonly string[]).includes(String(value)) ? value as CommunityAvatar : 'moon';

type RawMember = { id: string; pseudo: string; avatar: string };
const toMember = (row: RawMember): Member => ({ id: row.id, pseudo: row.pseudo, avatar: avatarOf(row.avatar) });

export async function getFriendsOverview(): Promise<FriendsOverview> {
  const raw = await rpc<{
    friends: Array<RawMember & { shared: boolean; tonight: string | null; week: number | null }>;
    received: RawMember[];
    sent: RawMember[];
    blocked: RawMember[];
    encouragements: Array<{ id: string; from: string; avatar: string; kind: string; at: string; unread: boolean }>;
  }>('friends_overview');
  return {
    friends: (raw.friends ?? []).map((row) => ({
      ...toMember(row),
      shared: row.shared,
      tonight: row.tonight === 'awake' || row.tonight === 'prayed' ? row.tonight : null,
      week: Number(row.week) || 0,
    })),
    received: (raw.received ?? []).map(toMember),
    sent: (raw.sent ?? []).map(toMember),
    blocked: (raw.blocked ?? []).map(toMember),
    encouragements: (raw.encouragements ?? [])
      .filter((row) => ENCOURAGEMENTS.some((item) => item.kind === row.kind))
      .map((row) => ({ id: row.id, from: row.from, avatar: avatarOf(row.avatar), kind: row.kind as EncouragementKind, at: row.at, unread: row.unread })),
  };
}

export async function searchMembers(query: string): Promise<Array<Member & { relation: FriendRelation }>> {
  const rows = await rpc<Array<{ user_id: string; pseudo: string; avatar: string; relation: FriendRelation }>>('friend_search', { p_query: query });
  return rows.map((row) => ({ id: row.user_id, pseudo: row.pseudo, avatar: avatarOf(row.avatar), relation: row.relation }));
}

export const requestFriend = (id: string) => rpc<FriendRelation>('friend_request', { p_user: id });
export const respondFriend = (id: string, accept: boolean) => rpc<void>('friend_respond', { p_user: id, p_accept: accept });
export const removeFriend = (id: string) => rpc<void>('friend_remove', { p_user: id });
export const blockMember = (id: string) => rpc<void>('community_block', { p_user: id });
export const unblockMember = (id: string) => rpc<void>('community_unblock', { p_user: id });
export const reportMember = (id: string, reason?: string) => rpc<void>('community_report_user', { p_user: id, p_reason: reason ?? null });
export const sendEncouragement = (id: string, kind: EncouragementKind) => rpc<void>('send_encouragement', { p_user: id, p_kind: kind });
export const markEncouragementsRead = () => rpc<void>('mark_encouragements_read');

export function friendsErrorMessage(error: unknown) {
  switch (error instanceof Error ? error.message : '') {
    case 'AUTH_REQUIRED': return tx('Connectez-vous pour retrouver vos amis.');
    case 'PROFILE_REQUIRED': return tx('Créez votre profil OUMMAH (un pseudo suffit).');
    case 'NOT_FOUND': return tx('Ce membre n’est pas disponible.');
    case 'REQUESTS_CLOSED': return tx('Ce membre n’accepte pas de demandes d’ami pour le moment.');
    case 'RATE_LIMIT': return tx('Vous avez atteint la limite pour aujourd’hui. Réessayez demain.');
    case 'NOT_FRIENDS': return tx('Vous n’êtes plus amis avec ce membre.');
    case 'MESSAGES_CLOSED': return tx('Ce membre ne reçoit pas de messages pour le moment.');
    case 'TEXT_REFUSED': return tx('Ce message contient des mots qui ne sont pas acceptés.');
    case 'ALREADY_SENT': return tx('Vous l’avez déjà encouragé il y a peu. Réessayez dans quelques heures.');
    default: return tx('Action impossible pour le moment.');
  }
}

// ----- Private messages (friends only) -------------------------------------------------------

export type ChatMessage = { id: string; body: string; mine: boolean; createdAt: string; read: boolean; pending?: boolean };
export type Conversation = { userId: string; lastBody: string; lastMine: boolean; lastAt: string; unread: number };

// ----- Conversations deleted on this phone ----------------------------------------------------
// Deleting a conversation hides it for me only: the other member keeps their messages. Everything
// written before the deletion stays hidden; a new message brings the conversation back.
const CLEARED_KEY = 'oummah.community.cleared-conversations.v1';
export const OUMMAH_CONVERSATION = 'oummah';

async function getClearedAt(): Promise<Record<string, string>> {
  try {
    return JSON.parse((await AsyncStorage.getItem(CLEARED_KEY)) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

const isAfter = (date: string, cleared?: string) => !cleared || new Date(date).getTime() > new Date(cleared).getTime();

/** Hides a conversation (a member id, or OUMMAH_CONVERSATION) up to now; its messages are marked read. */
export async function deleteConversation(id: string) {
  const cleared = await getClearedAt();
  cleared[id] = new Date().toISOString();
  await AsyncStorage.setItem(CLEARED_KEY, JSON.stringify(cleared));
  if (id === OUMMAH_CONVERSATION) await getOummahThread().catch(() => undefined);
  else await getChatThread(id).catch(() => undefined);
}

export async function getChatThread(userId: string, before?: string): Promise<ChatMessage[]> {
  const [rows, cleared] = await Promise.all([
    rpc<Array<{ id: string; body: string; mine: boolean; created_at: string; read: boolean }>>(
      'chat_thread', { p_user: userId, p_before: before ?? null, p_limit: 40 },
    ),
    getClearedAt(),
  ]);
  return rows
    .filter((row) => isAfter(row.created_at, cleared[userId]))
    .map((row) => ({ id: row.id, body: row.body, mine: row.mine, createdAt: row.created_at, read: row.read }));
}

export async function getConversations(): Promise<Conversation[]> {
  const [rows, cleared] = await Promise.all([
    rpc<Array<{ user_id: string; last_body: string; last_mine: boolean; last_at: string; unread: number }>>('chat_conversations'),
    getClearedAt(),
  ]);
  return rows
    .filter((row) => isAfter(row.last_at, cleared[row.user_id]))
    .map((row) => ({ userId: row.user_id, lastBody: row.last_body, lastMine: row.last_mine, lastAt: row.last_at, unread: Number(row.unread) || 0 }));
}

export const sendChatMessage = (userId: string, body: string) => rpc<string>('chat_send', { p_user: userId, p_body: body });
export const deleteChatMessage = (id: string) => rpc<void>('chat_delete', { p_id: id });
export const reportChatMessage = (id: string) => rpc<void>('chat_report', { p_id: id });

export const CHAT_REACTIONS = ['❤️', '👍', '🤲', '😂', '😮', '😢'] as const;
export type ChatReaction = { emoji: string; mine: boolean };

/** Reactions of the conversation, by message id (messages written at or after `since`). */
export async function getChatReactions(userId: string, since?: string): Promise<Record<string, ChatReaction[]>> {
  const rows = await rpc<Array<{ message_id: string; emoji: string; mine: boolean }>>('chat_reactions', { p_user: userId, p_since: since ?? null });
  const byMessage: Record<string, ChatReaction[]> = {};
  for (const row of rows) (byMessage[row.message_id] ??= []).push({ emoji: row.emoji, mine: row.mine });
  return byMessage;
}

/** Sets my reaction; the same emoji again (or null) removes it. */
export const reactToChatMessage = (id: string, emoji: string | null) => rpc<string | null>('chat_react', { p_id: id, p_emoji: emoji });
// ----- Messages from the OUMMAH team (read only) ---------------------------------------------

export type OummahMessage = { id: string; body: string; createdAt: string };
export type OummahSummary = { lastBody: string; lastAt: string; unread: number };

/** Opening the thread marks every OUMMAH message as read. */
export async function getOummahThread(before?: string): Promise<OummahMessage[]> {
  const [rows, cleared] = await Promise.all([
    rpc<Array<{ id: string; body: string; created_at: string }>>('oummah_thread', { p_before: before ?? null, p_limit: 40 }),
    getClearedAt(),
  ]);
  return rows
    .filter((row) => isAfter(row.created_at, cleared[OUMMAH_CONVERSATION]))
    .map((row) => ({ id: row.id, body: row.body, createdAt: row.created_at }));
}

/** null when the team has not written to this member yet. */
export async function getOummahSummary(): Promise<OummahSummary | null> {
  const [raw, cleared] = await Promise.all([
    rpc<{ lastBody: string; lastAt: string; unread: number } | null>('oummah_summary'),
    getClearedAt(),
  ]);
  if (raw && !isAfter(raw.lastAt, cleared[OUMMAH_CONVERSATION])) return null;
  return raw ? { lastBody: raw.lastBody, lastAt: raw.lastAt, unread: Number(raw.unread) || 0 } : null;
}

/** Private messages and OUMMAH messages not yet read. */
export const getChatUnreadCount = () => rpc<number>('chat_unread_count').then(Number).catch(() => 0);
