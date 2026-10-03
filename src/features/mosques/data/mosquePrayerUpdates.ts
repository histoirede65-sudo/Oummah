import AsyncStorage from '@react-native-async-storage/async-storage';
import { getValidSession } from '../../auth/SupabaseAuthService';
import {
  getMosquePrayerSchedule,
  loadPrayerCalculationSettings,
  type MosquePrayerSchedule,
  type PrayerCalculationSettings,
} from './mosquePrayerTimes';

type ApprovedPrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
const APPROVED_PRAYER_KEYS: readonly ApprovedPrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type MosquePrayerTimes = {
  mosqueId: string;
  fajr?: string;
  dhuhr?: string;
  asr?: string;
  maghrib?: string;
  isha?: string;
  jumuah?: string;
  updatedAt?: string;
  /**
   * Minutes between the mosque's time and the calculated time on the day the times were noted
   * (Maghrib 20:02 when the sun set at 19:42 → +20). Applied to each day's calculation, so the
   * mosque's times follow the sun instead of staying frozen at the day they were noted.
   */
  offsets?: Partial<Record<ApprovedPrayerKey, number>>;
  /** The noted times are from another day and their offsets are unknown: they are not applied. */
  stale?: boolean;
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
  const digits = v.replace(/\D/g, '');
  let formatted = v;
  if (/^\d{3,4}$/.test(digits)) {
    const padded = digits.padStart(4, '0');
    formatted = `${padded.slice(0,2)}:${padded.slice(2,4)}`;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(formatted)) throw new Error('HORAIRE_INVALIDE');
  return formatted;
}

async function rpc<T>(name: string, body: object, token?: string): Promise<T> {
  config();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: anon!, Authorization: `Bearer ${token ?? anon}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  const responseText = await response.text();
  return (responseText ? JSON.parse(responseText) : undefined) as T;
}

const OFFSETS_CACHE_PREFIX = 'oummah.mosques.approved-offsets.v1.';
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function localDateKey(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

/** Calculated times on a past day, with the same settings as the schedules the offsets are applied to. */
async function calculatedTimesOn(
  dateKey: string,
  latitude: number,
  longitude: number,
  calculation: PrayerCalculationSettings,
): Promise<Partial<Record<ApprovedPrayerKey, string>> | null> {
  const query = [
    `latitude=${latitude}`,
    `longitude=${longitude}`,
    `method=${calculation.mode === 'custom' ? 99 : calculation.method}`,
    ...(calculation.mode === 'custom' ? [`methodSettings=${calculation.fajrAngle},null,${calculation.ishaAngle}`] : []),
    'school=0',
  ].join('&');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`https://api.aladhan.com/v1/timings/${dateKey}?${query}`, { signal: controller.signal });
    if (!response.ok) return null;
    const payload = await response.json() as { data?: { timings?: Record<string, string> } };
    const timings = payload.data?.timings;
    if (!timings) return null;
    const pick = (name: string) => timings[name]?.slice(0, 5);
    return { fajr: pick('Fajr'), dhuhr: pick('Dhuhr'), asr: pick('Asr'), maghrib: pick('Maghrib'), isha: pick('Isha') };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function approvedOffsets(
  times: Partial<Record<ApprovedPrayerKey, string>>,
  referenceAt: string,
  latitude: number,
  longitude: number,
): Promise<Partial<Record<ApprovedPrayerKey, number>> | null> {
  const calculation = await loadPrayerCalculationSettings();
  const dateKey = localDateKey(new Date(referenceAt));
  const cacheKey = OFFSETS_CACHE_PREFIX + [
    dateKey, latitude.toFixed(4), longitude.toFixed(4),
    calculation.mode, calculation.method, calculation.fajrAngle, calculation.ishaAngle,
    ...APPROVED_PRAYER_KEYS.map((key) => times[key] ?? ''),
  ].join('|');
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached) as Partial<Record<ApprovedPrayerKey, number>>;
  } catch {
    // Recomputed below.
  }
  const calculated = await calculatedTimesOn(dateKey, latitude, longitude, calculation);
  if (!calculated) return null;
  const offsets: Partial<Record<ApprovedPrayerKey, number>> = {};
  for (const key of APPROVED_PRAYER_KEYS) {
    const noted = times[key];
    const reference = calculated[key];
    if (!noted || !reference || !TIME.test(noted) || !TIME.test(reference)) continue;
    let offset = toMinutes(noted) - toMinutes(reference);
    if (offset > 720) offset -= 1440;
    if (offset < -720) offset += 1440;
    offsets[key] = offset;
  }
  await AsyncStorage.setItem(cacheKey, JSON.stringify(offsets)).catch(() => undefined);
  return offsets;
}

export async function getApprovedMosquePrayerTimes(mosqueId: string): Promise<MosquePrayerTimes | null> {
  const rows = await rpc<Array<{mosque_id:string;fajr:string|null;dhuhr:string|null;asr:string|null;maghrib:string|null;isha:string|null;jumuah:string|null;updated_at:string;reference_at?:string|null;latitude?:number|null;longitude?:number|null}>>(
    'get_approved_mosque_prayer_times', { p_mosque_id: mosqueId },
  );
  const row = rows[0];
  if (!row) return null;
  const approved: MosquePrayerTimes = { mosqueId: row.mosque_id, fajr: row.fajr ?? undefined, dhuhr: row.dhuhr ?? undefined, asr: row.asr ?? undefined, maghrib: row.maghrib ?? undefined, isha: row.isha ?? undefined, jumuah: row.jumuah ?? undefined, updatedAt: row.updated_at };
  const referenceAt = row.reference_at ?? row.updated_at;
  const offsets = typeof row.latitude === 'number' && typeof row.longitude === 'number'
    ? await approvedOffsets(approved, referenceAt, row.latitude, row.longitude)
    : null;
  if (offsets) return { ...approved, offsets };
  // Without offsets, noted times are only right on the day they were noted.
  return { ...approved, stale: localDateKey(new Date(referenceAt)) !== localDateKey(new Date()) };
}

export function applyApprovedMosquePrayerTimes(
  schedule: MosquePrayerSchedule,
  approved: MosquePrayerTimes | null,
): MosquePrayerSchedule {
  if (!approved || approved.stale) return schedule;

  const formatTime = (timestamp: number, timezone: string) => {
    try {
      return new Intl.DateTimeFormat('fr-FR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toISOString().slice(11, 16);
    }
  };
  if (approved.offsets) {
    const offsetsByKey = approved.offsets;
    const shift = (prayer: MosquePrayerSchedule['prayers'][number]) => {
      const offset = offsetsByKey[prayer.key.toLowerCase() as ApprovedPrayerKey];
      if (offset === undefined) return prayer;
      const timestamp = prayer.timestamp + offset * 60_000;
      return { ...prayer, time: formatTime(timestamp, schedule.timezone), timestamp };
    };
    return {
      ...schedule,
      prayers: schedule.prayers.map(shift),
      tomorrowPrayers: schedule.tomorrowPrayers.map(shift),
      tomorrowFajr: shift(schedule.tomorrowFajr),
      futurePrayers: schedule.futurePrayers?.map(shift),
    };
  }

  const offsets = new Map<string, number>();
  const todayByKey = new Map(schedule.prayers.map((prayer) => [prayer.key, prayer]));
  for (const prayer of schedule.prayers) {
    const value = approved[prayer.key.toLowerCase() as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'];
    if (value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)) offsets.set(prayer.key, toMinutes(value) - toMinutes(prayer.time));
  }
  const adjust = (prayer: MosquePrayerSchedule['prayers'][number], future = false) => {
    const offset = offsets.get(prayer.key);
    if (offset === undefined) return prayer;
    const source = todayByKey.get(prayer.key);
    const approvedValue = source && approved[source.key.toLowerCase() as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'];
    const timestamp = future ? prayer.timestamp + offset * 60_000 : source ? source.timestamp + offset * 60_000 : undefined;
    if (!approvedValue || timestamp === undefined) return prayer;
    return { ...prayer, time: future ? formatTime(timestamp, schedule.timezone) : approvedValue, timestamp };
  };

  return {
    ...schedule,
    prayers: schedule.prayers.map((prayer) => adjust(prayer)),
    tomorrowPrayers: schedule.tomorrowPrayers.map((prayer) => adjust(prayer, true)),
    tomorrowFajr: adjust(schedule.tomorrowFajr, true),
    futurePrayers: schedule.futurePrayers?.map((prayer) => adjust(prayer, true)),
  };
}

/**
 * Prayer schedule of a mosque as shown everywhere in the app: the user's calculation settings, then
 * the mosque's approved times when the user follows mosque times.
 */
export async function getMosqueScheduleWithApprovedTimes(
  mosque: { id: string; latitude: number; longitude: number },
  signal?: AbortSignal,
): Promise<MosquePrayerSchedule> {
  const calculation = await loadPrayerCalculationSettings();
  const calculated = await getMosquePrayerSchedule(mosque.latitude, mosque.longitude, signal, calculation);
  const approved = calculation.scheduleSource === 'mosque'
    ? await getApprovedMosquePrayerTimes(mosque.id).catch(() => null)
    : null;
  return applyApprovedMosquePrayerTimes(calculated, approved);
}

export async function proposeMosquePrayerTimes(input: MosquePrayerTimes & {mosqueName:string;mosqueAddress?:string;note?:string}) {
  config();
  const session = await getValidSession(true);
  if (!session?.accessToken || !session.user?.id) throw new Error('AUTH_REQUIRED');
  const payload = {
    mosque_id: input.mosqueId, mosque_name: input.mosqueName, mosque_address: input.mosqueAddress?.trim() || null,
    fajr: cleanTime(input.fajr) ?? null, dhuhr: cleanTime(input.dhuhr) ?? null, asr: cleanTime(input.asr) ?? null,
    maghrib: cleanTime(input.maghrib) ?? null, isha: cleanTime(input.isha) ?? null, jumuah: cleanTime(input.jumuah) ?? null,
    note: input.note?.trim() || null, submitted_by: session.user.id, status: 'pending',
  };
  const response = await fetch(`${url}/rest/v1/mosque_prayer_time_updates`, {
    method: 'POST', headers: { apikey: anon!, Authorization: `Bearer ${session.accessToken}`, 'Content-Type':'application/json', Prefer:'return=minimal' }, body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await response.text());
}

export async function adminListMosquePrayerTimeUpdates(): Promise<MosquePrayerTimeProposal[]> {
  const session = await getValidSession(true); if (!session?.accessToken) throw new Error('AUTH_REQUIRED');
  const rows = await rpc<any[]>('admin_list_mosque_prayer_time_updates', {p_status:'pending'}, session.accessToken);
  return rows.map((r) => ({ id:r.id, mosqueId:r.mosque_id, mosqueName:r.mosque_name, mosqueAddress:r.mosque_address ?? undefined,
    fajr:r.fajr ?? undefined,dhuhr:r.dhuhr ?? undefined,asr:r.asr ?? undefined,maghrib:r.maghrib ?? undefined,isha:r.isha ?? undefined,jumuah:r.jumuah ?? undefined,
    note:r.note ?? undefined,status:r.status,createdAt:r.created_at }));
}
export async function adminReviewMosquePrayerTimeUpdate(id:string, approve:boolean) {
  const session = await getValidSession(true); if (!session?.accessToken) throw new Error('AUTH_REQUIRED');
  await rpc('admin_review_mosque_prayer_time_update', {p_id:id,p_approve:approve}, session.accessToken);
}
