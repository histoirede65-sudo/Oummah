import type { AudioTrack } from '../audio';
import { storageService, type StorageServiceContract } from '../storage';
import type { QuranChapter, QuranVerse, VerseKey } from '../../types/quran';

export interface Favorite {
  id: string;
  type: 'surah' | 'verse' | 'audio';
  targetId: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  verseKey: VerseKey;
  note?: string;
  createdAt: string;
}

export interface ReadingPosition {
  surahId: number;
  verseNumber: number;
  page?: number;
  scrollOffset?: number;
  displayMode?: string;
  updatedAt: string;
}

export interface ListeningPosition {
  trackId: string;
  surahId: number;
  reciterId: string;
  positionSeconds: number;
  updatedAt: string;
}

export interface OfflineRepository {
  getChapters(language: string): Promise<readonly QuranChapter[] | null>;
  saveChapters(language: string, chapters: readonly QuranChapter[]): Promise<void>;
  getVerses(surahId: number, language: string): Promise<readonly QuranVerse[] | null>;
  saveVerses(surahId: number, language: string, verses: readonly QuranVerse[]): Promise<void>;
  getAudioTrack(trackId: string): Promise<AudioTrack | null>;
  saveAudioTrack(track: AudioTrack): Promise<void>;
  getFavorites(): Promise<readonly Favorite[]>;
  saveFavorites(favorites: readonly Favorite[]): Promise<void>;
  getBookmarks(): Promise<readonly Bookmark[]>;
  saveBookmarks(bookmarks: readonly Bookmark[]): Promise<void>;
  getLastReading(): Promise<ReadingPosition | null>;
  saveLastReading(position: ReadingPosition): Promise<void>;
  getLastListening(): Promise<ListeningPosition | null>;
  saveLastListening(position: ListeningPosition): Promise<void>;
}

const PREFIX = 'oummah:offline:v1';

export class StorageOfflineRepository implements OfflineRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}

  getChapters(language: string) {
    return this.storage.get<readonly QuranChapter[]>(`${PREFIX}:quran:chapters:${language}`);
  }

  saveChapters(language: string, chapters: readonly QuranChapter[]) {
    return this.storage.set(`${PREFIX}:quran:chapters:${language}`, chapters);
  }

  getVerses(surahId: number, language: string) {
    return this.storage.get<readonly QuranVerse[]>(`${PREFIX}:quran:verses:${surahId}:${language}`);
  }

  saveVerses(surahId: number, language: string, verses: readonly QuranVerse[]) {
    return this.storage.set(`${PREFIX}:quran:verses:${surahId}:${language}`, verses);
  }

  getAudioTrack(trackId: string) {
    return this.storage.get<AudioTrack>(`${PREFIX}:audio:${trackId}`);
  }

  saveAudioTrack(track: AudioTrack) {
    return this.storage.set(`${PREFIX}:audio:${track.id}`, track);
  }

  async getFavorites() {
    return await this.storage.get<readonly Favorite[]>(`${PREFIX}:favorites`) ?? [];
  }

  saveFavorites(favorites: readonly Favorite[]) {
    return this.storage.set(`${PREFIX}:favorites`, favorites);
  }

  async getBookmarks() {
    return await this.storage.get<readonly Bookmark[]>(`${PREFIX}:bookmarks`) ?? [];
  }

  saveBookmarks(bookmarks: readonly Bookmark[]) {
    return this.storage.set(`${PREFIX}:bookmarks`, bookmarks);
  }

  getLastReading() {
    return this.storage.get<ReadingPosition>(`${PREFIX}:reading:last`);
  }

  saveLastReading(position: ReadingPosition) {
    return this.storage.set(`${PREFIX}:reading:last`, position);
  }

  getLastListening() {
    return this.storage.get<ListeningPosition>(`${PREFIX}:listening:last`);
  }

  saveLastListening(position: ListeningPosition) {
    return this.storage.set(`${PREFIX}:listening:last`, position);
  }
}

export const offlineRepository: OfflineRepository = new StorageOfflineRepository();
