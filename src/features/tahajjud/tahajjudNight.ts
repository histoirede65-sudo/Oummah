
import { tx, tahajjudLocale } from './tahajjudI18n';/**
 * Moteur de la nuit Tahajjud. Aucun calcul d'horaires ici : tout part des horaires déjà calculés par
 * OUMMAH (MosquePrayerSchedule).
 *
 *   nuit          = Maghrib → Fajr
 *   dernier tiers = du début du 3e tiers jusqu'à Fajr
 *   clé de nuit   = date locale du soir (Maghrib) : la nuit du 3 au 4 octobre a la clé « 2026-10-03 »
 */

export type NightPrayer = { key: string; timestamp: number; time?: string };

/** Subset of MosquePrayerSchedule the engine needs (pure, testable). */
export type NightSchedule = {
  prayers: readonly NightPrayer[];
  tomorrowPrayers: readonly NightPrayer[];
  futurePrayers?: readonly NightPrayer[];
};

export type NightPhase =
  /** Between Fajr and ‘Isha: no night in progress. */
  | 'day'
  /** From ‘Isha to the start of the last third. */
  | 'evening'
  /** Last third in progress, until Fajr. */
  | 'lastThird';

export type TahajjudNight = {
  /** Local date of the evening (YYYY-MM-DD). */
  key: string;
  maghrib: number;
  isha: number;
  fajr: number;
  lastThirdStart: number;
  /** Maghrib → Fajr, in ms. */
  duration: number;
};

export type NightState = {
  phase: NightPhase;
  /** Night in progress (evening / last third), or the next one during the day. */
  night: TahajjudNight;
  /** Night that can still be validated: the current one, or last night until Dhuhr. */
  validatableKey: string | null;
};

const DAY = 86_400_000;

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function shiftDateKey(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function find(prayers: readonly NightPrayer[], key: string) {
  return prayers.find((prayer) => prayer.key === key)?.timestamp ?? null;
}

/**
 * Yesterday's time of a prayer from today's and tomorrow's (the change from one day to the next is
 * nearly constant). Around a daylight-saving change the difference is not meaningful: 24 h earlier.
 */
function previousDay(today: number, tomorrow: number | null) {
  if (tomorrow === null) return today - DAY;
  const step = tomorrow - today - DAY;
  return Math.abs(step) > 20 * 60_000 ? today - DAY : today - DAY - step;
}

export function buildNight(maghrib: number, isha: number, fajr: number): TahajjudNight {
  const duration = fajr - maghrib;
  return {
    key: localDateKey(new Date(maghrib)),
    maghrib,
    isha,
    fajr,
    lastThirdStart: Math.round(maghrib + (duration * 2) / 3),
    duration,
  };
}

export function getNightState(schedule: NightSchedule, now: number): NightState | null {
  const maghrib = find(schedule.prayers, 'Maghrib');
  const isha = find(schedule.prayers, 'Isha');
  const fajr = find(schedule.prayers, 'Fajr');
  const dhuhr = find(schedule.prayers, 'Dhuhr');
  const tomorrowMaghrib = find(schedule.tomorrowPrayers, 'Maghrib');
  const tomorrowIsha = find(schedule.tomorrowPrayers, 'Isha');
  const tomorrowFajr = find(schedule.tomorrowPrayers, 'Fajr');
  if (maghrib === null || isha === null || fajr === null || tomorrowFajr === null) return null;

  const tonight = buildNight(maghrib, isha, tomorrowFajr);

  // After midnight: the night started yesterday evening and ends at today's Fajr.
  if (now < fajr) {
    const lastNight = buildNight(previousDay(maghrib, tomorrowMaghrib), previousDay(isha, tomorrowIsha), fajr);
    return {
      phase: now >= lastNight.lastThirdStart ? 'lastThird' : 'evening',
      night: lastNight,
      validatableKey: lastNight.key,
    };
  }

  if (now >= isha) {
    return {
      phase: now >= tonight.lastThirdStart ? 'lastThird' : 'evening',
      night: tonight,
      validatableKey: tonight.key,
    };
  }

  // Daytime: last night can still be marked until Dhuhr (prayed at 4 am, forgot to tap).
  const morningLimit = dhuhr ?? fajr + 6 * 3_600_000;
  return {
    phase: 'day',
    night: tonight,
    validatableKey: now < morningLimit ? shiftDateKey(tonight.key, -1) : null,
  };
}

/** Upcoming nights (tonight included) from consecutive days of the schedule, for notifications. */
export function upcomingNights(schedule: NightSchedule): TahajjudNight[] {
  const all = [...schedule.prayers, ...schedule.tomorrowPrayers, ...(schedule.futurePrayers ?? [])];
  const days = new Map<string, { maghrib?: number; isha?: number; fajr?: number }>();
  for (const prayer of all) {
    if (prayer.key !== 'Maghrib' && prayer.key !== 'Isha' && prayer.key !== 'Fajr') continue;
    const key = localDateKey(new Date(prayer.timestamp));
    const day = days.get(key) ?? {};
    if (prayer.key === 'Maghrib') day.maghrib = prayer.timestamp;
    if (prayer.key === 'Isha') day.isha = prayer.timestamp;
    if (prayer.key === 'Fajr') day.fajr = prayer.timestamp;
    days.set(key, day);
  }
  const keys = [...days.keys()].sort();
  const nights: TahajjudNight[] = [];
  for (const key of keys) {
    const evening = days.get(key)!;
    const morning = days.get(shiftDateKey(key, 1));
    if (evening.maghrib && evening.isha && morning?.fajr) nights.push(buildNight(evening.maghrib, evening.isha, morning.fajr));
  }
  return nights;
}

// ----- Formatting ----------------------------------------------------------------------------

export function clock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(tahajjudLocale(), { hour: '2-digit', minute: '2-digit' });
}

/** 5 h 47 · 47 min · 1 min */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return tx("{0} min", [Math.max(1, rest)]);
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`;
}

// ----- Wake-up time --------------------------------------------------------------------------

export type AlarmMode = 'start' | 'start30' | 'start60' | 'beforeFajr30' | 'custom';

export const ALARM_MODES: readonly { mode: AlarmMode; label: string }[] = [
  { mode: 'start', get label() { return tx('Début du dernier tiers'); } },
  { mode: 'start30', get label() { return tx('30 minutes après le début'); } },
  { mode: 'start60', get label() { return tx('1 heure après le début'); } },
  { mode: 'beforeFajr30', get label() { return tx('30 minutes avant Fajr'); } },
  { mode: 'custom', get label() { return tx('Heure personnalisée'); } },
];

/** Wake-up time of a night. A custom time is placed in that night (between Maghrib and Fajr). */
export function alarmTime(night: TahajjudNight, mode: AlarmMode, customTime?: string): number {
  switch (mode) {
    case 'start': return night.lastThirdStart;
    case 'start30': return Math.min(night.lastThirdStart + 30 * 60_000, night.fajr - 5 * 60_000);
    case 'start60': return Math.min(night.lastThirdStart + 60 * 60_000, night.fajr - 5 * 60_000);
    case 'beforeFajr30': return night.fajr - 30 * 60_000;
    case 'custom': {
      const match = customTime ? /^(\d{2}):(\d{2})$/.exec(customTime) : null;
      if (!match) return night.lastThirdStart;
      const date = new Date(night.maghrib);
      date.setHours(Number(match[1]), Number(match[2]), 0, 0);
      let timestamp = date.getTime();
      while (timestamp <= night.maghrib) timestamp += DAY;
      return Math.min(timestamp, night.fajr - 60_000);
    }
  }
}

/**
 * Bedtimes for complete sleep cycles (≈ 90 min, + 15 min to fall asleep) before the wake-up time,
 * kept only after ‘Isha. Latest first.
 */
export function bedtimeSuggestions(night: TahajjudNight, wakeUp: number) {
  const suggestions: { at: number; cycles: number; sleep: number }[] = [];
  for (const cycles of [3, 4, 5, 6]) {
    const sleep = cycles * 90 * 60_000;
    const at = wakeUp - sleep - 15 * 60_000;
    if (at >= night.isha) suggestions.push({ at, cycles, sleep });
  }
  return suggestions;
}
