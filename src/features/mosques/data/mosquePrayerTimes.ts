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
  tomorrowFajr: MosquePrayerTime;
  futurePrayers?: MosquePrayerTime[];
  fromCache: boolean;
};

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
const CALCULATION_METHOD = 12;
const SCHOOL = 0;
const REQUEST_TIMEOUT_MS = 15_000;
const CACHE_MAX_AGE_MS = 18 * 60 * 60 * 1000;

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
) {
  return [
    'oummah.mosque.prayers.v1',
    latitude.toFixed(4),
    longitude.toFixed(4),
    dateKey,
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
  dateKey: string,
): MosquePrayerSchedule {
  const timezone =
    todayResponse.data?.meta?.timezone || 'Europe/Paris';

  const prayers = PRAYER_DEFINITIONS.map(({ key, label }) =>
    buildPrayer(todayResponse, key, label),
  );

  const tomorrowFajr = buildPrayer(
    tomorrowResponse,
    'Fajr',
    'Fajr',
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
    tomorrowFajr,
    fromCache: false,
  };
}

async function fetchPrayerDay(
  date: Date,
  latitude: number,
  longitude: number,
  externalSignal?: AbortSignal,
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
    `method=${CALCULATION_METHOD}`,
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
      !Array.isArray(cached.futurePrayers)
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
      tomorrowFajr: cached.tomorrowFajr,
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
    tomorrowFajr: schedule.tomorrowFajr,
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
): Promise<MosquePrayerSchedule> {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const dateKey = getLocalDateKey(today);
  const cacheKey = getCacheKey(
    latitude,
    longitude,
    dateKey,
  );

  try {
    const responses = await Promise.all(
      Array.from({ length: 7 }, (_, index) =>
        fetchPrayerDay(
          getDateOffset(today, index),
          latitude,
          longitude,
          signal,
        ),
      ),
    );
    const [todayResponse, tomorrowResponse, ...futureResponses] = responses;

    const schedule = buildSchedule(
      todayResponse,
      tomorrowResponse,
      dateKey,
    );
    schedule.futurePrayers = [tomorrowResponse, ...futureResponses].flatMap((response) =>
      PRAYER_DEFINITIONS.map(({ key, label }) => buildPrayer(response, key, label)),
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
