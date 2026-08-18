import type { AudioPlaybackState, AudioTrack, PlaybackRate, Playlist, RepeatMode } from './types';

export interface AudioState {
  status: AudioPlaybackState;
  track: AudioTrack | null;
  playlist: Playlist | null;
  currentIndex: number;
  position: number;
  duration: number;
  playbackRate: PlaybackRate;
  repeatMode: RepeatMode;
  isBuffering: boolean;
  error: string | null;
}

export const INITIAL_AUDIO_STATE: Readonly<AudioState> = {
  status: 'idle',
  track: null,
  playlist: null,
  currentIndex: -1,
  position: 0,
  duration: 0,
  playbackRate: 1,
  repeatMode: 'none',
  isBuffering: false,
  error: null,
};
