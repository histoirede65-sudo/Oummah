import { storageService } from '../../core/storage/StorageService';
import { getValidSession, type SupabaseAuthSession } from '../auth/SupabaseAuthService';

export type MuhasabahEntry = {
  id: string;
  userId: string;
  entryDate: string;
  goodDeeds: string;
  couldImprove: string;
  effort: string;
  createdAt: string;
  updatedAt: string;
};

export type MuhasabahDraft = Pick<MuhasabahEntry, 'goodDeeds' | 'couldImprove' | 'effort'>;
export type CommitmentStatus = 'active' | 'progressing' | 'completed' | 'paused';
export type FollowupResponse = 'success' | 'progress' | 'not_yet';

export type MuhasabahCommitment = {
  id: string;
  userId: string;
  text: string;
  status: CommitmentStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  followups: MuhasabahFollowup[];
};

export type MuhasabahFollowup = {
  id: string;
  commitmentId: string;
  response: FollowupResponse;
  createdAt: string;
};

export type MuhasabahActivityKind = 'quran_verse' | 'hadith' | 'tafsir' | 'dua' | 'dhikr' | 'content';
export type MuhasabahActivity = {
  id: string;
  activityDate: string;
  kind: MuhasabahActivityKind;
  title: string;
  detail: string;
  reference: string;
  createdAt: string;
};

type EntryRow = {
  id: string; user_id: string; entry_date: string; good_deeds: string;
  could_improve: string; effort: string; created_at: string; updated_at: string;
};
type CommitmentRow = {
  id: string; user_id: string; text: string; status: CommitmentStatus;
  created_at: string; updated_at: string; completed_at: string | null;
};
type FollowupRow = { id: string; commitment_id: string; response: FollowupResponse; created_at: string };
type ActivityRow = { id: string; activity_date: string; kind: MuhasabahActivityKind; title: string; detail: string; reference: string; created_at: string };

const DRAFT_KEY_PREFIX = 'oummah.muhasabah.draft.v1';
const COMPLETED_KEY_PREFIX = 'oummah.muhasabah.completed.v1';

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '');
  const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !key) throw new Error('SUPABASE_NOT_CONFIGURED');
  return { url, key };
}

async function request<T>(path: string, init: RequestInit = {}) {
  const { url, key } = configuration();
  let session = await getValidSession();
  if (!session) throw new Error('AUTH_REQUIRED');

  const send = (active: SupabaseAuthSession) => fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${active.accessToken}`, 'Content-Type': 'application/json', ...init.headers },
  });
  let response = await send(session);
  if (response.status === 401) {
    session = await getValidSession(true);
    if (!session) throw new Error('AUTH_REQUIRED');
    response = await send(session);
  }
  if (!response.ok) throw new Error(`SUPABASE_${response.status}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

function entryFromRow(row: EntryRow): MuhasabahEntry {
  return { id: row.id, userId: row.user_id, entryDate: row.entry_date, goodDeeds: row.good_deeds ?? '', couldImprove: row.could_improve ?? '', effort: row.effort ?? '', createdAt: row.created_at, updatedAt: row.updated_at };
}

function commitmentFromRow(row: CommitmentRow, followups: FollowupRow[]): MuhasabahCommitment {
  return { id: row.id, userId: row.user_id, text: row.text, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, completedAt: row.completed_at, followups: followups.filter((item) => item.commitment_id === row.id).map((item) => ({ id: item.id, commitmentId: item.commitment_id, response: item.response, createdAt: item.created_at })) };
}

function activityFromRow(row: ActivityRow): MuhasabahActivity {
  return { id: row.id, activityDate: row.activity_date, kind: row.kind, title: row.title, detail: row.detail, reference: row.reference, createdAt: row.created_at };
}

const LOCAL_ENTRIES_KEY = 'oummah.muhasabah.localEntries.v1';

export async function loadDraft(userId: string | null, date = localDateKey()) {
  const own = await storageService.get<MuhasabahDraft>(`${DRAFT_KEY_PREFIX}.${userId ?? 'guest'}.${date}`).catch(() => null);
  if (own || !userId) return own;
  // Texte écrit avant la connexion : on le retrouve après s'être connecté.
  return storageService.get<MuhasabahDraft>(`${DRAFT_KEY_PREFIX}.guest.${date}`).catch(() => null);
}

export async function saveDraft(userId: string | null, date: string, draft: MuhasabahDraft) {
  if (!draft.goodDeeds.trim() && !draft.couldImprove.trim() && !draft.effort.trim()) return;
  await storageService.set(`${DRAFT_KEY_PREFIX}.${userId ?? 'guest'}.${date}`, draft);
}

export async function clearDraft(userId: string | null, date: string) {
  await storageService.remove(`${DRAFT_KEY_PREFIX}.${userId ?? 'guest'}.${date}`);
  if (userId) await storageService.remove(`${DRAFT_KEY_PREFIX}.guest.${date}`).catch(() => undefined);
}

/* Bilans d'un utilisateur non connecté : gardés sur le téléphone, envoyés au compte à la connexion. */
async function readLocalEntries() {
  return (await storageService.get<Record<string, MuhasabahEntry>>(LOCAL_ENTRIES_KEY).catch(() => null)) ?? {};
}

export async function listLocalEntries() {
  return Object.values(await readLocalEntries()).sort((a, b) => b.entryDate.localeCompare(a.entryDate));
}

export async function saveLocalEntry(date: string, draft: MuhasabahDraft) {
  if (!draft.goodDeeds.trim() && !draft.couldImprove.trim() && !draft.effort.trim()) throw new Error('EMPTY_ENTRY');
  const all = await readLocalEntries();
  const now = new Date().toISOString();
  const entry: MuhasabahEntry = { id: `local-${date}`, userId: 'guest', entryDate: date, goodDeeds: draft.goodDeeds.trim(), couldImprove: draft.couldImprove.trim(), effort: draft.effort.trim(), createdAt: all[date]?.createdAt ?? now, updatedAt: now };
  all[date] = entry;
  await storageService.set(LOCAL_ENTRIES_KEY, all);
  await storageService.set(`${COMPLETED_KEY_PREFIX}.guest.${date}`, true);
  await clearDraft(null, date);
  return entry;
}

export async function deleteLocalEntry(date: string) {
  const all = await readLocalEntries();
  delete all[date];
  await storageService.set(LOCAL_ENTRIES_KEY, all);
  await storageService.remove(`${COMPLETED_KEY_PREFIX}.guest.${date}`);
}

/** Envoie au compte les bilans écrits hors connexion (sans écraser un bilan déjà présent ce jour-là). */
export async function syncLocalEntries(serverDates: Set<string>) {
  const all = await readLocalEntries();
  const dates = Object.keys(all);
  if (!dates.length) return false;
  for (const date of dates) {
    const item = all[date];
    if (!serverDates.has(date)) await saveEntry(date, item);
    delete all[date];
    await storageService.set(LOCAL_ENTRIES_KEY, all);
  }
  return true;
}

export async function isLocalEntryComplete(userId: string | null, date = localDateKey()) {
  return (await storageService.get<boolean>(`${COMPLETED_KEY_PREFIX}.${userId ?? 'guest'}.${date}`).catch(() => false)) === true;
}

export async function listEntries() {
  const rows = await request<EntryRow[]>('muhasabah_entries?select=*&order=entry_date.desc');
  return (rows ?? []).map(entryFromRow);
}

export async function getEntry(date: string) {
  const rows = await request<EntryRow[]>(`muhasabah_entries?entry_date=eq.${encodeURIComponent(date)}&select=*`);
  return rows?.[0] ? entryFromRow(rows[0]) : null;
}

export async function listActivities(date?: string) {
  const filter = date ? `&activity_date=eq.${encodeURIComponent(date)}` : '';
  const rows = await request<ActivityRow[]>(`muhasabah_activities?select=*&order=activity_date.desc,created_at.desc${filter}`);
  return (rows ?? []).map(activityFromRow);
}

export async function recordActivity(input: { kind: MuhasabahActivityKind; title: string; detail: string; reference: string; date?: string }) {
  const date = input.date ?? localDateKey();
  if (!(await getValidSession())) return null;
  const rows = await request<ActivityRow[]>('muhasabah_activities?on_conflict=user_id,activity_date,kind,reference&select=*', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({ activity_date: date, kind: input.kind, title: input.title.trim(), detail: input.detail.trim(), reference: input.reference.trim() }),
  });
  return rows?.[0] ? activityFromRow(rows[0]) : null;
}

export async function saveEntry(date: string, draft: MuhasabahDraft) {
  if (!draft.goodDeeds.trim() && !draft.couldImprove.trim() && !draft.effort.trim()) throw new Error('EMPTY_ENTRY');
  const rows = await request<EntryRow[]>('muhasabah_entries?on_conflict=user_id,entry_date&select=*', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ entry_date: date, good_deeds: draft.goodDeeds.trim(), could_improve: draft.couldImprove.trim(), effort: draft.effort.trim() }),
  });
  if (!rows?.[0]) throw new Error('SAVE_FAILED');
  const session = await getValidSession();
  await storageService.set(`${COMPLETED_KEY_PREFIX}.${session?.user.id ?? 'guest'}.${date}`, true);
  await clearDraft(session?.user.id ?? null, date);
  return entryFromRow(rows[0]);
}

export async function deleteEntry(id: string, date?: string) {
  await request(`muhasabah_entries?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
  const session = await getValidSession();
  if (session) await storageService.remove(`${COMPLETED_KEY_PREFIX}.${session.user.id}.${date ?? localDateKey()}`);
}

export async function listCommitments() {
  const [rows, followups] = await Promise.all([
    request<CommitmentRow[]>('muhasabah_commitments?select=*&order=updated_at.desc'),
    request<FollowupRow[]>('muhasabah_followups?select=*&order=created_at.desc'),
  ]);
  return (rows ?? []).map((row) => commitmentFromRow(row, followups ?? []));
}

export async function createCommitment(text: string) {
  const rows = await request<CommitmentRow[]>('muhasabah_commitments?select=*', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ text: text.trim() }) });
  if (!rows?.[0]) throw new Error('SAVE_FAILED');
  return commitmentFromRow(rows[0], []);
}

export async function updateCommitment(id: string, patch: { text?: string; status?: CommitmentStatus }) {
  const body = patch.status === 'completed' ? { ...patch, completed_at: new Date().toISOString() } : patch.status ? { ...patch, completed_at: null } : patch;
  const rows = await request<CommitmentRow[]>(`muhasabah_commitments?id=eq.${encodeURIComponent(id)}&select=*`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) });
  if (!rows?.[0]) throw new Error('SAVE_FAILED');
  return commitmentFromRow(rows[0], []);
}

export async function deleteCommitment(id: string) {
  await request(`muhasabah_commitments?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function addFollowup(commitmentId: string, response: FollowupResponse, currentStatus: CommitmentStatus) {
  await request<FollowupRow[]>('muhasabah_followups?select=*', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ commitment_id: commitmentId, response }) });
  // Un effort accompli ou en pause garde son statut : seul l'utilisateur le change.
  if (currentStatus === 'completed' || currentStatus === 'paused') return;
  const nextStatus: CommitmentStatus = response === 'success' ? 'progressing' : 'active';
  if (nextStatus !== currentStatus) await updateCommitment(commitmentId, { status: nextStatus });
}
