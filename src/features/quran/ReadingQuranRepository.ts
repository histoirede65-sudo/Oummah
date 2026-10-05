import type { QuranFoundationVerse } from "../quranfoundation/QuranFoundationTypes";
import { sanitizeTranslationText } from "./TranslationText";

type ReadingWord = NonNullable<QuranFoundationVerse["words"]>[number] & {
  code_v1?: string;
  code_v2?: string;
};

type ReadingApiVerse = {
  id: number;
  verse_key: string;
  text_uthmani?: string;
  code_v1?: string;
  code_v2?: string;
  juz_number?: number;
  hizb_number?: number;
  page_number?: number;
  audio_url?: string;
  translations?: { text?: string; resource_id?: number }[];
  words?: ReadingWord[];
};

type ReadingApiChapter = {
  id: number;
  name_simple?: string;
  translated_name?: { name?: string };
};

let englishSurahNamesRequest: Promise<ReadonlyMap<number, string>> | undefined;

function isWord(word: ReadingWord) {
  return (word.charTypeName ?? word.char_type_name ?? "word") === "word";
}

function mapVerse(raw: ReadingApiVerse): QuranFoundationVerse {
  const sourceWords = raw.words?.filter(isWord) ?? [];
  const verseNumber = Number(raw.verse_key.split(":")[1]);
  const arabicFromWords = sourceWords
    .map(
      (word) =>
        word.textUthmani ??
        word.text_uthmani ??
        word.text ??
        word.codeV1 ??
        word.code_v1 ??
        "",
    )
    .filter(Boolean)
    .join(" ");
  // Never rebuild a verse translation from word glosses: the API can fall back
  // to another language for those. Only the requested translation resource is
  // safe to display as the complete verse translation.
  const translation = raw.translations?.[0]?.text;
  const transliteration = sourceWords
    .map((word) => word.transliteration?.text)
    .filter(Boolean)
    .join(" ");

  return {
    id: verseNumber,
    verseKey: raw.verse_key,
    textUthmani: raw.text_uthmani || arabicFromWords,
    codeV1:
      raw.code_v1 ||
      sourceWords.map((word) => word.codeV1 ?? word.code_v1 ?? "").join("") ||
      undefined,
    codeV2:
      raw.code_v2 ||
      sourceWords.map((word) => word.codeV2 ?? word.code_v2 ?? "").join("") ||
      undefined,
    words: sourceWords,
    translation: translation ? sanitizeTranslationText(translation) : undefined,
    transliteration: transliteration
      ? sanitizeTranslationText(transliteration)
      : undefined,
    translations: raw.translations?.map((item) => ({
      text: sanitizeTranslationText(item.text),
      textResourceId: item.resource_id,
    })),
    hizbNumber: raw.hizb_number ?? 0,
    juzNumber: raw.juz_number ?? 0,
    pageNumber: raw.page_number ?? 0,
    audioUrl: raw.audio_url,
  };
}

export const readingQuranRepository = {
  getEnglishSurahNames(): Promise<ReadonlyMap<number, string>> {
    englishSurahNamesRequest ??= fetch(
      "https://api.quran.com/api/v4/chapters?language=en",
    )
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`Quran chapters API failed (${response.status})`);
        const payload = (await response.json()) as {
          chapters?: ReadingApiChapter[];
        };
        return new Map(
          (payload.chapters ?? []).map((chapter) => [
            chapter.id,
            chapter.translated_name?.name || chapter.name_simple || "",
          ]),
        );
      })
      .catch((error) => {
        englishSurahNamesRequest = undefined;
        throw error;
      });
    return englishSurahNamesRequest;
  },

  async getVerses(
    surahId: number,
    language: "fr" | "en" = "fr",
  ): Promise<QuranFoundationVerse[]> {
    const translationResourceId = language === "en" ? 20 : 31;
    const response = await fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?language=${language}&words=true&word_fields=text_uthmani,code_v1,code_v2,translation,transliteration&fields=text_uthmani,code_v1,code_v2,juz_number,hizb_number,page_number&translations=${translationResourceId}&per_page=300`,
    );
    if (!response.ok)
      throw new Error(`Lecture Quran API failed (${response.status})`);
    const payload = (await response.json()) as
      | { verses?: ReadingApiVerse[] }
      | ReadingApiVerse[];
    const verses = Array.isArray(payload) ? payload : (payload.verses ?? []);
    return verses.map(mapVerse);
  },
};
