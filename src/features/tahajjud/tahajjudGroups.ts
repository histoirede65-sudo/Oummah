import { getValidSession } from '../auth/SupabaseAuthService';
import { COMMUNITY_AVATARS, type CommunityAvatar } from './tahajjudCommunity';
import { tx, tahajjudLocale } from './tahajjudI18n';

/** Groupes d'amis : nom libre, discussion, rappels programmés (envoyés à tous les membres). */

export type GroupSummary = {
  id: string;
  name: string;
  members: number;
  isOwner: boolean;
  muted: boolean;
  lastBody: string | null;
  lastKind: 'text' | 'reminder' | 'system' | null;
  lastSender: string | null;
  lastAt: string;
  unread: number;
};

export type GroupMember = { id: string; pseudo: string; avatar: CommunityAvatar; owner: boolean; me: boolean };
export type GroupReminder = { id: string; body: string; remindAt: string; repeatDaily: boolean; by: string; mine: boolean };
export type GroupDetail = { id: string; name: string; isOwner: boolean; muted: boolean; members: GroupMember[]; reminders: GroupReminder[] };

export type GroupMessage = {
  id: string;
  body: string;
  kind: 'text' | 'reminder' | 'system';
  remindAt: string | null;
  repeatDaily: boolean;
  reminderActive: boolean;
  sender: string | null;
  senderPseudo: string | null;
  senderAvatar: CommunityAvatar;
  mine: boolean;
  createdAt: string;
  pending?: boolean;
};

const KNOWN_ERRORS = ['AUTH_REQUIRED', 'PROFILE_REQUIRED', 'NOT_MEMBER', 'NOT_OWNER', 'TEXT_REFUSED', 'RATE_LIMIT', 'NOT_FOUND', 'INVALID'];

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

export async function getGroups(): Promise<GroupSummary[]> {
  const rows = await rpc<Array<{
    id: string; name: string; members: number; is_owner: boolean; muted: boolean;
    last_body: string | null; last_kind: GroupSummary['lastKind']; last_sender: string | null; last_at: string; unread: number;
  }>>('group_list');
  return rows.map((row) => ({
    id: row.id, name: row.name, members: Number(row.members) || 0, isOwner: row.is_owner, muted: row.muted,
    lastBody: row.last_body, lastKind: row.last_kind, lastSender: row.last_sender, lastAt: row.last_at, unread: Number(row.unread) || 0,
  }));
}

export async function getGroupDetail(id: string): Promise<GroupDetail> {
  const raw = await rpc<{
    id: string; name: string; isOwner: boolean; muted: boolean;
    members: Array<{ id: string; pseudo: string; avatar: string; owner: boolean; me: boolean }> | null;
    reminders: GroupReminder[] | null;
  }>('group_detail', { p_group: id });
  return {
    id: raw.id, name: raw.name, isOwner: raw.isOwner, muted: Boolean(raw.muted),
    members: (raw.members ?? []).map((member) => ({ ...member, avatar: avatarOf(member.avatar) })),
    reminders: raw.reminders ?? [],
  };
}

export async function getGroupThread(id: string, before?: string): Promise<GroupMessage[]> {
  const rows = await rpc<Array<{
    id: string; body: string; kind: GroupMessage['kind']; remind_at: string | null; repeat_daily: boolean; reminder_active: boolean;
    sender: string | null; sender_pseudo: string | null; sender_avatar: string | null; mine: boolean; created_at: string;
  }>>('group_thread', { p_group: id, p_before: before ?? null, p_limit: 40 });
  return rows.map((row) => ({
    id: row.id, body: row.body, kind: row.kind, remindAt: row.remind_at, repeatDaily: row.repeat_daily, reminderActive: row.reminder_active,
    sender: row.sender, senderPseudo: row.sender_pseudo, senderAvatar: avatarOf(row.sender_avatar), mine: Boolean(row.mine), createdAt: row.created_at,
  }));
}

export const createGroup = (name: string, members: string[]) => rpc<string>('group_create', { p_name: name, p_members: members });
export const renameGroup = (id: string, name: string) => rpc<void>('group_rename', { p_group: id, p_name: name });
export const addGroupMembers = (id: string, members: string[]) => rpc<number>('group_add_friends', { p_group: id, p_members: members });
export const removeGroupMember = (id: string, userId: string) => rpc<void>('group_remove_member', { p_group: id, p_user: userId });
export const setGroupMuted = (id: string, muted: boolean) => rpc<void>('group_set_muted', { p_group: id, p_muted: muted });
export const sendGroupMessage = (id: string, body: string) => rpc<string>('group_send', { p_group: id, p_body: body });
export const addGroupReminder = (id: string, body: string, remindAt: Date, repeatDaily: boolean) =>
  rpc<string>('group_add_reminder', { p_group: id, p_body: body, p_remind_at: remindAt.toISOString(), p_repeat_daily: repeatDaily });
export const cancelGroupReminder = (messageId: string) => rpc<void>('group_cancel_reminder', { p_id: messageId });
export const deleteGroupMessage = (messageId: string) => rpc<void>('group_delete_message', { p_id: messageId });
export const reportGroupMessage = (messageId: string) => rpc<void>('group_report_message', { p_id: messageId });

/** Next occurrence of HH:MM (today if still ahead, otherwise tomorrow). */
export function nextOccurrence(hour: number, minute: number, from = new Date()) {
  const at = new Date(from);
  at.setHours(hour, minute, 0, 0);
  if (at.getTime() <= from.getTime() + 30_000) at.setDate(at.getDate() + 1);
  return at;
}

export function reminderLabel(iso: string, repeatDaily: boolean) {
  const at = new Date(iso);
  const time = at.toLocaleTimeString(tahajjudLocale(), { hour: '2-digit', minute: '2-digit' });
  if (repeatDaily) return tx("Chaque jour à {0}", [time]);
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (at.toDateString() === today.toDateString()) return tx("Aujourd’hui à {0}", [time]);
  if (at.toDateString() === tomorrow.toDateString()) return tx("Demain à {0}", [time]);
  return tx('{0} à {1}', [at.toLocaleDateString(tahajjudLocale(), { weekday: 'long', day: 'numeric', month: 'long' }), time]);
}

export function groupsErrorMessage(error: unknown) {
  switch (error instanceof Error ? error.message : '') {
    case 'AUTH_REQUIRED': return tx('Connectez-vous pour retrouver vos groupes.');
    case 'PROFILE_REQUIRED': return tx('Créez votre profil OUMMAH (un pseudo suffit).');
    case 'NOT_MEMBER': return tx('Vous ne faites plus partie de ce groupe.');
    case 'NOT_OWNER': return tx('Seul le créateur du groupe peut faire cela.');
    case 'TEXT_REFUSED': return tx('Ce texte contient des mots qui ne sont pas acceptés.');
    case 'RATE_LIMIT': return tx('Limite atteinte pour le moment. Réessayez plus tard.');
    case 'INVALID': return tx('Vérifiez le texte et l’heure.');
    default: return tx('Action impossible pour le moment.');
  }
}
