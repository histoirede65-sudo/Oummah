import AsyncStorage from '@react-native-async-storage/async-storage';
import { SURAHS, type Surah } from '../../data/surahs';
import { readingQuranRepository } from '../quran/ReadingQuranRepository';

/**
 * « Que réciter dans ma prière ? » : short surahs sorted by length, read from OUMMAH's Quran source
 * (Arabic, phonetic, French translation), kept on the phone for the night (offline).
 */

export type ReciteVerse = { number: number; arabic: string; phonetic: string | null; translation: string | null };
export type ReciteGroup = { id: string; title: string; hint: string; surahs: Surah[] };

const CACHE_PREFIX = 'oummah.qiyam.recite.surah.v1.';
const KNOWN_KEY = 'oummah.qiyam.recite.known.v1';

/** Juz ‘Amma + the surahs of the night (As-Sajda, Al-Mulk, Al-Muzzammil). */
const NIGHT_SURAHS = [32, 67, 73];
const CANDIDATES = SURAHS.filter((surah) => surah.id >= 78 || NIGHT_SURAHS.includes(surah.id));

const byLength = (a: Surah, b: Surah) => a.verses - b.verses || b.id - a.id;

export const RECITE_GROUPS: ReciteGroup[] = [
  {
    id: 'essential', title: 'À chaque rak‘a', hint: 'Al-Fatiha est récitée dans chaque unité de prière.',
    surahs: SURAHS.filter((surah) => surah.id === 1),
  },
  {
    id: 'very-short', title: 'Très courtes', hint: 'Moins de 7 versets : idéales pour commencer.',
    surahs: CANDIDATES.filter((surah) => surah.verses < 7).sort(byLength),
  },
  {
    id: 'short', title: 'Courtes', hint: 'De 7 à 11 versets.',
    surahs: CANDIDATES.filter((surah) => surah.verses >= 7 && surah.verses <= 11).sort(byLength),
  },
  {
    id: 'medium', title: 'Moyennes', hint: 'De 12 à 30 versets : pour prolonger la station debout.',
    surahs: CANDIDATES.filter((surah) => surah.verses >= 12 && surah.verses <= 30).sort(byLength),
  },
  {
    id: 'long', title: 'Pour aller plus loin', hint: 'Plus de 30 versets.',
    surahs: CANDIDATES.filter((surah) => surah.verses > 30).sort(byLength),
  },
];

export const surahById = (id: number) => SURAHS.find((surah) => surah.id === id) ?? null;

/** Ordered list used for « sourate suivante / précédente » in the reader. */
export const RECITE_ORDER = RECITE_GROUPS.flatMap((group) => group.surahs.map((surah) => surah.id));

export async function getReciteSurah(id: number): Promise<ReciteVerse[]> {
  const key = `${CACHE_PREFIX}${id}`;
  const cached = await AsyncStorage.getItem(key).catch(() => null);
  if (cached) {
    try {
      return JSON.parse(cached) as ReciteVerse[];
    } catch {
      // Refetched below.
    }
  }
  const verses = await readingQuranRepository.getVerses(id, 'fr');
  const mapped = verses.map((verse) => ({
    number: verse.id,
    arabic: verse.textUthmani,
    phonetic: verse.transliteration ?? null,
    translation: verse.translation ?? null,
  }));
  if (mapped.length) await AsyncStorage.setItem(key, JSON.stringify(mapped)).catch(() => undefined);
  return mapped;
}

/** Warms the cache of the shortest surahs, so they work at night without network. */
export async function prefetchReciteSurahs() {
  for (const id of [1, 112, 113, 114, 108, 103]) {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${id}`).catch(() => null);
    if (!cached) await getReciteSurah(id).catch(() => undefined);
  }
}

export async function loadKnownSurahs(): Promise<number[]> {
  try {
    const value = JSON.parse((await AsyncStorage.getItem(KNOWN_KEY)) ?? '[]') as unknown;
    return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
  } catch {
    return [];
  }
}

export async function toggleKnownSurah(id: number): Promise<number[]> {
  const known = await loadKnownSurahs();
  const next = known.includes(id) ? known.filter((item) => item !== id) : [...known, id];
  await AsyncStorage.setItem(KNOWN_KEY, JSON.stringify(next)).catch(() => undefined);
  return next;
}
