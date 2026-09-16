export type AudioContentType = 'quran' | 'invocation' | 'podcast' | 'conference' | 'dalilVoice';
export type AudioRecitationStyle = 'murattal' | 'mujawwad' | 'other';

export interface Reciter {
  id: string;
  name: string;
  style: AudioRecitationStyle;
  language: string;
  country: string;
  photoUri?: string;
  audioSource: string;
}

export type AudioReciter = Reciter;

export interface AudioSource {
  uri: string;
  localUri?: string;
  mimeType?: string;
}

export interface QuranTrackMetadata {
  surahId: number;
  verseKey?: `${number}:${number}`;
  reciter: Reciter;
}

/** Generic media model. Quran-specific information is isolated in `quran`. */
export interface AudioTrack {
  id: string;
  contentType: AudioContentType;
  contentId: string;
  title: string;
  creator: Reciter;
  source: AudioSource;
  artworkUri?: string;
  durationHint?: number;
  quran?: QuranTrackMetadata;
  /** Compatibility aliases for the current Quran presentation. */
  surahId?: number;
  reciter?: Reciter;
  remoteUri?: string;
  localUri?: string;
}

export interface QueueItem {
  id: string;
  track: AudioTrack;
  startAt?: number;
  endAt?: number;
}

export interface Playlist {
  id: string;
  title: string;
  items: readonly QueueItem[];
}

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackRate = typeof PLAYBACK_RATES[number];
export const REPEAT_MODES = ['none', 'verse', 'surah'] as const;
export type RepeatMode = typeof REPEAT_MODES[number];
export const SLEEP_TIMER_OPTIONS = [null, 10, 20, 30, 45, 60, 'endOfSurah'] as const;
export type SleepTimerOption = typeof SLEEP_TIMER_OPTIONS[number];
export type AudioPlaybackState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'stopped' | 'error';

export interface AudioTrackNavigator {
  previous(current: AudioTrack): Promise<AudioTrack | null>;
  next(current: AudioTrack): Promise<AudioTrack | null>;
}

export interface AudioSessionState {
  version: 1;
  playlist: Playlist | null;
  currentItemId: string | null;
  position: number;
  playbackRate: PlaybackRate;
  repeatMode: RepeatMode;
  wasPlaying: boolean;
  updatedAt: string;
}

export type PlaybackSnapshot = AudioSessionState;

export function getTrackUri(track: AudioTrack) {
  return track.source.localUri ?? track.localUri ?? track.source.uri ?? track.remoteUri ?? '';
}

export function getTrackReciter(track: AudioTrack) {
  return track.quran?.reciter ?? track.reciter ?? track.creator;
}

export function getTrackSurahId(track: AudioTrack) {
  return track.quran?.surahId ?? track.surahId;
}
