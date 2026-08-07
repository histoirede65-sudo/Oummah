import { AudioEvents, type AudioEventListener, type AudioEventName } from './AudioEvents';
import type { AudioPlayer, AudioPlayerStatus } from './AudioPlayer';
import { AudioQueue } from './AudioQueue';
import { AudioSession, type AudioSessionRepository } from './AudioSession';
import { INITIAL_AUDIO_STATE, type AudioState } from './AudioState';
import {
  PLAYBACK_RATES,
  type AudioSessionState,
  type AudioTrack,
  type PlaybackRate,
  type Playlist,
  type RepeatMode,
  getTrackReciter,
  getTrackSurahId,
} from './types';

export class AudioEngine {
  private readonly queue = new AudioQueue();
  private readonly events = new AudioEvents();
  private readonly session?: AudioSession;
  private state: AudioState = { ...INITIAL_AUDIO_STATE };
  private unsubscribePlayer: () => void;
  private handlingEnd = false;
  private stopAtEnd = false;

  constructor(private readonly player: AudioPlayer, sessionRepository?: AudioSessionRepository) {
    this.session = sessionRepository ? new AudioSession(sessionRepository) : undefined;
    this.unsubscribePlayer = player.subscribe((status) => this.receivePlayerStatus(status));
  }

  getState() {
    return this.state;
  }

  getCurrentPositionMs() {
    return Math.round(this.player.getStatus().position * 1000);
  }

  on<K extends AudioEventName>(event: K, listener: AudioEventListener<K>) {
    return this.events.on(event, listener);
  }

  setPlaylist(playlist: Playlist, startItemId?: string, autoplay = false) {
    this.queue.setPlaylist(playlist, startItemId);
    this.events.emit('queueChanged', playlist);
    const current = this.queue.current();
    if (current) this.activate(current.track, autoplay);
  }

  loadTrack(track: AudioTrack, autoplay = false) {
    const existing = this.queue.select(track.id);
    if (!existing) this.queue.setSingle(track);
    this.activate(track, autoplay);
  }

  play() {
    if (!this.state.track) return;
    this.player.play();
  }

  pause() {
    this.player.pause();
  }

  resume() {
    this.play();
  }

  async stop() {
    await this.player.stop();
    this.update({ status: 'stopped', position: 0 });
  }

  seek(seconds: number) {
    return this.player.seekTo(Math.max(0, seconds));
  }

  skipBy(seconds: number) {
    return this.seek(this.state.position + seconds);
  }

  setPlaybackRate(rate: PlaybackRate) {
    if (!PLAYBACK_RATES.includes(rate)) throw new Error(`Unsupported playback rate: ${rate}`);
    this.player.setPlaybackRate(rate);
    this.update({ playbackRate: rate });
  }

  setRepeatMode(mode: RepeatMode) {
    this.player.setRepeatMode(mode);
    this.update({ repeatMode: mode });
  }

  setStopAtEnd(enabled: boolean) {
    this.stopAtEnd = enabled;
  }

  next(autoplay = true) {
    const item = this.queue.next();
    if (!item) return false;
    this.activate(item.track, autoplay);
    return true;
  }

  previous(autoplay = true) {
    const item = this.queue.previous();
    if (!item) {
      void this.seek(0);
      return false;
    }
    this.activate(item.track, autoplay);
    return true;
  }

  changeTrack(trackId: string, autoplay = true) {
    const item = this.queue.select(trackId);
    if (!item) return false;
    this.activate(item.track, autoplay);
    return true;
  }

  changeSurah(surahId: number, autoplay = true) {
    const item = this.queue.selectTrack((track) => getTrackSurahId(track) === surahId);
    if (!item) return false;
    this.activate(item.track, autoplay);
    return true;
  }

  changeReciter(reciterId: string, autoplay = true) {
    const surahId = this.state.track ? getTrackSurahId(this.state.track) : undefined;
    const item = this.queue.selectTrack((track) => (
      getTrackReciter(track).id === reciterId
      && (surahId === undefined || getTrackSurahId(track) === surahId)
    ));
    if (!item) return false;
    this.activate(item.track, autoplay);
    return true;
  }

  async restoreSession() {
    const saved = await this.session?.restore();
    if (!saved?.playlist) return false;
    this.queue.setPlaylist(saved.playlist, saved.currentItemId ?? undefined);
    this.player.setPlaybackRate(saved.playbackRate);
    this.player.setRepeatMode(saved.repeatMode);
    const current = this.queue.current();
    if (!current) return false;
    this.activate(current.track, false);
    await this.player.seekTo(saved.position);
    this.update({
      position: saved.position,
      playbackRate: saved.playbackRate,
      repeatMode: saved.repeatMode,
    });
    this.events.emit('sessionRestored', this.state);
    return true;
  }

  async destroy() {
    if (this.session) await this.session.flush(this.sessionState()).catch(() => undefined);
    this.unsubscribePlayer();
    this.player.dispose();
    this.events.clear();
  }

  private activate(track: AudioTrack, autoplay: boolean) {
    this.player.load(track);
    this.update({
      status: 'loading',
      track,
      position: 0,
      duration: track.durationHint ?? 0,
      error: null,
    });
    this.events.emit('trackChanged', track);
    if (autoplay) this.player.play();
  }

  private receivePlayerStatus(status: AudioPlayerStatus) {
    const previousError = this.state.error;
    const playbackStatus = status.error
      ? 'error'
      : !this.state.track
        ? 'idle'
        : !status.isLoaded
          ? 'loading'
          : status.isPlaying
            ? 'playing'
            : status.position > 0
              ? 'paused'
              : 'ready';
    this.update({
      status: playbackStatus,
      position: status.position,
      duration: status.duration,
      isBuffering: status.isBuffering,
      error: status.error,
    });
    if (status.error && status.error !== previousError) {
      this.events.emit('error', new Error(status.error));
    }
    if (status.didJustFinish && this.state.track && !this.handlingEnd) {
      void this.handleEnded(this.state.track);
    }
  }

  private async handleEnded(track: AudioTrack) {
    this.handlingEnd = true;
    this.events.emit('playbackEnded', track);
    if (this.stopAtEnd) {
      this.stopAtEnd = false;
      await this.stop();
    } else if (this.state.repeatMode === 'surah' || this.state.repeatMode === 'verse') {
      await this.player.seekTo(0);
      this.player.play();
    } else if (!this.next(true)) {
      await this.stop();
    }
    this.handlingEnd = false;
  }

  private update(patch: Partial<AudioState>) {
    const queue = this.queue.snapshot();
    const nextState = {
      ...this.state,
      ...patch,
      playlist: queue.playlist,
      currentIndex: queue.index,
    };
    if (
      nextState.status === this.state.status
      && nextState.track === this.state.track
      && nextState.playlist === this.state.playlist
      && nextState.currentIndex === this.state.currentIndex
      && Math.abs(nextState.position - this.state.position) < 0.045
      && Math.abs(nextState.duration - this.state.duration) < 0.045
      && nextState.playbackRate === this.state.playbackRate
      && nextState.repeatMode === this.state.repeatMode
      && nextState.isBuffering === this.state.isBuffering
      && nextState.error === this.state.error
    ) return;
    this.state = nextState;
    this.events.emit('stateChanged', this.state);
    this.session?.schedule(this.sessionState());
  }

  private sessionState(): AudioSessionState {
    return {
      version: 1,
      playlist: this.state.playlist,
      currentItemId: this.queue.current()?.id ?? null,
      position: this.state.position,
      playbackRate: this.state.playbackRate,
      repeatMode: this.state.repeatMode,
      wasPlaying: this.state.status === 'playing',
      updatedAt: new Date().toISOString(),
    };
  }
}
