import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateKey, shiftDateKey, type AlarmMode } from './tahajjudNight';

/**
 * Données Tahajjud, toutes sur le téléphone (rien n'est publié).
 * Les nuits restent au format historique { "2026-10-03": "<date ISO>" } : Ma progression le lit.
 */

const NIGHTS_KEY = 'oummah.tahajjud.nights.v1';
const DETAILS_KEY = 'oummah.tahajjud.details.v1';
const PAUSES_KEY = 'oummah.tahajjud.pauses.v1';
const SETTINGS_KEY = 'oummah.tahajjud.settings.v1';
const DUAS_KEY = 'oummah.tahajjud.duas.v1';
const JOURNAL_KEY = 'oummah.tahajjud.journal.v1';
const CHALLENGE_KEY = 'oummah.tahajjud.challenge.v1';

export type TahajjudNights = Record<string, string>;
export type NightDetails = Record<string, { witr?: boolean }>;
/** Paused periods (illness, menstruation, travel…): nights inside never break the streak. */
export type TahajjudPause = { from: string; to: string | null };

export type TahajjudSettings = {
  alarm: { enabled: boolean; mode: AlarmMode; customTime?: string; systemAlarm?: boolean };
  notifications: { soon: boolean; start: boolean; evening: boolean; fajr: boolean; bedtime: boolean };
  /** Sleep cycles (1 h 30) wanted before waking up: drives the « heure du coucher » reminder. */
  bedtimeCycles: number;
};

export type PrivateDua = {
  id: string;
  text: string;
  createdNight: string;
  /** Kept for the following nights. */
  keep: boolean;
  /** Nights when it was said. */
  doneNights: string[];
};

export type JournalEntry = { intention?: string; note?: string; updatedAt: string };
export type TahajjudJournal = Record<string, JournalEntry>;

export type TahajjudChallenge = { id: string; label: string; target: number; startNight: string };

export const DEFAULT_TAHAJJUD_SETTINGS: TahajjudSettings = {
  alarm: { enabled: false, mode: 'start' },
  notifications: { soon: false, start: false, evening: false, fajr: false, bedtime: false },
  bedtimeCycles: 5,
};

async function read<T>(key: string, fallback: T, valid: (value: unknown) => boolean): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const value = JSON.parse(raw) as unknown;
    return valid(value) ? value as T : fallback;
  } catch {
    return fallback;
  }
}

const isRecord = (value: unknown) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

// ----- Nights --------------------------------------------------------------------------------

export async function loadTahajjudNights(): Promise<TahajjudNights> {
  const value = await read<Record<string, unknown>>(NIGHTS_KEY, {}, isRecord);
  return Object.fromEntries(Object.entries(value).filter(([day, date]) =>
    /^\d{4}-\d{2}-\d{2}$/.test(day) && typeof date === 'string',
  )) as TahajjudNights;
}

export async function saveTahajjudNight(day: string, nights: TahajjudNights): Promise<TahajjudNights> {
  const updated = { ...nights, [day]: new Date().toISOString() };
  await AsyncStorage.setItem(NIGHTS_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeTahajjudNight(day: string): Promise<TahajjudNights> {
  const nights = await loadTahajjudNights();
  delete nights[day];
  await AsyncStorage.setItem(NIGHTS_KEY, JSON.stringify(nights));
  return nights;
}

export async function loadNightDetails(): Promise<NightDetails> {
  return read<NightDetails>(DETAILS_KEY, {}, isRecord);
}

export async function saveNightDetails(day: string, details: NightDetails[string]): Promise<NightDetails> {
  const all = await loadNightDetails();
  all[day] = details;
  await AsyncStorage.setItem(DETAILS_KEY, JSON.stringify(all));
  return all;
}

// ----- Pauses --------------------------------------------------------------------------------

export async function loadPauses(): Promise<TahajjudPause[]> {
  return read<TahajjudPause[]>(PAUSES_KEY, [], Array.isArray);
}

export function activePause(pauses: readonly TahajjudPause[]) {
  return pauses.find((pause) => pause.to === null) ?? null;
}

export async function setPause(active: boolean, currentNight: string): Promise<TahajjudPause[]> {
  const pauses = await loadPauses();
  const open = activePause(pauses);
  if (active && !open) pauses.push({ from: currentNight, to: null });
  if (!active && open) open.to = shiftDateKey(currentNight, -1) < open.from ? open.from : shiftDateKey(currentNight, -1);
  await AsyncStorage.setItem(PAUSES_KEY, JSON.stringify(pauses));
  return pauses;
}

export function isPaused(pauses: readonly TahajjudPause[], night: string) {
  return pauses.some((pause) => night >= pause.from && (pause.to === null || night <= pause.to));
}

// ----- Settings ------------------------------------------------------------------------------

export async function loadTahajjudSettings(): Promise<TahajjudSettings> {
  const value = await read<Partial<TahajjudSettings>>(SETTINGS_KEY, {}, isRecord);
  return {
    alarm: { ...DEFAULT_TAHAJJUD_SETTINGS.alarm, ...(value.alarm ?? {}) },
    notifications: { ...DEFAULT_TAHAJJUD_SETTINGS.notifications, ...(value.notifications ?? {}) },
    bedtimeCycles: typeof value.bedtimeCycles === 'number' ? value.bedtimeCycles : DEFAULT_TAHAJJUD_SETTINGS.bedtimeCycles,
  };
}

export async function saveTahajjudSettings(settings: TahajjudSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ----- Private duas --------------------------------------------------------------------------

export async function loadPrivateDuas(): Promise<PrivateDua[]> {
  return read<PrivateDua[]>(DUAS_KEY, [], Array.isArray);
}

export async function savePrivateDuas(duas: PrivateDua[]) {
  await AsyncStorage.setItem(DUAS_KEY, JSON.stringify(duas));
}

/** Duas shown for a night: kept ones, plus the ones written for this night. */
export function duasForNight(duas: readonly PrivateDua[], night: string) {
  return duas.filter((dua) => dua.keep || dua.createdNight === night);
}

// ----- Journal -------------------------------------------------------------------------------

export async function loadJournal(): Promise<TahajjudJournal> {
  return read<TahajjudJournal>(JOURNAL_KEY, {}, isRecord);
}

export async function saveJournalEntry(night: string, entry: Omit<JournalEntry, 'updatedAt'>): Promise<TahajjudJournal> {
  const journal = await loadJournal();
  if (!entry.intention?.trim() && !entry.note?.trim()) delete journal[night];
  else journal[night] = { ...entry, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
  return journal;
}

// ----- Challenge -----------------------------------------------------------------------------

export async function loadChallenge(): Promise<TahajjudChallenge | null> {
  return read<TahajjudChallenge | null>(CHALLENGE_KEY, null, isRecord);
}

export async function saveChallenge(challenge: TahajjudChallenge | null) {
  if (challenge) await AsyncStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
  else await AsyncStorage.removeItem(CHALLENGE_KEY);
}

export function challengeProgress(challenge: TahajjudChallenge, nights: TahajjudNights) {
  const done = Object.keys(nights).filter((night) => night >= challenge.startNight).length;
  return { done: Math.min(done, challenge.target), complete: done >= challenge.target };
}

// ----- Statistics ----------------------------------------------------------------------------

/**
 * Current streak: consecutive validated nights up to tonight (tonight not validated yet does not
 * break it). Paused nights are skipped without breaking it.
 */
export function currentStreak(nights: TahajjudNights, pauses: readonly TahajjudPause[], currentNight: string) {
  let night = nights[currentNight] ? currentNight : shiftDateKey(currentNight, -1);
  let count = 0;
  for (let guard = 0; guard < 3650; guard++) {
    if (nights[night]) count++;
    else if (!isPaused(pauses, night)) break;
    night = shiftDateKey(night, -1);
  }
  return count;
}

export function bestStreak(nights: TahajjudNights, pauses: readonly TahajjudPause[]) {
  const keys = Object.keys(nights).sort();
  if (!keys.length) return 0;
  let best = 0;
  let run = 0;
  let night = keys[0];
  const last = keys[keys.length - 1];
  while (night <= last) {
    if (nights[night]) best = Math.max(best, ++run);
    else if (!isPaused(pauses, night)) run = 0;
    night = shiftDateKey(night, 1);
  }
  return best;
}

export type StatsPeriod = 'week' | 'month' | 'year';

/** Nights of the period up to the current night (Monday-based week). */
export function periodNights(period: StatsPeriod, currentNight: string): string[] {
  const end = new Date(`${currentNight}T12:00:00`);
  const start = new Date(end);
  if (period === 'week') start.setDate(end.getDate() - ((end.getDay() + 6) % 7));
  if (period === 'month') start.setDate(1);
  if (period === 'year') { start.setMonth(0); start.setDate(1); }
  const keys: string[] = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) keys.push(localDateKey(day));
  return keys;
}

export function periodStats(period: StatsPeriod, currentNight: string, nights: TahajjudNights, pauses: readonly TahajjudPause[]) {
  const keys = periodNights(period, currentNight);
  const done = keys.filter((night) => nights[night]).length;
  // Paused nights do not count against regularity; tonight only once validated.
  const counted = keys.filter((night) => nights[night] || (!isPaused(pauses, night) && night !== currentNight)).length;
  return { done, counted, regularity: counted ? Math.round((done / counted) * 100) : 0, total: keys.length };
}

// ----- Evening intention -----------------------------------------------------------------------

const INTENTIONS_KEY = 'oummah.tahajjud.intentions.v1';

/** « Ce soir, j'ai l'intention de me lever » : night key → when the intention was made. */
export type TahajjudIntentions = Record<string, string>;

export async function loadIntentions(): Promise<TahajjudIntentions> {
  return read<TahajjudIntentions>(INTENTIONS_KEY, {}, isRecord);
}

export async function setIntention(night: string, on: boolean): Promise<TahajjudIntentions> {
  const intentions = { ...(await loadIntentions()) };
  if (on) intentions[night] = new Date().toISOString();
  else delete intentions[night];
  await AsyncStorage.setItem(INTENTIONS_KEY, JSON.stringify(intentions));
  return intentions;
}
