import type { ChapterQuery, PaginatedResult, QuranChapter, QuranVerse, VersesByChapterQuery } from '../../types/quran';

export interface QuranRepository {
  getChapters(query?: ChapterQuery): Promise<readonly QuranChapter[]>;
  getChapter(chapterId: number, query?: ChapterQuery): Promise<QuranChapter | null>;
  getVersesByChapter(chapterId: number, query?: VersesByChapterQuery): Promise<PaginatedResult<QuranVerse>>;
}
