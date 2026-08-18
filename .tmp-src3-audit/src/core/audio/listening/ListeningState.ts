import type { PlaybackRate } from '../types';

export type ListeningMode = 'normal' | 'tadabbur';

export interface ListeningState {
  version: 1;
  sessionId: string;
  trackId: string;
  surahId: number;
  verseId: number | null;
  positionSeconds: number;
  reciterId: string;
  reciterName: string;
  playbackRate: PlaybackRate;
  mode: ListeningMode;
  stoppedAt: string;
}

export interface ListeningStateInput extends Omit<ListeningState, 'version' | 'sessionId' | 'stoppedAt'> {
  sessionId?: string;
}
