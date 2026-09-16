import type { ListeningMode } from './ListeningState';
import type { PlaybackRate } from '../types';

export interface ListeningSnapshot {
  version: 1;
  trackId: string;
  surahId: number;
  verseId: number;
  positionSeconds: number;
  durationSeconds: number;
  reciterId: string;
  reciterName: string;
  playbackRate: PlaybackRate;
  mode: ListeningMode;
  wasPlaying: boolean;
  updatedAt: string;
}

export type ListeningSnapshotInput = Omit<ListeningSnapshot, 'version' | 'updatedAt'>;
