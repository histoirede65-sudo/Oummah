import AsyncStorage from "@react-native-async-storage/async-storage";

import { sanitizeTranslationText } from "../quran/TranslationText";

import type {
  QuranFoundationRecitation,
  QuranFoundationReciter,
  QuranFoundationSurah,
  QuranFoundationVerse,
} from "./QuranFoundationTypes";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const CACHE_PREFIX = "quran-foundation:v1";
const RETRY_DELAY_MS = 15_000;

function cacheKey(kind: "verses" | "recitation", identity: string) {
  return `${CACHE_PREFIX}:${kind}:${identity}`;
}

async function readCache<T>(key: string): Promise<T | null> {
  const value = await AsyncStorage.getItem(key).catch(() => null);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: unknown) {
  void AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);
}

type RawQuranFoundationWord = {
  position?: number;
  wordPosition?: number;
  word_position?: number;
  textUthmani?: string;
  text_uthmani?: string;
  text?: string;
  codeV1?: string;
  codeV2?: string;
  charTypeName?: string;
  char_type_name?: string;
  translation?: {
    text?: string;
  };
  transliteration?: {
    text?: string;
  };
};

type RawQuranFoundationVerse = QuranFoundationVerse & {
  verse_key?: string;
  verseNumber?: number;
  verse_number?: number;
  text_uthmani?: string;
  text_imlaei?: string;
  juz_number?: number;
  hizb_number?: number;
  page_number?: number;
  codeV1?: string;
  codeV2?: string;
  translation?: string;
  translationText?: string;
  translations?: {
    text?: string;
    textResourceId?: number;
  }[];
  words?: RawQuranFoundationWord[];
};

function isWord(raw: RawQuranFoundationWord) {
  return (raw.charTypeName ?? raw.char_type_name ?? "word") === "word";
}

function collectVerses(payload: unknown): RawQuranFoundationVerse[] {
  if (Array.isArray(payload)) return payload as RawQuranFoundationVerse[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as {
    verses?: RawQuranFoundationVerse[];
    items?: RawQuranFoundationVerse[];
    data?: RawQuranFoundationVerse[];
    response?: {
      verses?: RawQuranFoundationVerse[];
      items?: RawQuranFoundationVerse[];
      data?: RawQuranFoundationVerse[];
    };
  };
  return (
    record.verses ??
    record.items ??
    record.data ??
    record.response?.verses ??
    record.response?.items ??
    record.response?.data ??
    []
  );
}

function mapVerse(
  raw: RawQuranFoundationVerse,
  chapter: number,
): QuranFoundationVerse {
  const parsedVerseNumber = Number(
    raw.verseKey?.split(":")[1] ?? raw.verse_key?.split(":")[1],
  );
  const verseNumber =
    raw.verseNumber ??
    raw.verse_number ??
    (Number.isFinite(parsedVerseNumber) && parsedVerseNumber > 0
      ? parsedVerseNumber
      : raw.id);

  const wordsText = raw.words
    ?.filter(isWord)
    .map((word) => word.textUthmani ?? word.text_uthmani ?? "")
    .join(" ")
    .trim();
  const wordsCodeV1 = raw.words
    ?.filter(isWord)
    .map((word) => word.codeV1 ?? word.text ?? "")
    .join("")
    .trim();
  const wordsCodeV2 = raw.words
    ?.filter(isWord)
    .map((word) => word.codeV2 ?? "")
    .join("")
    .trim();

  const wordTranslation = raw.words
    ?.filter(isWord)
    .map((word) => word.translation?.text)
    .filter(Boolean)
    .join(" ");
  const wordTransliteration = raw.words
    ?.filter(isWord)
    .map((word) => word.transliteration?.text)
    .filter(Boolean)
    .join(" ");
  const translation =
    raw.translations?.[0]?.text ??
    raw.translation ??
    raw.translationText ??
    wordTranslation;
  const transliteration = wordTransliteration;

  return {
    id: Number.isFinite(verseNumber) && verseNumber > 0 ? verseNumber : raw.id,
    verseKey: raw.verseKey ?? raw.verse_key ?? `${chapter}:${verseNumber}`,
    textUthmani:
      raw.textUthmani ?? raw.text_uthmani ?? raw.text_imlaei ?? wordsText ?? "",
    codeV1: raw.codeV1 ?? wordsCodeV1,
    codeV2: raw.codeV2 ?? wordsCodeV2,
    words: raw.words,
    hizbNumber: raw.hizbNumber ?? raw.hizb_number ?? 0,
    juzNumber: raw.juzNumber ?? raw.juz_number ?? 0,
    pageNumber: raw.pageNumber ?? raw.page_number ?? 0,
    ...(translation
      ? {
          translation: sanitizeTranslationText(translation),
          translations: raw.translations,
        }
      : {}),
    ...(transliteration
      ? { transliteration: sanitizeTranslationText(transliteration) }
      : {}),
  };
}

type QuranComTranslationVerse = {
  verse_key: string;
  translations?: {
    text?: string;
  }[];
};

async function getFrenchTranslations(chapter: number) {
  const response = await fetch(
    `https://api.quran.com/api/v4/verses/by_chapter/${chapter}?language=fr&words=false&translations=31&per_page=300`,
  );
  if (!response.ok) return new Map<string, string>();
  const payload = (await response.json()) as {
    verses?: QuranComTranslationVerse[];
  };
  return new Map(
    (payload.verses ?? [])
      .map(
        (verse) =>
          [
            verse.verse_key,
            sanitizeTranslationText(verse.translations?.[0]?.text),
          ] as const,
      )
      .filter(([, text]) => text.length > 0),
  );
}

async function getUnicodeUthmaniTexts(chapter: number) {
  const response = await fetch(
    `https://api.quran.com/api/v4/verses/by_chapter/${chapter}?words=false&fields=text_uthmani&per_page=300`,
  );
  if (!response.ok) return new Map<string, string>();
  const payload = (await response.json()) as {
    verses?: { verse_key: string; text_uthmani?: string }[];
  };
  return new Map(
    (payload.verses ?? [])
      .map(
        (verse) => [verse.verse_key, verse.text_uthmani?.trim() ?? ""] as const,
      )
      .filter(([, text]) => text.length > 0),
  );
}

async function getCompleteChapterVerses(chapter: number) {
  const response = await fetch(
    `https://api.quran.com/api/v4/verses/by_chapter/${chapter}?language=fr&words=true&word_fields=text_uthmani,translation,transliteration&fields=text_uthmani,juz_number,hizb_number,page_number&translations=31&per_page=300`,
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    verses?: RawQuranFoundationVerse[];
  };
  return payload.verses ?? [];
}

export class QuranFoundationClient {
  private surahsCache?: Promise<QuranFoundationSurah[]>;
  private recitersCache?: Promise<QuranFoundationReciter[]>;
  private versesCache = new Map<number, QuranFoundationVerse[]>();
  private recitationsCache = new Map<string, QuranFoundationRecitation>();
  private pendingRetries = new Set<string>();

  private retryLater(key: string, task: () => Promise<void>) {
    if (this.pendingRetries.has(key)) return;
    this.pendingRetries.add(key);
    setTimeout(() => {
      void task()
        .catch(() => undefined)
        .finally(() => this.pendingRetries.delete(key));
    }, RETRY_DELAY_MS);
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${SUPABASE_URL}/functions/v1${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let message = "";

      try {
        message = await response.text();
      } catch {}

      throw new Error(`Quran.Foundation (${response.status}) : ${message}`);
    }

    return response.json() as Promise<T>;
  }

  async getSurahs(): Promise<QuranFoundationSurah[]> {
    if (!this.surahsCache) {
      this.surahsCache =
        this.request<QuranFoundationSurah[]>("/quran-foundation");
    }

    return this.surahsCache;
  }

  async getVerses(chapter: number): Promise<QuranFoundationVerse[]> {
    const storageKey = cacheKey("verses", String(chapter));
    const memoryCached = this.versesCache.get(chapter);
    if (memoryCached) return memoryCached;
    try {
      const verses = await this.fetchVerses(chapter);
      this.versesCache.set(chapter, verses);
      writeCache(storageKey, verses);
      return verses;
    } catch (error) {
      const persisted = await readCache<QuranFoundationVerse[]>(storageKey);
      if (persisted?.length) {
        this.versesCache.set(chapter, persisted);
        this.retryLater(storageKey, async () => {
          const verses = await this.fetchVerses(chapter);
          this.versesCache.set(chapter, verses);
          writeCache(storageKey, verses);
        });
        return persisted;
      }
      throw error;
    }
  }

  private async fetchVerses(chapter: number): Promise<QuranFoundationVerse[]> {
    console.info(`[verses] before API chapter=${chapter}`);
    const payload = await this.request<unknown>(
      `/quran-content?chapter=${chapter}&language=fr&page=1&per_page=300&translations=31`,
    );
    const edgeVerses = collectVerses(payload);
    const completeVerses = await getCompleteChapterVerses(chapter);
    const collected =
      completeVerses.length > edgeVerses.length ? completeVerses : edgeVerses;
    console.info(
      `[verses] after API chapter=${chapter} raw=${collected.length}`,
    );
    const mapped = collected.map((verse) => mapVerse(verse, chapter));
    const [frenchTranslations, unicodeUthmaniTexts] = await Promise.all([
      getFrenchTranslations(chapter),
      getUnicodeUthmaniTexts(chapter),
    ]);
    const translated = mapped.map((verse) => ({
      ...verse,
      textUthmani: unicodeUthmaniTexts.get(verse.verseKey) ?? verse.textUthmani,
      translation: frenchTranslations.get(verse.verseKey) ?? verse.translation,
    }));
    console.info(
      `[verses] after mapping chapter=${chapter} mapped=${mapped.length} withText=${mapped.filter((verse) => verse.textUthmani.length > 0).length}`,
    );
    return translated;
  }

  async getReciters(): Promise<QuranFoundationReciter[]> {
    if (!this.recitersCache) {
      this.recitersCache =
        this.request<QuranFoundationReciter[]>("/quran-audio");
    }

    return this.recitersCache;
  }

  async getRecitation(
    reciter: number,
    chapter: number,
  ): Promise<QuranFoundationRecitation> {
    const identity = `${reciter}:${chapter}`;
    const storageKey = cacheKey("recitation", identity);
    const memoryCached = this.recitationsCache.get(identity);
    if (memoryCached) return memoryCached;
    const fetchRecitation = async () => {
      const recitation = await this.request<QuranFoundationRecitation>(
        `/quran-audio?chapter=${chapter}&reciter=${reciter}`,
      );
      this.recitationsCache.set(identity, recitation);
      writeCache(storageKey, recitation);
      return recitation;
    };
    try {
      return await fetchRecitation();
    } catch (error) {
      const persisted = await readCache<QuranFoundationRecitation>(storageKey);
      if (persisted) {
        this.recitationsCache.set(identity, persisted);
        this.retryLater(storageKey, async () => {
          await fetchRecitation();
        });
        return persisted;
      }
      throw error;
    }
  }

  clearCache() {
    this.surahsCache = undefined;
    this.recitersCache = undefined;
    this.versesCache.clear();
    this.recitationsCache.clear();
  }
}

export const quranFoundationClient = new QuranFoundationClient();
