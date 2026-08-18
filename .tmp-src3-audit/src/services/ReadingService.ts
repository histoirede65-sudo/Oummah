import type { OfflineRepository, ReadingPosition } from '../core/offline';
import type { QuranRepository } from '../core/repositories';
import type { ChapterQuery, VersesByChapterQuery } from '../types/quran';

export class ReadingService {
  constructor(
    private readonly quran: QuranRepository,
    private readonly offline: OfflineRepository,
  ) {}

  getChapters(query?: ChapterQuery) {
    return this.quran.getChapters(query);
  }

  getVerses(surahId: number, query?: VersesByChapterQuery) {
    return this.quran.getVersesByChapter(surahId, query);
  }

  resume() {
    return this.offline.getLastReading();
  }

  saveProgress(position: ReadingPosition) {
    return this.offline.saveLastReading(position);
  }
}
