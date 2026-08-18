import { getValidSession } from '../../auth/SupabaseAuthService';

export type MosquePrayerTimes = {
  mosqueId: string;
  fajr?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  jumuah?: string;
  updatedAt?: string;
};

export type MosquePrayerTimeProposal = MosquePrayerTimes & {
  id: string;
  mosqueName: string;
  mosqueAddress?: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
function config() { if (!url || !anon) throw new Error('SUPABASE_NOT_CONFIGURED'); }
function cleanTime(value?: string) {
  const v = value?.trim();
  if (!v) return undefined;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw new Error('HORAIRE_INVALIDE');
  return v;
}

async function rpc<T>(name: string, body: object, token?: string): Promise<T> {
  config();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: anon!, Authorization: `Bearer ${token ?? anon}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export async function getApprovedMosquePrayerTimes(mosqueId: string): Promise<MosquePrayerTimes | null> {
  const rows = await rpc<Array<{mosque_id:string;fajr:string|null;dhuhr:string|null;asr:string|null;maghrib:string|null;isha:string|null;jumuah:string|null;updated_at:string}>>(
    'get_approved_mosque_prayer_times', { p_mosque_id: mosqueId },
  );
  const row = rows[0];
  return row ? { mosqueId: row.mosque_id, fajr: row.fajr ?? undefined, dhuhr: row.dhuhr ?? undefined, asr: row.asr ?? undefined, maghrib: row.maghrib ?? undefined, isha: row.isha ?? undefined, jumuah: row.jumuah ?? undefined, updatedAt: row.updated_at } : null;
}

export async function proposeMosquePrayerTimes(input: MosquePrayerTimes & {mosqueName:string;mosqueAddress?:string;note?:string}) {
  config();
  const session = await getValidSession(true);
  if (!session?.access_token || !session.user?.id) throw new Error('AUTH_REQUIRED');
  const payload = {
    mosque_id: input.mosqueId, mosque_name: input.mosqueName, mosque_address: input.mosqueAddress?.trim() || null,
    fajr: cleanTime(input.fajr) ?? null, dhuhr: cleanTime(input.dhuhr) ?? null, asr: cleanTime(input.asr) ?? null,
    maghrib: cleanTime(input.maghrib) ?? null, isha: cleanTime(input.isha) ?? null, jumuah: cleanTime(input.jumuah) ?? null,
    note: input.note?.trim() || null, submitted_by: session.user.id, status: 'pending',
  };
  const response = await fetch(`${url}/rest/v1/mosque_prayer_time_updates`, {
    method: 'POST', headers: { apikey: anon!, Authorization: `Bearer ${session.access_token}`, 'Content-Type':'application/json', Prefer:'return=minimal' }, body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await response.text());
}

export async function adminListMosquePrayerTimeUpdates(): Promise<MosquePrayerTimeProposal[]> {
  const session = await getValidSession(true); if (!session?.access_token) throw new Error('AUTH_REQUIRED');
  const rows = await rpc<any[]>('admin_list_mosque_prayer_time_updates', {p_status:'pending'}, session.access_token);
  return rows.map((r) => ({ id:r.id, mosqueId:r.mosque_id, mosqueName:r.mosque_name, mosqueAddress:r.mosque_address ?? undefined,
    fajr:r.fajr ?? undefined,dhuhr:r.dhuhr ?? undefined,asr:r.asr ?? undefined,maghrib:r.maghrib ?? undefined,isha:r.isha ?? undefined,jumuah:r.jumuah ?? undefined,
    note:r.note ?? undefined,status:r.status,createdAt:r.created_at }));
}
export async function adminReviewMosquePrayerTimeUpdate(id:string, approve:boolean) {
  const session = await getValidSession(true); if (!session?.access_token) throw new Error('AUTH_REQUIRED');
  await rpc('admin_review_mosque_prayer_time_update', {p_id:id,p_approve:approve}, session.access_token);
}
