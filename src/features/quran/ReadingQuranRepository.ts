import type { QuranFoundationVerse } from '../quranfoundation/QuranFoundationTypes';

type ReadingWord = NonNullable<QuranFoundationVerse['words']>[number] & {
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

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function isWord(word: ReadingWord) {
  return (word.charTypeName ?? word.char_type_name ?? 'word') === 'word';
}

function mapVerse(raw: ReadingApiVerse): QuranFoundationVerse {
  const words = raw.words?.filter(isWord) ?? [];
  const verseNumber = Number(raw.verse_key.split(':')[1]);
  const arabicFromWords = words.map((word) => word.textUthmani ?? word.text_uthmani ?? word.text ?? word.codeV1 ?? word.code_v1 ?? '').filter(Boolean).join(' ');
  const translation = raw.translations?.[0]?.text ?? words.map((word) => word.translation?.text).filter(Boolean).join(' ');
  const transliteration = words.map((word) => word.transliteration?.text).filter(Boolean).join(' ');

  return {
    id: verseNumber,
    verseKey: raw.verse_key,
    textUthmani: raw.text_uthmani || arabicFromWords,
    codeV1: raw.code_v1 || words.map((word) => word.codeV1 ?? word.code_v1 ?? '').join('') || undefined,
    codeV2: raw.code_v2 || words.map((word) => word.codeV2 ?? word.code_v2 ?? '').join('') || undefined,
    words,
    translation: translation ? stripHtml(translation) : undefined,
    transliteration: transliteration ? stripHtml(transliteration) : undefined,
    translations: raw.translations?.map((item) => ({ text: stripHtml(item.text ?? ''), textResourceId: item.resource_id })),
    hizbNumber: raw.hizb_number ?? 0,
    juzNumber: raw.juz_number ?? 0,
    pageNumber: raw.page_number ?? 0,
    audioUrl: raw.audio_url,
  };
}

export const readingQuranRepository = {
  async getVerses(surahId: number): Promise<QuranFoundationVerse[]> {
    const response = await fetch(
      `https://api.quran.com/api/v4/verses/by_chapter/${surahId}?language=fr&words=true&word_fields=text_uthmani,code_v1,code_v2,translation,transliteration&fields=text_uthmani,code_v1,code_v2,juz_number,hizb_number,page_number&translations=31&per_page=300`,
    );
    if (!response.ok) throw new Error(`Lecture Quran API failed (${response.status})`);
    const payload = await response.json() as { verses?: ReadingApiVerse[] } | ReadingApiVerse[];
    const verses = Array.isArray(payload) ? payload : payload.verses ?? [];
    return verses.map(mapVerse);
  },
};
