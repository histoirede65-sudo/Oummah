import type { AudioTrack, PlaybackRate, RepeatMode } from './types';

export interface AudioPlayerStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  didJustFinish: boolean;
  position: number;
  duration: number;
  playbackRate: number;
  error: string | null;
}

export type AudioPlayerStatusListener = (status: AudioPlayerStatus) => void;

/** Port implemented by a platform adapter such as Expo Audio. */
export interface AudioPlayer {
  load(track: AudioTrack): void;
  play(): void;
  pause(): void;
  stop(): Promise<void>;
  seekTo(seconds: number): Promise<void>;
  setPlaybackRate(rate: PlaybackRate): void;
  setRepeatMode(mode: RepeatMode): void;
  getStatus(): AudioPlayerStatus;
  subscribe(listener: AudioPlayerStatusListener): () => void;
  dispose(): void;
}
