import type { AudioReciter, AudioTrack } from '../../core/audio';
import type { AudioQuery, AudioRepository } from '../../core/repositories';
import { createCacheKey } from '../../core/utils';
import type { ChapterQuery } from '../../types/quran';
import {
  QuranFoundationClient,
  type QuranFoundationClientContract,
} from './QuranFoundationClient';
import { cacheRepository as defaultCacheRepository, type CacheRepositoryContract } from '../../core/cache';

export type { AudioRepository } from '../../core/repositories';

export class QuranFoundationAudioRepository implements AudioRepository {
  constructor(
    private readonly client: QuranFoundationClientContract = new QuranFoundationClient(),
    private readonly cache: CacheRepositoryContract = defaultCacheRepository,
  ) {}

  getReciters(input: string | ChapterQuery = {}): Promise<readonly AudioReciter[]> {
    const query = typeof input === 'string' ? { language: input } : input;
    const language = query.language ?? 'fr';
    return this.cache.getOrFetch({
      kind: 'reciters',
      key: createCacheKey({ language }),
      loader: async () => (await this.client.listChapterReciters(query)).map((reciter) => ({
        ...reciter,
        id: String(reciter.id),
        language: reciter.languageName ?? language,
        country: '',
        audioSource: `quran-foundation:${reciter.id}`,
      })),
    });
  }

  getTrack(chapterId: number, query: AudioQuery = {}): Promise<AudioTrack | null> {
    const language = query.language ?? 'fr';
    const reciter = query.reciterId ?? 'default';
    return this.cache.getOrFetch({
      kind: 'audio',
      key: createCacheKey({ chapter: chapterId, language, reciter: String(reciter) }),
      loader: async () => {
        const reciters = await this.getReciters(query);
        const selectedReciter = query.reciterId === undefined
          ? reciters[0]
          : reciters.find((item) => item.id === String(query.reciterId));
        if (!selectedReciter) return null;

        const numericReciterId = Number(selectedReciter.id);
        if (!Number.isInteger(numericReciterId)) return null;

        const chapter = await this.cache.getOrFetch({
          kind: 'metadata',
          key: createCacheKey({ chapter: chapterId, language }),
          loader: () => this.client.getChapter(chapterId, query),
        });
        const apiReciter = { ...selectedReciter, id: numericReciterId };
        const track = await this.client.getChapterAudio(chapterId, { ...query, reciterId: numericReciterId }, {
          reciter: apiReciter,
          chapter,
        });
        return track ? {
          id: track.id,
          contentType: 'quran',
          contentId: String(track.chapterId),
          surahId: track.chapterId,
          title: track.title,
          creator: selectedReciter,
          reciter: selectedReciter,
          source: { uri: track.sourceUri },
          remoteUri: track.sourceUri,
          durationHint: track.durationSeconds,
          quran: { surahId: track.chapterId, reciter: selectedReciter },
        } : null;
      },
    });
  }
}

export const audioRepository: AudioRepository = new QuranFoundationAudioRepository();
