import type {
  AudioTrackQuery,
  ChapterQuery,
  PaginatedResult,
  QuranAudioTrack,
  QuranChapter,
  QuranReciter,
  QuranTranslation,
  QuranVerse,
  RecitationStyle,
  VersesByChapterQuery,
} from '../../types/quran';

export interface QuranFoundationClientContract {
  listChapters(query?: ChapterQuery): Promise<readonly QuranChapter[]>;
  getChapter(chapterId: number, query?: ChapterQuery): Promise<QuranChapter | null>;
  listVersesByChapter(
    chapterId: number,
    query?: VersesByChapterQuery,
  ): Promise<PaginatedResult<QuranVerse>>;
  listChapterReciters(query?: ChapterQuery): Promise<readonly QuranReciter[]>;
  getChapterAudio(
    chapterId: number,
    query?: AudioTrackQuery,
    context?: AudioTrackContext,
  ): Promise<QuranAudioTrack | null>;
}

export interface AudioTrackContext {
  reciter: QuranReciter;
  chapter: QuranChapter | null;
}

type EdgeFunctionName = 'quran-surahs' | 'quran-content' | 'quran-audio';

interface RawChapter {
  id: number;
  revelationPlace?: string;
  revelation_place?: string;
  revelationOrder?: number;
  revelation_order?: number;
  bismillahPre?: boolean;
  bismillah_pre?: boolean;
  nameSimple?: string;
  name_simple?: string;
  nameComplex?: string;
  name_complex?: string;
  nameArabic?: string;
  name_arabic?: string;
  versesCount?: number;
  verses_count?: number;
  pages?: number[];
  translatedName?: { languageName?: string; name?: string };
  translated_name?: { language_name?: string; name?: string };
}

interface RawTranslation {
  resourceId?: number;
  resource_id?: number;
  resourceName?: string;
  resource_name?: string;
  languageName?: string;
  language_name?: string;
  text?: string;
}

interface RawVerse {
  id: number;
  verseKey?: string;
  verse_key?: string;
  chapterId?: number;
  chapter_id?: number;
  verseNumber?: number;
  verse_number?: number;
  textUthmani?: string;
  text_uthmani?: string;
  codeV1?: string;
  code_v1?: string;
  codeV2?: string;
  code_v2?: string;
  transliteration?: string;
  sajdahNumber?: number;
  sajdah_number?: number;
  words?: {
    charTypeName?: string;
    char_type_name?: string;
    codeV1?: string;
    codeV2?: string;
    transliteration?: { text?: string };
  }[];
  juzNumber?: number;
  juz_number?: number;
  hizbNumber?: number;
  hizb_number?: number;
  pageNumber?: number;
  page_number?: number;
  translations?: RawTranslation[];
}

interface RawReciter {
  id: number;
  name?: string;
  reciterName?: string;
  reciter_name?: string;
  style?: string | { name?: string; languageName?: string; language_name?: string };
}

interface RawAudioFile {
  id?: number | string;
  chapterId?: number;
  chapter_id?: number;
  audioUrl?: string;
  audio_url?: string;
  fileSize?: number;
  file_size?: number;
}

function requiredPublicConfiguration(name: 'EXPO_PUBLIC_SUPABASE_URL' | 'EXPO_PUBLIC_SUPABASE_ANON_KEY') {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing public application configuration: ${name}`);
  return value;
}

function collection<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function mapChapter(raw: RawChapter): QuranChapter {
  const translated = raw.translatedName ?? raw.translated_name;
  const translatedLanguage = translated && 'languageName' in translated
    ? translated.languageName
    : translated && 'language_name' in translated
      ? translated.language_name
      : undefined;
  const pages = raw.pages?.length === 2
    ? [raw.pages[0], raw.pages[1]] as const
    : undefined;

  return {
    id: raw.id,
    revelationPlace: (raw.revelationPlace ?? raw.revelation_place) === 'madinah' ? 'madinah' : 'makkah',
    revelationOrder: raw.revelationOrder ?? raw.revelation_order,
    bismillahPre: raw.bismillahPre ?? raw.bismillah_pre,
    nameSimple: raw.nameSimple ?? raw.name_simple ?? '',
    nameComplex: raw.nameComplex ?? raw.name_complex ?? raw.nameSimple ?? raw.name_simple ?? '',
    nameArabic: raw.nameArabic ?? raw.name_arabic ?? '',
    versesCount: raw.versesCount ?? raw.verses_count ?? 0,
    pages,
    translatedName: {
      languageName: translatedLanguage ?? '',
      name: translated?.name ?? '',
    },
  };
}

function mapTranslation(raw: RawTranslation): QuranTranslation {
  return {
    resourceId: raw.resourceId ?? raw.resource_id ?? 0,
    resourceName: raw.resourceName ?? raw.resource_name ?? '',
    languageName: raw.languageName ?? raw.language_name ?? '',
    text: raw.text ?? '',
  };
}

function mapVerse(raw: RawVerse): QuranVerse {
  const chapterId = raw.chapterId ?? raw.chapter_id ?? 0;
  const verseNumber = raw.verseNumber ?? raw.verse_number ?? 0;
  const words = raw.words?.filter((word) => (word.charTypeName ?? word.char_type_name ?? 'word') === 'word') ?? [];
  const transliteration = raw.transliteration ?? words.map((word) => word.transliteration?.text).filter(Boolean).join(' ');
  return {
    id: raw.id,
    verseKey: (raw.verseKey ?? raw.verse_key ?? `${chapterId}:${verseNumber}`) as `${number}:${number}`,
    chapterId,
    verseNumber,
    textUthmani: raw.textUthmani ?? raw.text_uthmani ?? '',
    codeV1: raw.codeV1 ?? raw.code_v1 ?? (words.map((word) => word.codeV1 ?? '').join('') || undefined),
    codeV2: raw.codeV2 ?? raw.code_v2 ?? (words.map((word) => word.codeV2 ?? '').join('') || undefined),
    transliteration: transliteration || undefined,
    sajdahNumber: raw.sajdahNumber ?? raw.sajdah_number,
    juzNumber: raw.juzNumber ?? raw.juz_number,
    hizbNumber: raw.hizbNumber ?? raw.hizb_number,
    pageNumber: raw.pageNumber ?? raw.page_number,
    translations: (raw.translations ?? []).map(mapTranslation),
  };
}

function recitationStyle(raw: RawReciter): RecitationStyle {
  const value = typeof raw.style === 'string' ? raw.style : raw.style?.name;
  return value === 'murattal' || value === 'mujawwad' ? value : 'other';
}

function mapReciter(raw: RawReciter): QuranReciter {
  return {
    id: raw.id,
    name: raw.name ?? raw.reciterName ?? raw.reciter_name ?? '',
    style: recitationStyle(raw),
    languageName: typeof raw.style === 'object'
      ? raw.style.languageName ?? raw.style.language_name
      : undefined,
  };
}

/** React Native transport. It can call Supabase Edge Functions only. */
export class QuranFoundationClient implements QuranFoundationClientContract {
  private async invoke(functionName: EdgeFunctionName, params: URLSearchParams): Promise<unknown> {
    const supabaseUrl = requiredPublicConfiguration('EXPO_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
    const anonKey = requiredPublicConfiguration('EXPO_PUBLIC_SUPABASE_ANON_KEY');
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}?${params}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Supabase function ${functionName} failed (${response.status})`);
    return response.json();
  }

  async listChapters(query: ChapterQuery = {}): Promise<readonly QuranChapter[]> {
    const payload = await this.invoke('quran-surahs', new URLSearchParams({
      language: query.language ?? 'fr',
    }));
    const chapters = collection<RawChapter>(payload, 'chapters').map(mapChapter);
    if (chapters.length !== 114) throw new Error(`Expected 114 Quran chapters, received ${chapters.length}`);
    return chapters.sort((left, right) => left.id - right.id);
  }

  async getChapter(chapterId: number, query: ChapterQuery = {}): Promise<QuranChapter | null> {
    return (await this.listChapters(query)).find((chapter) => chapter.id === chapterId) ?? null;
  }

  async listVersesByChapter(
    chapterId: number,
    query: VersesByChapterQuery = {},
  ): Promise<PaginatedResult<QuranVerse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 50;
    const params = new URLSearchParams({
      chapter: String(chapterId),
      language: query.language ?? 'fr',
      page: String(page),
      per_page: String(perPage),
    });
    if (query.translationIds?.length) params.set('translations', query.translationIds.join(','));

    const payload = await this.invoke('quran-content', params);
    const verses = collection<RawVerse>(payload, 'verses').map(mapVerse);
    return {
      items: verses,
      pagination: {
        currentPage: page,
        perPage,
        totalPages: verses.length < perPage ? page : page + 1,
        totalRecords: verses.length,
      },
    };
  }

  async listChapterReciters(query: ChapterQuery = {}): Promise<readonly QuranReciter[]> {
    const payload = await this.invoke('quran-audio', new URLSearchParams({
      language: query.language ?? 'fr',
    }));
    return collection<RawReciter>(payload, 'reciters').map(mapReciter);
  }

  async getChapterAudio(
    chapterId: number,
    query: AudioTrackQuery = {},
    context?: AudioTrackContext,
  ): Promise<QuranAudioTrack | null> {
    const reciters = context ? undefined : await this.listChapterReciters(query);
    const reciter = context?.reciter ?? (query.reciterId === undefined
      ? reciters?.[0]
      : reciters?.find((item) => item.id === query.reciterId));
    if (!reciter) return null;

    const payload = await this.invoke('quran-audio', new URLSearchParams({
      chapter: String(chapterId),
      reciter: String(reciter.id),
    }));
    const raw = payload && typeof payload === 'object'
      ? (payload as { audioFile?: RawAudioFile }).audioFile
      : undefined;
    const sourceUri = raw?.audioUrl ?? raw?.audio_url;
    if (!raw || !sourceUri) return null;

    const chapter = context ? context.chapter : await this.getChapter(chapterId, query);
    return {
      id: String(raw.id ?? `${reciter.id}:${chapterId}`),
      chapterId: raw.chapterId ?? raw.chapter_id ?? chapterId,
      reciter,
      title: chapter?.nameSimple ?? String(chapterId),
      sourceUri,
    };
  }
}
