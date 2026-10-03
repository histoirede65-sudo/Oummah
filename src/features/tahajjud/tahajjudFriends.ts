import { getValidSession } from '../auth/SupabaseAuthService';
import { COMMUNITY_AVATARS, type CommunityAvatar } from './tahajjudCommunity';

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
  { kind: 'wake', text: 'On se réveille pour prier cette nuit ?', icon: 'alarm-outline' },
  { kind: 'ease', text: 'Qu’Allah te facilite ta nuit.', icon: 'moon-outline' },
  { kind: 'dua', text: 'J’ai fait doua pour toi cette nuit.', icon: 'hand-left-outline' },
  { kind: 'keep', text: 'Barak Allahou fik, continue comme ça !', icon: 'heart-outline' },
  { kind: 'mashallah', text: 'Ma sha Allah, qu’Allah t’accorde la constance.', icon: 'sparkles-outline' },
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
    case 'AUTH_REQUIRED': return 'Connectez-vous pour retrouver vos amis.';
    case 'PROFILE_REQUIRED': return 'Créez votre profil OUMMAH (un pseudo suffit).';
    case 'NOT_FOUND': return 'Ce membre n’est pas disponible.';
    case 'REQUESTS_CLOSED': return 'Ce membre n’accepte pas de demandes d’ami pour le moment.';
    case 'RATE_LIMIT': return 'Vous avez atteint la limite pour aujourd’hui. Réessayez demain.';
    case 'NOT_FRIENDS': return 'Vous n’êtes plus amis avec ce membre.';
    case 'MESSAGES_CLOSED': return 'Ce membre ne reçoit pas de messages pour le moment.';
    case 'TEXT_REFUSED': return 'Ce message contient des mots qui ne sont pas acceptés.';
    case 'ALREADY_SENT': return 'Vous l’avez déjà encouragé il y a peu. Réessayez dans quelques heures.';
    default: return 'Action impossible pour le moment.';
  }
}

// ----- Private messages (friends only) -------------------------------------------------------

export type ChatMessage = { id: string; body: string; mine: boolean; createdAt: string; read: boolean; pending?: boolean };
export type Conversation = { userId: string; lastBody: string; lastMine: boolean; lastAt: string; unread: number };

export async function getChatThread(userId: string, before?: string): Promise<ChatMessage[]> {
  const rows = await rpc<Array<{ id: string; body: string; mine: boolean; created_at: string; read: boolean }>>(
    'chat_thread', { p_user: userId, p_before: before ?? null, p_limit: 40 },
  );
  return rows.map((row) => ({ id: row.id, body: row.body, mine: row.mine, createdAt: row.created_at, read: row.read }));
}

export async function getConversations(): Promise<Conversation[]> {
  const rows = await rpc<Array<{ user_id: string; last_body: string; last_mine: boolean; last_at: string; unread: number }>>('chat_conversations');
  return rows.map((row) => ({ userId: row.user_id, lastBody: row.last_body, lastMine: row.last_mine, lastAt: row.last_at, unread: Number(row.unread) || 0 }));
}

export const sendChatMessage = (userId: string, body: string) => rpc<string>('chat_send', { p_user: userId, p_body: body });
export const deleteChatMessage = (id: string) => rpc<void>('chat_delete', { p_id: id });
export const reportChatMessage = (id: string) => rpc<void>('chat_report', { p_id: id });
export const getChatUnreadCount = () => rpc<number>('chat_unread_count').then(Number).catch(() => 0);
