import AsyncStorage from '@react-native-async-storage/async-storage';

export type MosquePrayerKey =
  | 'Fajr'
  | 'Dhuhr'
  | 'Asr'
  | 'Maghrib'
  | 'Isha';

export type MosquePrayerTime = {
  key: MosquePrayerKey;
  label: string;
  time: string;
  timestamp: number;
};

export type MosquePrayerSchedule = {
  dateKey: string;
  dateLabel: string;
  hijriDateLabel?: string;
  timezone: string;
  methodName: string;
  prayers: MosquePrayerTime[];
  tomorrowPrayers: MosquePrayerTime[];
  tomorrowFajr: MosquePrayerTime;
  futurePrayers?: MosquePrayerTime[];
  /** Lever du soleil (Chourouk) du jour, donné par Aladhan. Absent des horaires mis en cache avant cet ajout. */
  sunrise?: { time: string; timestamp: number };
  tomorrowSunrise?: { time: string; timestamp: number };
  fromCache: boolean;
};

export type PrayerCalculationSettings = {
  mode: 'preset' | 'custom';
  method: number;
  fajrAngle: number;
  ishaAngle: number;
  scheduleSource: 'mosque' | 'calculation';
};

export const DEFAULT_PRAYER_SCHEDULE_DAYS = 2;
// Five prayers per day × seven days keeps the native pending-notification
// queue comfortably below iOS limits while covering several days offline.
export const ADHAN_SCHEDULE_DAYS = 7;

export const DEFAULT_PRAYER_CALCULATION_SETTINGS: PrayerCalculationSettings = {
  mode: 'custom', method: 12, fajrAngle: 15, ishaAngle: 15, scheduleSource: 'mosque',
};

const CALCULATION_SETTINGS_KEY = 'oummah.prayer.calculation-settings.v1';

const SUPPORTED_PRAYER_ANGLES = [12, 15, 16, 17, 17.5, 18, 18.5, 19.5, 20] as const;

function isSupportedPrayerAngle(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && SUPPORTED_PRAYER_ANGLES.includes(value as typeof SUPPORTED_PRAYER_ANGLES[number]);
}

export async function loadPrayerCalculationSettings(): Promise<PrayerCalculationSettings> {
  try {
    const raw = await AsyncStorage.getItem(CALCULATION_SETTINGS_KEY);
    if (!raw) return DEFAULT_PRAYER_CALCULATION_SETTINGS;
    const value = JSON.parse(raw) as Partial<PrayerCalculationSettings>;
    const fajrAngle = isSupportedPrayerAngle(value.fajrAngle)
      ? value.fajrAngle
      : DEFAULT_PRAYER_CALCULATION_SETTINGS.fajrAngle;
    const ishaAngle = isSupportedPrayerAngle(value.ishaAngle)
      ? value.ishaAngle
      : DEFAULT_PRAYER_CALCULATION_SETTINGS.ishaAngle;
    const migrated: PrayerCalculationSettings = {
      ...DEFAULT_PRAYER_CALCULATION_SETTINGS,
      ...value,
      // France is the only calculation preset. Legacy method IDs are ignored.
      mode: 'custom',
      method: 12,
      fajrAngle,
      ishaAngle,
      scheduleSource: value.scheduleSource === 'calculation' ? 'calculation' : 'mosque',
    };
    // Persist the normalized value so an old country/method cannot be reused later.
    if (JSON.stringify(migrated) !== raw) {
      await AsyncStorage.setItem(CALCULATION_SETTINGS_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch { return DEFAULT_PRAYER_CALCULATION_SETTINGS; }
}
export async function savePrayerCalculationSettings(value: PrayerCalculationSettings): Promise<void> {
  await AsyncStorage.setItem(CALCULATION_SETTINGS_KEY, JSON.stringify(value));
}

export async function setPrayerScheduleSource(
  scheduleSource: PrayerCalculationSettings['scheduleSource'],
): Promise<void> {
  const current = await loadPrayerCalculationSettings();
  await savePrayerCalculationSettings({ ...current, scheduleSource });
}

export function getNextPrayer(
  schedule: MosquePrayerSchedule,
  now: number = Date.now(),
): MosquePrayerTime | null {
  const prayers = [
    ...schedule.prayers,
    schedule.tomorrowFajr,
  ];

  return (
    prayers.find(
      (prayer) => prayer.timestamp > now,
    ) ?? null
  );
}

type AladhanTimingsResponse = {
  code?: number;
  status?: string;
  data?: {
    timings?: Record<string, string | undefined>;
    date?: {
      readable?: string;
      gregorian?: {
        date?: string;
      };
      hijri?: {
        day?: string;
        year?: string;
        month?: {
          en?: string;
          ar?: string;
        };
      };
    };
    meta?: {
      timezone?: string;
      method?: {
        name?: string;
      };
    };
  };
};

type CachedPrayerSchedule = Omit<MosquePrayerSchedule, 'fromCache'> & {
  savedAt: number;
};

const API_BASE_URL = 'https://api.aladhan.com/v1';
const SCHOOL = 0;
const REQUEST_TIMEOUT_MS = 15_000;
const CACHE_MAX_AGE_MS = 48 * 60 * 60 * 1000;

const PRAYER_DEFINITIONS: ReadonlyArray<{
  key: MosquePrayerKey;
  label: string;
}> = [
  { key: 'Fajr', label: 'Fajr' },
  { key: 'Dhuhr', label: 'Dhohr' },
  { key: 'Asr', label: 'Asr' },
  { key: 'Maghrib', label: 'Maghrib' },
  { key: 'Isha', label: 'Isha' },
];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function getLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
}

function getCacheKey(
  latitude: number,
  longitude: number,
  dateKey: string,
  calculation: PrayerCalculationSettings,
) {
  return [
    'oummah.mosque.prayers.v2',
    latitude.toFixed(4),
    longitude.toFixed(4),
    dateKey,
    calculation.mode,
    String(calculation.method),
    String(calculation.fajrAngle),
    String(calculation.ishaAngle),
  ].join(':');
}

function getUnixTimestamp(date: Date) {
  return Math.floor(date.getTime() / 1_000);
}

function cleanPrayerTime(value: string | undefined) {
  const match = value?.match(/(\d{1,2}):(\d{2})/);

  if (!match) {
    throw new Error('PRAYER_TIME_INVALID');
  }

  return `${pad(Number(match[1]))}:${match[2]}`;
}

function parseGregorianDate(value: string | undefined) {
  const match = value?.match(
    /^(\d{2})-(\d{2})-(\d{4})$/,
  );

  if (!match) {
    throw new Error('PRAYER_DATE_INVALID');
  }

  return {
    day: Number(match[1]),
    month: Number(match[2]),
    year: Number(match[3]),
  };
}

function getTimeZoneOffset(
  timestamp: number,
  timezone: string,
): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const values: Record<string, string> = {};

  for (const part of formatter.formatToParts(
    new Date(timestamp),
  )) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return representedAsUtc - timestamp;
}

function createPrayerTimestamp(
  gregorianDate: string | undefined,
  prayerTime: string,
  timezone: string,
) {
  const { day, month, year } =
    parseGregorianDate(gregorianDate);
  const [hour, minute] = prayerTime
    .split(':')
    .map(Number);

  const desiredWallClockAsUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0,
  );

  try {
    let timestamp = desiredWallClockAsUtc;

    for (let iteration = 0; iteration < 2; iteration += 1) {
      timestamp =
        desiredWallClockAsUtc -
        getTimeZoneOffset(timestamp, timezone);
    }

    return timestamp;
  } catch {
    return new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
      0,
    ).getTime();
  }
}

function formatDateLabel(
  timestamp: number,
  timezone: string,
) {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: timezone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(timestamp));
  } catch {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(timestamp));
  }
}

function formatHijriDate(
  response: AladhanTimingsResponse,
) {
  const hijri = response.data?.date?.hijri;

  if (!hijri?.day || !hijri.year || !hijri.month?.en) {
    return undefined;
  }

  return `${hijri.day} ${hijri.month.en} ${hijri.year}`;
}

function buildPrayer(
  response: AladhanTimingsResponse,
  key: MosquePrayerKey,
  label: string,
): MosquePrayerTime {
  const data = response.data;

  if (!data?.timings || !data.date?.gregorian?.date) {
    throw new Error('PRAYER_DATA_INVALID');
  }

  const timezone = data.meta?.timezone || 'Europe/Paris';
  const time = cleanPrayerTime(data.timings[key]);

  return {
    key,
    label,
    time,
    timestamp: createPrayerTimestamp(
      data.date.gregorian.date,
      time,
      timezone,
    ),
  };
}

function buildSchedule(
  todayResponse: AladhanTimingsResponse,
  tomorrowResponse: AladhanTimingsResponse,
  futureResponses: readonly AladhanTimingsResponse[],
  dateKey: string,
): MosquePrayerSchedule {
  const timezone =
    todayResponse.data?.meta?.timezone || 'Europe/Paris';

  const prayers = PRAYER_DEFINITIONS.map(({ key, label }) =>
    buildPrayer(todayResponse, key, label),
  );

  const tomorrowPrayers = PRAYER_DEFINITIONS.map(({ key, label }) =>
    buildPrayer(tomorrowResponse, key, label),
  );
  const tomorrowFajr = tomorrowPrayers[0];
  const futurePrayers = futureResponses.flatMap((response) =>
    PRAYER_DEFINITIONS.map(({ key, label }) => buildPrayer(response, key, label)),
  );

  return {
    dateKey,
    dateLabel: formatDateLabel(
      prayers[0].timestamp,
      timezone,
    ),
    hijriDateLabel: formatHijriDate(todayResponse),
    timezone,
    methodName:
      todayResponse.data?.meta?.method?.name ||
      'Union Organization Islamic de France',
    prayers,
    tomorrowPrayers,
    tomorrowFajr,
    futurePrayers,
    sunrise: buildSunrise(todayResponse),
    tomorrowSunrise: buildSunrise(tomorrowResponse),
    fromCache: false,
  };
}

function buildSunrise(response: AladhanTimingsResponse) {
  const data = response.data;
  if (!data?.timings?.Sunrise || !data.date?.gregorian?.date) return undefined;
  try {
    const time = cleanPrayerTime(data.timings.Sunrise);
    return {
      time,
      timestamp: createPrayerTimestamp(data.date.gregorian.date, time, data.meta?.timezone || 'Europe/Paris'),
    };
  } catch {
    return undefined;
  }
}

async function fetchPrayerDay(
  date: Date,
  latitude: number,
  longitude: number,
  externalSignal?: AbortSignal,
  calculation: PrayerCalculationSettings = DEFAULT_PRAYER_CALCULATION_SETTINGS,
) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    REQUEST_TIMEOUT_MS,
  );

  const abortFromExternalSignal = () =>
    timeoutController.abort();

  if (externalSignal?.aborted) {
    timeoutController.abort();
  } else {
    externalSignal?.addEventListener(
      'abort',
      abortFromExternalSignal,
      { once: true },
    );
  }

  const query = [
    `latitude=${encodeURIComponent(latitude)}`,
    `longitude=${encodeURIComponent(longitude)}`,
    `method=${calculation.mode === 'custom' ? 99 : calculation.method}`,
    ...(calculation.mode === 'custom' ? [`methodSettings=${calculation.fajrAngle},null,${calculation.ishaAngle}`] : []),
    `school=${SCHOOL}`,
  ].join('&');

  const url =
    `${API_BASE_URL}/timings/${getUnixTimestamp(date)}?` +
    query;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      throw new Error(`PRAYER_HTTP_${response.status}`);
    }

    const payload =
      (await response.json()) as AladhanTimingsResponse;

    if (payload.code !== 200 || !payload.data?.timings) {
      throw new Error('PRAYER_RESPONSE_INVALID');
    }

    return payload;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener(
      'abort',
      abortFromExternalSignal,
    );
  }
}

async function readCachedSchedule(
  cacheKey: string,
): Promise<MosquePrayerSchedule | null> {
  try {
    const rawValue = await AsyncStorage.getItem(cacheKey);

    if (!rawValue) return null;

    const cached = JSON.parse(
      rawValue,
    ) as CachedPrayerSchedule;

    if (
      !cached.savedAt ||
      Date.now() - cached.savedAt > CACHE_MAX_AGE_MS ||
      !Array.isArray(cached.prayers) ||
      !cached.tomorrowFajr ||
      !Array.isArray(cached.tomorrowPrayers)
    ) {
      return null;
    }

    return {
      dateKey: cached.dateKey,
      dateLabel: cached.dateLabel,
      hijriDateLabel: cached.hijriDateLabel,
      timezone: cached.timezone,
      methodName: cached.methodName,
      prayers: cached.prayers,
      tomorrowPrayers: cached.tomorrowPrayers,
      tomorrowFajr: cached.tomorrowFajr,
      futurePrayers: Array.isArray(cached.futurePrayers) ? cached.futurePrayers : [],
      fromCache: true,
    };
  } catch {
    return null;
  }
}

async function writeCachedSchedule(
  cacheKey: string,
  schedule: MosquePrayerSchedule,
) {
  const cachedSchedule: CachedPrayerSchedule = {
    dateKey: schedule.dateKey,
    dateLabel: schedule.dateLabel,
    hijriDateLabel: schedule.hijriDateLabel,
    timezone: schedule.timezone,
    methodName: schedule.methodName,
    prayers: schedule.prayers,
    tomorrowPrayers: schedule.tomorrowPrayers,
    tomorrowFajr: schedule.tomorrowFajr,
    futurePrayers: schedule.futurePrayers ?? [],
    savedAt: Date.now(),
  };

  await AsyncStorage.setItem(
    cacheKey,
    JSON.stringify(cachedSchedule),
  );
}

export async function getMosquePrayerSchedule(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
  calculation: PrayerCalculationSettings = DEFAULT_PRAYER_CALCULATION_SETTINGS,
  requestedDays: number = DEFAULT_PRAYER_SCHEDULE_DAYS,
): Promise<MosquePrayerSchedule> {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const dateKey = getLocalDateKey(today);
  const cacheKey = getCacheKey(
    latitude,
    longitude,
    dateKey,
    calculation,
  );

  try {
    const scheduleDays = Math.min(
      ADHAN_SCHEDULE_DAYS,
      Math.max(DEFAULT_PRAYER_SCHEDULE_DAYS, Math.floor(requestedDays)),
    );
    const responses = await Promise.all(
      Array.from({ length: scheduleDays }, (_, dayOffset) =>
        fetchPrayerDay(getDateOffset(today, dayOffset), latitude, longitude, signal, calculation),
      ),
    );
    const [todayResponse, tomorrowResponse, ...futureResponses] = responses;

    const schedule = buildSchedule(
      todayResponse,
      tomorrowResponse,
      futureResponses,
      dateKey,
    );

    await writeCachedSchedule(
      cacheKey,
      schedule,
    ).catch(() => undefined);

    return schedule;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      throw error;
    }

    const cachedSchedule =
      await readCachedSchedule(cacheKey);

    if (cachedSchedule) {
      return cachedSchedule;
    }

    throw error;
  }
}

function getDateOffset(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(12, 0, 0, 0);
  return next;
}
