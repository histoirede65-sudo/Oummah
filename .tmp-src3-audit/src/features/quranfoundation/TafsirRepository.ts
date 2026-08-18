import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const DEFAULT_TAFSIR_SOURCE = 'french_mokhtasar';

export type QuranTafsir = {
  verseKey: string;
  source: string;
  resourceName: string;
  languageName: string;
  text: string;
};

type RawTafsir = {
  verseKey?: string;
  verse_key?: string;
  source?: string;
  resourceName?: string;
  resource_name?: string;
  languageName?: string;
  language_name?: string;
  text?: string;
};

const memoryCache = new Map<string, QuranTafsir>();

function getStorageKey(verseKey: string, source: string) {
  return `quran-foundation:v2:tafsir:${source}:${verseKey}`;
}

function decodeNumericEntity(match: string, value: string) {
  const codePoint = Number(value);
  return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
}

function htmlToPlainText(value: string) {
  return value
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, decodeNumericEntity)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeTafsir(
  payload: unknown,
  requestedVerseKey: string,
  requestedSource: string,
): QuranTafsir {
  const wrapper = payload as { tafsir?: RawTafsir };
  const raw = wrapper.tafsir ?? (payload as RawTafsir);
  const text = htmlToPlainText(raw.text ?? '');

  if (!text) {
    throw new Error(`Le tafsir du verset ${requestedVerseKey} est indisponible.`);
  }

  return {
    verseKey: raw.verseKey ?? raw.verse_key ?? requestedVerseKey,
    source: raw.source ?? requestedSource,
    resourceName:
      raw.resourceName ??
      raw.resource_name ??
      'Al-Mukhtasar fi Tafsir al-Qur’an',
    languageName: raw.languageName ?? raw.language_name ?? 'french',
    text,
  };
}

async function readPersisted(key: string) {
  const value = await AsyncStorage.getItem(key).catch(() => null);
  if (!value) return null;

  try {
    return JSON.parse(value) as QuranTafsir;
  } catch {
    return null;
  }
}

export const tafsirRepository = {
  async getTafsir(
    verseKey: string,
    source = DEFAULT_TAFSIR_SOURCE,
  ): Promise<QuranTafsir> {
    if (!/^\d{1,3}:\d{1,3}$/.test(verseKey)) {
      throw new Error('Identifiant de verset invalide.');
    }

    const identity = `${source}:${verseKey}`;
    const storageKey = getStorageKey(verseKey, source);
    const memoryCached = memoryCache.get(identity);
    if (memoryCached) return memoryCached;

    const persisted = await readPersisted(storageKey);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/quran-tafsir?verse_key=${encodeURIComponent(verseKey)}&source=${encodeURIComponent(source)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${ANON_KEY}`,
            apikey: ANON_KEY,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(
          `Tafsir QuranEnc (${response.status})${details ? ` : ${details}` : ''}`,
        );
      }

      const tafsir = normalizeTafsir(
        await response.json(),
        verseKey,
        source,
      );

      memoryCache.set(identity, tafsir);
      void AsyncStorage.setItem(storageKey, JSON.stringify(tafsir)).catch(
        () => undefined,
      );

      return tafsir;
    } catch (error) {
      if (persisted) {
        memoryCache.set(identity, persisted);
        return persisted;
      }

      throw error;
    }
  },
};
