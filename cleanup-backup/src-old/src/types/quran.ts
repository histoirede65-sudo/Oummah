export type QuranLanguage = 'ar' | 'en' | 'fr' | (string & {});

export type RevelationPlace = 'makkah' | 'madinah';

export type VerseKey = `${number}:${number}`;

export interface TranslatedName {
  languageName: string;
  name: string;
}

export interface QuranChapter {
  id: number;
  revelationPlace: RevelationPlace;
  revelationOrder?: number;
  bismillahPre?: boolean;
  nameSimple: string;
  nameComplex: string;
  nameArabic: string;
  versesCount: number;
  pages?: readonly [number, number];
  translatedName: TranslatedName;
}

export interface QuranTranslation {
  resourceId: number;
  resourceName: string;
  languageName: string;
  text: string;
}

export interface QuranVerse {
  id: number;
  verseKey: VerseKey;
  chapterId: number;
  verseNumber: number;
  textUthmani: string;
  codeV1?: string;
  codeV2?: string;
  transliteration?: string;
  sajdahNumber?: number;
  juzNumber?: number;
  hizbNumber?: number;
  pageNumber?: number;
  translations: readonly QuranTranslation[];
}

export interface Pagination {
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalRecords: number;
}

export interface PaginatedResult<T> {
  items: readonly T[];
  pagination: Pagination;
}

export interface ChapterQuery {
  language?: QuranLanguage;
}

export interface VersesByChapterQuery extends ChapterQuery {
  translationIds?: readonly number[];
  page?: number;
  perPage?: number;
}

export type RecitationStyle = 'murattal' | 'mujawwad' | 'other';

export interface QuranReciter {
  id: number;
  name: string;
  style: RecitationStyle;
  languageName?: string;
}

export interface QuranAudioTrack {
  id: string;
  chapterId: number;
  reciter: QuranReciter;
  title: string;
  sourceUri: string;
  durationSeconds?: number;
}

export interface AudioTrackQuery extends ChapterQuery {
  reciterId?: number;
}

export type AudioPlaybackStatus = 'idle' | 'ready' | 'playing' | 'paused';

export interface AudioPlayerState {
  track: QuranAudioTrack | null;
  status: AudioPlaybackStatus;
  positionSeconds: number;
  durationSeconds: number;
}
