import type { AudioPlayer as ExpoPlayer, AudioStatus as ExpoStatus } from 'expo-audio';

import {
  getTrackReciter,
  getTrackUri,
  type AudioPlayer,
  type AudioPlayerStatus,
  type AudioPlayerStatusListener,
  type AudioTrack,
  type PlaybackRate,
  type RepeatMode,
} from '../../../core/audio';

const INITIAL_STATUS: AudioPlayerStatus = {
  isLoaded: false,
  isPlaying: false,
  isBuffering: false,
  didJustFinish: false,
  position: 0,
  duration: 0,
  playbackRate: 1,
  error: null,
};

function sameStatus(left: AudioPlayerStatus, right: AudioPlayerStatus) {
  return left.isLoaded === right.isLoaded
    && left.isPlaying === right.isPlaying
    && left.isBuffering === right.isBuffering
    && left.didJustFinish === right.didJustFinish
    && Math.abs(left.position - right.position) < 0.045
    && Math.abs(left.duration - right.duration) < 0.045
    && left.playbackRate === right.playbackRate
    && left.error === right.error;
}

export class ExpoAudioPlayerAdapter implements AudioPlayer {
  private status = INITIAL_STATUS;
  private listeners = new Set<AudioPlayerStatusListener>();
  private pendingSeek: number | null = null;
  private disposed = false;

  constructor(
    private readonly player: ExpoPlayer,
    private readonly onNativeInvalidated?: (track?: AudioTrack) => void,
  ) {}

  load(track: AudioTrack) {
    if (this.disposed) return;
    this.pendingSeek = 0;
    this.status = {
      ...this.status,
      isLoaded: false,
      isPlaying: false,
      isBuffering: true,
      didJustFinish: false,
      position: 0,
      duration: track.durationHint ?? 0,
      error: null,
    };
    this.listeners.forEach((listener) => listener(this.status));
    const reciter = getTrackReciter(track);
    try {
      this.player.replace({ uri: getTrackUri(track) });
    } catch (error) {
      this.status = {
        ...this.status,
        isLoaded: false,
        isPlaying: false,
        isBuffering: false,
        error: error instanceof Error ? error.message : 'Audio player unavailable.',
      };
      this.listeners.forEach((listener) => listener(this.status));
      this.onNativeInvalidated?.(track);
      return;
    }
    try {
      this.player.setActiveForLockScreen(true, {
        title: track.title,
        artist: reciter.name,
        albumTitle: 'OUMMAH',
        artworkUrl: track.artworkUri ?? (reciter.photoUri?.startsWith('http') ? reciter.photoUri : undefined),
      }, { showSeekBackward: true, showSeekForward: true });
    } catch {
      // Unsupported on some web and development runtimes.
    }
  }

  play() {
    if (this.disposed) return;
    try {
      this.player.play();
    } catch {
      this.onNativeInvalidated?.();
      this.dispose();
    }
  }

  pause() {
    if (this.disposed) return;
    try {
      this.player.pause();
    } catch {
      this.onNativeInvalidated?.();
      this.dispose();
    }
  }

  async stop() {
    if (this.disposed) return;
    try {
      this.player.pause();
      await this.player.seekTo(0);
    } catch {
      this.onNativeInvalidated?.();
      this.dispose();
    }
  }

  async seekTo(seconds: number) {
    if (this.disposed) return Promise.resolve();
    if (!this.status.isLoaded) {
      this.pendingSeek = Math.max(0, seconds);
      return Promise.resolve();
    }
    const maximum = this.player.duration > 0 ? this.player.duration : Number.POSITIVE_INFINITY;
    try {
      await this.player.seekTo(Math.max(0, Math.min(seconds, maximum)));
      this.status = {
        ...this.status,
        position: this.player.currentTime,
        duration: this.player.duration || this.status.duration,
      };
      this.listeners.forEach((listener) => listener(this.status));
    } catch {
      this.onNativeInvalidated?.();
      this.dispose();
    }
  }

  setPlaybackRate(rate: PlaybackRate) {
    if (this.disposed) return;
    try {
      this.player.setPlaybackRate(rate);
    } catch {
      this.onNativeInvalidated?.();
      this.dispose();
    }
  }

  setRepeatMode(mode: RepeatMode) {
    if (this.disposed) return;
    try {
      this.player.loop = mode === 'surah';
    } catch {
      this.onNativeInvalidated?.();
      this.dispose();
    }
  }

  getStatus() { return this.status; }

  subscribe(listener: AudioPlayerStatusListener) {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  sync(status: ExpoStatus) {
    if (this.disposed) return;
    const nextStatus = {
      isLoaded: status.isLoaded,
      isPlaying: status.playing,
      isBuffering: status.isBuffering,
      didJustFinish: status.didJustFinish,
      position: status.currentTime,
      duration: status.duration,
      playbackRate: status.playbackRate,
      error: 'error' in status ? String((status as { error?: unknown }).error ?? '') || null : null,
    };
    if (sameStatus(this.status, nextStatus)) return;
    this.status = nextStatus;
    if (status.isLoaded && this.pendingSeek !== null) {
      const position = this.pendingSeek;
      this.pendingSeek = null;
      void this.seekTo(position).catch(() => undefined);
    }
    this.listeners.forEach((listener) => listener(this.status));
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    try {
      this.player.pause();
      this.player.clearLockScreenControls();
      this.player.remove();
    } catch {
      // Optional platform capability.
    }
    this.listeners.clear();
  }
}
