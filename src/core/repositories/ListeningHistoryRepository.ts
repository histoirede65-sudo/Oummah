import type { PlaybackRate, RepeatMode } from '../audio';

export interface ListeningHistoryEntry {
  trackId: string;
  surahId: number;
  reciterId: string;
  positionSeconds: number;
  playbackRate: PlaybackRate;
  repeatMode: RepeatMode;
  wasPlaying: boolean;
  updatedAt: string;
}

export interface ListeningHistoryRepository {
  getLast(): Promise<ListeningHistoryEntry | null>;
  getAll(): Promise<readonly ListeningHistoryEntry[]>;
  save(entry: ListeningHistoryEntry): Promise<void>;
  clear(): Promise<void>;
}
