import type { QuranRepository } from '../../core/repositories';
import { createCacheKey } from '../../core/utils';
import type { ChapterQuery, VersesByChapterQuery } from '../../types/quran';
import {
  QuranFoundationClient,
  type QuranFoundationClientContract,
} from './QuranFoundationClient';
import { cacheRepository as defaultCacheRepository, type CacheRepositoryContract } from '../../core/cache';

export type { QuranRepository } from '../../core/repositories';

export class QuranFoundationRepository implements QuranRepository {
  constructor(
    private readonly client: QuranFoundationClientContract = new QuranFoundationClient(),
    private readonly cache: CacheRepositoryContract = defaultCacheRepository,
  ) {}

  getChapters(query: ChapterQuery = {}) {
    const language = query.language ?? 'fr';
    return this.cache.getOrFetch({
      kind: 'surahs',
      key: createCacheKey({ language }),
      loader: () => this.client.listChapters(query),
    });
  }

  getChapter(chapterId: number, query: ChapterQuery = {}) {
    const language = query.language ?? 'fr';
    return this.cache.getOrFetch({
      kind: 'metadata',
      key: createCacheKey({ chapter: chapterId, language }),
      loader: async () => (await this.getChapters(query)).find((chapter) => chapter.id === chapterId) ?? null,
    });
  }

  getVersesByChapter(chapterId: number, query: VersesByChapterQuery = {}) {
    const language = query.language ?? 'fr';
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 50;
    return this.cache.getOrFetch({
      kind: 'verses',
      key: createCacheKey({ chapter: chapterId, language, page, perPage, translations: query.translationIds }),
      loader: () => this.client.listVersesByChapter(chapterId, query),
    });
  }
}

export const quranRepository: QuranRepository = new QuranFoundationRepository();
