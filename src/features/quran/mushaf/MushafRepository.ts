import * as Font from 'expo-font';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Pages of the Madinah Mushaf (604 pages, Hafs), drawn with the King Fahd Complex fonts (QPC), as on
 * quran.com: one font per page, each word is a glyph placed on its exact line. V2 = black text,
 * V4 = the same glyphs with the tajweed colours built into the font (COLRv1).
 * Fonts and layouts are downloaded on first read and kept on the phone.
 */

export const MUSHAF_PAGE_COUNT = 604;
export const MUSHAF_LINES_PER_PAGE = 15;
export type MushafStyle = 'plain' | 'tajweed';

export type MushafWord = {
  /** Glyph of this word in the page font. */
  code: string;
  verseKey: string;
  /** Position among the verse's words (1..n). null for the end-of-verse marker. */
  position: number | null;
};
export type MushafLine = { number: number; words: MushafWord[] };
export type MushafPage = {
  page: number;
  lines: MushafLine[];
  /** Surahs starting on this page, with the line where their first verse begins. */
  surahStarts: { chapter: number; firstLine: number }[];
  /** First verse of the page ("2:6"), to know where the page sits in the Quran. */
  firstVerseKey: string;
};

const API = 'https://api.quran.com/api/v4';
const FONT_CDN = 'https://verses.quran.foundation/fonts/quran/hafs';
const ROOT = `${FileSystem.documentDirectory ?? ''}mushaf/`;

const pages = new Map<number, Promise<MushafPage>>();
const fonts = new Map<string, Promise<string>>();

export const mushafFontFamily = (page: number, style: MushafStyle) => `qpc-${style === 'tajweed' ? 'v4' : 'v2'}-p${page}`;

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

type ApiWord = { position: number; char_type_name: string; code_v2: string; line_number: number };
type ApiVerse = { verse_key: string; verse_number: number; chapter_id?: number; words: ApiWord[] };

function toPage(page: number, verses: ApiVerse[]): MushafPage {
  const byLine = new Map<number, MushafWord[]>();
  const surahStarts: MushafPage['surahStarts'] = [];
  for (const verse of verses) {
    const chapter = verse.chapter_id ?? Number(verse.verse_key.split(':')[0]);
    if (verse.verse_number === 1) surahStarts.push({ chapter, firstLine: Math.min(...verse.words.map((word) => word.line_number)) });
    for (const word of verse.words) {
      const list = byLine.get(word.line_number) ?? [];
      list.push({ code: word.code_v2, verseKey: verse.verse_key, position: word.char_type_name === 'word' ? word.position : null });
      byLine.set(word.line_number, list);
    }
  }
  return {
    page,
    lines: [...byLine.entries()].sort((a, b) => a[0] - b[0]).map(([number, words]) => ({ number, words })),
    surahStarts,
    firstVerseKey: verses[0]?.verse_key ?? '',
  };
}

/** Layout of one page: words with their line, from the file kept on the phone or from quran.com. */
export function getMushafPage(page: number): Promise<MushafPage> {
  const cached = pages.get(page);
  if (cached) return cached;
  const task = (async () => {
    const file = `${ROOT}layout/p${page}.json`;
    const info = await FileSystem.getInfoAsync(file);
    if (info.exists) {
      try {
        return toPage(page, JSON.parse(await FileSystem.readAsStringAsync(file)) as ApiVerse[]);
      } catch {
        // Damaged file: downloaded again below.
      }
    }
    const response = await fetch(`${API}/verses/by_page/${page}?words=true&word_fields=code_v2,line_number&fields=chapter_id&per_page=50`);
    if (!response.ok) throw new Error('MUSHAF_PAGE_UNAVAILABLE');
    const verses = ((await response.json()) as { verses: ApiVerse[] }).verses;
    if (!verses?.length) throw new Error('MUSHAF_PAGE_UNAVAILABLE');
    const slim = verses.map((verse) => ({
      verse_key: verse.verse_key,
      verse_number: verse.verse_number,
      chapter_id: verse.chapter_id,
      words: verse.words.map(({ position, char_type_name, code_v2, line_number }) => ({ position, char_type_name, code_v2, line_number })),
    }));
    await ensureDir(`${ROOT}layout/`).catch(() => undefined);
    await FileSystem.writeAsStringAsync(file, JSON.stringify(slim)).catch(() => undefined);
    return toPage(page, slim);
  })();
  pages.set(page, task);
  task.catch(() => pages.delete(page));
  return task;
}

/** Downloads (once) and registers the font of a page. Resolves with its family name. */
export function loadMushafFont(page: number, style: MushafStyle): Promise<string> {
  const family = mushafFontFamily(page, style);
  const cached = fonts.get(family);
  if (cached) return cached;
  const task = (async () => {
    if (Font.isLoaded(family)) return family;
    const folder = style === 'tajweed' ? 'v4' : 'v2';
    const dir = `${ROOT}fonts/${folder}/`;
    const file = `${dir}p${page}.ttf`;
    const info = await FileSystem.getInfoAsync(file);
    if (!info.exists || !info.size) {
      await ensureDir(dir);
      const url = style === 'tajweed' ? `${FONT_CDN}/v4/colrv1/ttf/p${page}.ttf` : `${FONT_CDN}/v2/ttf/p${page}.ttf`;
      const result = await FileSystem.downloadAsync(url, file);
      if (result.status !== 200) {
        await FileSystem.deleteAsync(file, { idempotent: true }).catch(() => undefined);
        throw new Error('MUSHAF_FONT_UNAVAILABLE');
      }
    }
    await Font.loadAsync({ [family]: file });
    return family;
  })();
  fonts.set(family, task);
  task.catch(() => fonts.delete(family));
  return task;
}

/** Layout and font together; the neighbours are prepared in the background for a smooth page turn. */
export async function prepareMushafPage(page: number, style: MushafStyle) {
  const [layout, family] = await Promise.all([getMushafPage(page), loadMushafFont(page, style)]);
  for (const next of [page + 1, page - 1]) {
    if (next >= 1 && next <= MUSHAF_PAGE_COUNT) {
      void getMushafPage(next).catch(() => undefined);
      void loadMushafFont(next, style).catch(() => undefined);
    }
  }
  return { layout, family };
}
