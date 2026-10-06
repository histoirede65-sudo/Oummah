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
  /** Iqama: minutes after the adhan, or a fixed time. */
  iqama?: Partial<Record<ApprovedPrayerKey, IqamaRule>>;
  /** Every Joumou'a of the mosque (first, second…), with the language of the khutba when known. */
  jumuahTimes?: JumuahSlot[];
};

export type IqamaRule = { after: number } | { at: string };
export type JumuahSlot = { time: string; language?: string };
export type MosqueSpecialKind = 'ramadan' | 'eid_fitr' | 'eid_adha';
export type MosqueProposalKind = 'regular' | MosqueSpecialKind;

/** Ramadan (tarawih) or Aïd times, validated for a given period. Dates are YYYY-MM-DD. */
export type MosqueSpecialTimes = {
  kind: MosqueSpecialKind;
  tarawih?: string;
  eidTimes?: string[];
  validFrom: string;
  validTo?: string;
  note?: string;
};

export type MosquePrayerTimeProposal = MosquePrayerTimes & {
  id: string;
  kind: MosqueProposalKind;
  mosqueName: string;
  mosqueAddress?: string;
  note?: string;
  tarawih?: string;
  eidTimes?: string[];
  validFrom?: string;
  validTo?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

function parseIqama(value: unknown): MosquePrayerTimes['iqama'] {
  if (!value || typeof value !== 'object') return undefined;
  const result: Partial<Record<ApprovedPrayerKey, IqamaRule>> = {};
  for (const key of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const) {
    const rule = (value as Record<string, unknown>)[key] as { after?: unknown; at?: unknown } | undefined;
    if (typeof rule?.after === 'number' && rule.after >= 0 && rule.after <= 90) result[key] = { after: Math.round(rule.after) };
    else if (typeof rule?.at === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(rule.at)) result[key] = { at: rule.at };
  }
  return Object.keys(result).length ? result : undefined;
}

function parseJumuahTimes(value: unknown, legacy?: string | null): JumuahSlot[] | undefined {
  const slots = Array.isArray(value)
    ? value.flatMap((slot) => {
        const item = slot as { time?: unknown; language?: unknown };
        return typeof item?.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)
          ? [{ time: item.time, language: typeof item.language === 'string' && item.language.trim() ? item.language.trim() : undefined }]
          : [];
      })
    : [];
  if (slots.length) return slots.sort((a, b) => a.time.localeCompare(b.time));
  return legacy ? [{ time: legacy }] : undefined;
}

function parseTimeList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const times = value.filter((time): time is string => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)).sort();
  return times.length ? times : undefined;
}

/**
 * Iqama time of a prayer for the day shown, or null when unknown. A fixed time is only kept while it
 * still makes sense against the day's adhan (not before it, not more than 2 h after it).
 */
export function getIqamaTime(
  rule: IqamaRule | undefined,
  adhan: { time: string; timestamp: number },
  timezone: string,
): string | null {
  if (!rule) return null;
  if ('after' in rule) {
    try {
      return new Intl.DateTimeFormat('fr-FR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .format(new Date(adhan.timestamp + rule.after * 60_000));
    } catch {
      return null;
    }
  }
  const delta = toMinutes(rule.at) - toMinutes(adhan.time);
  return delta >= 0 && delta <= 120 ? rule.at : null;
}

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
  const rows = await rpc<Array<{mosque_id:string;fajr:string|null;dhuhr:string|null;asr:string|null;maghrib:string|null;isha:string|null;jumuah:string|null;updated_at:string;reference_at?:string|null;latitude?:number|null;longitude?:number|null;iqama?:unknown;jumuah_times?:unknown}>>(
    'get_approved_mosque_prayer_times', { p_mosque_id: mosqueId },
  );
  const row = rows[0];
  if (!row) return null;
  const jumuahTimes = parseJumuahTimes(row.jumuah_times, row.jumuah);
  const approved: MosquePrayerTimes = {
    mosqueId: row.mosque_id, fajr: row.fajr ?? undefined, dhuhr: row.dhuhr ?? undefined, asr: row.asr ?? undefined,
    maghrib: row.maghrib ?? undefined, isha: row.isha ?? undefined, jumuah: jumuahTimes?.[0]?.time ?? row.jumuah ?? undefined,
    updatedAt: row.updated_at, iqama: parseIqama(row.iqama), jumuahTimes,
  };
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

/** Validated Ramadan / Aïd times that are current or upcoming. Empty offline. */
export async function getMosqueSpecialTimes(mosqueId: string): Promise<MosqueSpecialTimes[]> {
  const rows = await rpc<Array<{kind:string;tarawih:string|null;eid_times:unknown;valid_from:string|null;valid_to:string|null;note:string|null}>>(
    'get_mosque_special_times', { p_mosque_id: mosqueId },
  ).catch(() => []);
  return rows.flatMap((row) => row.valid_from && (row.kind === 'ramadan' || row.kind === 'eid_fitr' || row.kind === 'eid_adha')
    ? [{ kind: row.kind, tarawih: row.tarawih ?? undefined, eidTimes: parseTimeList(row.eid_times), validFrom: row.valid_from, validTo: row.valid_to ?? undefined, note: row.note ?? undefined }]
    : []);
}

export type MosqueTimesProposalInput = {
  kind: MosqueProposalKind;
  mosqueId: string;
  mosqueName: string;
  mosqueAddress?: string;
  note?: string;
  fajr?: string; dhuhr?: string; asr?: string; maghrib?: string; isha?: string;
  iqama?: Partial<Record<ApprovedPrayerKey, IqamaRule>>;
  jumuahTimes?: JumuahSlot[];
  tarawih?: string;
  eidTimes?: string[];
  /** YYYY-MM-DD */
  validFrom?: string;
  validTo?: string;
};

export async function proposeMosquePrayerTimes(input: MosqueTimesProposalInput) {
  config();
  const session = await getValidSession(true);
  if (!session?.accessToken || !session.user?.id) throw new Error('AUTH_REQUIRED');
  const regular = input.kind === 'regular';
  const iqama = regular && input.iqama
    ? Object.fromEntries(Object.entries(input.iqama).flatMap(([key, rule]): [string, IqamaRule][] => {
        if ('at' in rule) { const at = cleanTime(rule.at); return at ? [[key, { at }]] : []; }
        return Number.isFinite(rule.after) && rule.after >= 0 && rule.after <= 90 ? [[key, { after: Math.round(rule.after) }]] : [];
      }))
    : null;
  const jumuahTimes = regular
    ? (input.jumuahTimes ?? []).flatMap((slot) => { const time = cleanTime(slot.time); return time ? [{ time, ...(slot.language?.trim() ? { language: slot.language.trim().slice(0, 40) } : {}) }] : []; })
    : [];
  const eidTimes = input.kind === 'eid_fitr' || input.kind === 'eid_adha'
    ? (input.eidTimes ?? []).flatMap((time) => cleanTime(time) ?? [])
    : [];
  const payload = {
    kind: input.kind,
    mosque_id: input.mosqueId, mosque_name: input.mosqueName, mosque_address: input.mosqueAddress?.trim() || null,
    fajr: regular ? cleanTime(input.fajr) ?? null : null, dhuhr: regular ? cleanTime(input.dhuhr) ?? null : null,
    asr: regular ? cleanTime(input.asr) ?? null : null, maghrib: regular ? cleanTime(input.maghrib) ?? null : null,
    isha: regular ? cleanTime(input.isha) ?? null : null,
    jumuah: jumuahTimes[0]?.time ?? null,
    iqama: iqama && Object.keys(iqama).length ? iqama : null,
    jumuah_times: jumuahTimes.length ? jumuahTimes : null,
    tarawih: input.kind === 'ramadan' ? cleanTime(input.tarawih) ?? null : null,
    eid_times: eidTimes.length ? eidTimes : null,
    valid_from: regular ? null : input.validFrom ?? null,
    valid_to: input.kind === 'ramadan' ? input.validTo ?? null : null,
    note: input.note?.trim() || null, submitted_by: session.user.id, status: 'pending',
  };
  const response = await fetch(`${url}/rest/v1/mosque_prayer_time_updates`, {
    method: 'POST', headers: { apikey: anon!, Authorization: `Bearer ${session.accessToken}`, 'Content-Type':'application/json', Prefer:'return=minimal' }, body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await response.text());
}

export async function adminListMosquePrayerTimeUpdates(): Promise<MosquePrayerTimeProposal[]> {
  const session = await getValidSession(); if (!session?.accessToken) throw new Error('AUTH_REQUIRED');
  const rows = await rpc<any[]>('admin_list_mosque_prayer_time_updates', {p_status:'pending'}, session.accessToken);
  return rows.map((r) => ({ id:r.id, kind:r.kind ?? 'regular', mosqueId:r.mosque_id, mosqueName:r.mosque_name, mosqueAddress:r.mosque_address ?? undefined,
    fajr:r.fajr ?? undefined,dhuhr:r.dhuhr ?? undefined,asr:r.asr ?? undefined,maghrib:r.maghrib ?? undefined,isha:r.isha ?? undefined,jumuah:r.jumuah ?? undefined,
    iqama:parseIqama(r.iqama), jumuahTimes:parseJumuahTimes(r.jumuah_times, r.jumuah), tarawih:r.tarawih ?? undefined, eidTimes:parseTimeList(r.eid_times),
    validFrom:r.valid_from ?? undefined, validTo:r.valid_to ?? undefined,
    note:r.note ?? undefined,status:r.status,createdAt:r.created_at }));
}
export async function adminReviewMosquePrayerTimeUpdate(id:string, approve:boolean) {
  const session = await getValidSession(); if (!session?.accessToken) throw new Error('AUTH_REQUIRED');
  await rpc('admin_review_mosque_prayer_time_update', {p_id:id,p_approve:approve}, session.accessToken);
}
