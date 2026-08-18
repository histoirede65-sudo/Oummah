import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { DownloadRepository, FavoriteAudioRepository, ListeningHistoryRepository } from '../repositories';
import { offlineRepository as defaultOfflineRepository, type OfflineRepository } from '../offline';
import { hapticsService } from '../settings';
import { AudioEngine } from './AudioEngine';
import type { AudioPlayer } from './AudioPlayer';
import type { AudioSessionRepository } from './AudioSession';
import type { AudioState } from './AudioState';
import { SleepTimerService } from './SleepTimerService';
import {
  PLAYBACK_RATES,
  REPEAT_MODES,
  SLEEP_TIMER_OPTIONS,
  getTrackReciter,
  getTrackSurahId,
  type AudioTrack,
  type PlaybackRate,
  type Playlist,
  type RepeatMode,
  type SleepTimerOption,
} from './types';

export interface AudioPlayerContextValue {
  state: AudioState;
  track: AudioTrack | null;
  playbackState: AudioState['status'];
  isReady: boolean;
  isLoaded: boolean;
  isBuffering: boolean;
  isPlaying: boolean;
  isLooping: boolean;
  isFavorite: boolean;
  playbackRate: PlaybackRate;
  repeatMode: RepeatMode;
  sleepTimer: SleepTimerOption;
  currentTime: number;
  duration: number;
  progress: number;
  getCurrentPositionMs(): number;
  subscribeToPosition(listener: (positionMs: number) => void): () => void;
  setPlaylist(playlist: Playlist, startItemId?: string, autoplay?: boolean): void;
  loadTrack(track: AudioTrack, autoplay?: boolean): Promise<void>;
  play(): void;
  pause(): void;
  resume(): void;
  stop(): Promise<void>;
  togglePlay(): void;
  seekTo(seconds: number): Promise<void>;
  skipBy(seconds: number): Promise<void>;
  previous(): Promise<void>;
  next(): Promise<void>;
  changeSurah(surahId: number): boolean;
  changeReciter(reciterId: string): boolean;
  setRepeatMode(mode: RepeatMode): void;
  setLooping(looping: boolean): void;
  setPlaybackRate(rate: PlaybackRate): void;
  cyclePlaybackRate(): void;
  cycleRepeatMode(): void;
  setSleepTimer(option: SleepTimerOption): void;
  cycleSleepTimer(): void;
  toggleFavorite(): Promise<void>;
  prepareDownload(): Promise<void>;
}

export interface AudioPlayerProviderProps {
  children: ReactNode;
  player: AudioPlayer;
  sessionRepository?: AudioSessionRepository;
  offline?: OfflineRepository;
  history?: ListeningHistoryRepository;
  favorites?: FavoriteAudioRepository;
  downloads?: DownloadRepository;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({
  children,
  player,
  sessionRepository,
  offline = defaultOfflineRepository,
  history,
  favorites,
  downloads,
}: AudioPlayerProviderProps) {
  const engine = useMemo(() => new AudioEngine(player, sessionRepository), [player, sessionRepository]);
  const timer = useMemo(() => new SleepTimerService(), []);
  const [state, setState] = useState<AudioState>(engine.getState());
  const [isReady, setIsReady] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sleepTimer, setSleepTimerState] = useState<SleepTimerOption>(null);
  const restoredEngine = useRef<AudioEngine | null>(null);

  useEffect(() => {
    const unsubscribe = engine.on('stateChanged', setState);
    if (restoredEngine.current !== engine) {
      restoredEngine.current = engine;
      setIsReady(false);
      void engine.restoreSession().catch(() => false).finally(() => setIsReady(true));
    }
    return () => { unsubscribe(); };
  }, [engine]);

  useEffect(() => {
    if (!state.track) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    void favorites?.contains(state.track.id).then((value) => {
      if (!cancelled) setIsFavorite(value);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [favorites, state.track]);

  useEffect(() => {
    if (state.track) void offline.saveAudioTrack(state.track).catch(() => undefined);
  }, [offline, state.track]);

  useEffect(() => {
    if (!state.track) return;
    const surahId = getTrackSurahId(state.track) ?? 0;
    const reciterId = getTrackReciter(state.track).id;
    const handle = setTimeout(() => {
      void history?.save({
        trackId: state.track!.id,
        surahId,
        reciterId,
        positionSeconds: state.position,
        playbackRate: state.playbackRate,
        repeatMode: state.repeatMode,
        wasPlaying: state.status === 'playing',
        updatedAt: new Date().toISOString(),
      }).catch(() => undefined);
    }, 750);
    return () => clearTimeout(handle);
  }, [history, state.playbackRate, state.position, state.repeatMode, state.status, state.track]);

  useEffect(() => () => timer.cancel(), [timer]);

  const setPlaylist = useCallback((playlist: Playlist, startItemId?: string, autoplay = false) => {
    engine.setPlaylist(playlist, startItemId, autoplay);
  }, [engine]);
  const loadTrack = useCallback(async (track: AudioTrack, autoplay = false) => {
    engine.loadTrack(track, autoplay);
    await offline.saveAudioTrack(track).catch(() => undefined);
  }, [engine, offline]);
  const play = useCallback(() => { void hapticsService.play(); engine.play(); }, [engine]);
  const pause = useCallback(() => { void hapticsService.pause(); engine.pause(); }, [engine]);
  const resume = useCallback(() => { void hapticsService.play(); engine.resume(); }, [engine]);
  const stop = useCallback(() => engine.stop(), [engine]);
  const togglePlay = useCallback(() => {
    void (state.status === 'playing' ? hapticsService.pause() : hapticsService.play());
    if (state.status === 'playing') engine.pause();
    else engine.resume();
  }, [engine, state.status]);
  const seekTo = useCallback((seconds: number) => engine.seek(seconds), [engine]);
  const skipBy = useCallback((seconds: number) => engine.skipBy(seconds), [engine]);
  const previous = useCallback(async () => { engine.previous(true); }, [engine]);
  const next = useCallback(async () => { engine.next(true); }, [engine]);
  const changeSurah = useCallback((surahId: number) => engine.changeSurah(surahId, true), [engine]);
  const changeReciter = useCallback((reciterId: string) => {
    void hapticsService.changeReciter();
    return engine.changeReciter(reciterId, true);
  }, [engine]);
  const setRepeatMode = useCallback((mode: RepeatMode) => {
    void hapticsService.changeRepeat();
    engine.setRepeatMode(mode);
  }, [engine]);
  const setLooping = useCallback((looping: boolean) => setRepeatMode(looping ? 'surah' : 'none'), [setRepeatMode]);
  const setPlaybackRate = useCallback((rate: PlaybackRate) => {
    void hapticsService.changeSpeed();
    engine.setPlaybackRate(rate);
  }, [engine]);
  const cyclePlaybackRate = useCallback(() => {
    const index = PLAYBACK_RATES.indexOf(state.playbackRate);
    setPlaybackRate(PLAYBACK_RATES[(index + 1) % PLAYBACK_RATES.length]);
  }, [setPlaybackRate, state.playbackRate]);
  const cycleRepeatMode = useCallback(() => {
    const index = REPEAT_MODES.indexOf(state.repeatMode);
    setRepeatMode(REPEAT_MODES[(index + 1) % REPEAT_MODES.length]);
  }, [setRepeatMode, state.repeatMode]);
  const setSleepTimer = useCallback((option: SleepTimerOption) => {
    setSleepTimerState(option);
    engine.setStopAtEnd(option === 'endOfSurah');
    timer.schedule(option, () => void engine.stop());
  }, [engine, timer]);
  const cycleSleepTimer = useCallback(() => {
    const index = SLEEP_TIMER_OPTIONS.indexOf(sleepTimer);
    setSleepTimer(SLEEP_TIMER_OPTIONS[(index + 1) % SLEEP_TIMER_OPTIONS.length]);
  }, [setSleepTimer, sleepTimer]);
  const toggleFavorite = useCallback(async () => {
    if (!state.track || !favorites) return;
    const reciterId = getTrackReciter(state.track).id;
    const surahId = getTrackSurahId(state.track) ?? 0;
    if (await favorites.contains(state.track.id)) {
      await favorites.remove(state.track.id);
      setIsFavorite(false);
    } else {
      await favorites.save({
        id: `${state.track.id}:${Date.now()}`,
        trackId: state.track.id,
        surahId,
        reciterId,
        createdAt: new Date().toISOString(),
      });
      setIsFavorite(true);
    }
    void hapticsService.favorite();
  }, [favorites, state.track]);
  const prepareDownload = useCallback(async () => {
    if (state.track && downloads) {
      await downloads.prepare(state.track);
      void hapticsService.download();
    }
  }, [downloads, state.track]);
  const subscribeToPosition = useCallback((listener: (positionMs: number) => void) => {
    listener(engine.getCurrentPositionMs());
    return engine.on('stateChanged', (nextState) => {
      listener(Math.round(nextState.position * 1000));
    });
  }, [engine]);
  const getCurrentPositionMs = useCallback(() => engine.getCurrentPositionMs(), [engine]);

  const value = useMemo<AudioPlayerContextValue>(() => ({
    state,
    track: state.track,
    playbackState: state.status,
    isReady,
    isLoaded: state.status !== 'idle' && state.status !== 'loading',
    isBuffering: state.isBuffering,
    isPlaying: state.status === 'playing',
    isLooping: state.repeatMode === 'surah',
    isFavorite,
    playbackRate: state.playbackRate,
    repeatMode: state.repeatMode,
    sleepTimer,
    currentTime: state.position,
    duration: state.duration,
    progress: state.duration > 0 ? state.position / state.duration : 0,
    getCurrentPositionMs,
    subscribeToPosition,
    setPlaylist,
    loadTrack,
    play,
    pause,
    resume,
    stop,
    togglePlay,
    seekTo,
    skipBy,
    previous,
    next,
    changeSurah,
    changeReciter,
    setRepeatMode,
    setLooping,
    setPlaybackRate,
    cyclePlaybackRate,
    cycleRepeatMode,
    setSleepTimer,
    cycleSleepTimer,
    toggleFavorite,
    prepareDownload,
  }), [changeReciter, changeSurah, cyclePlaybackRate, cycleRepeatMode, cycleSleepTimer, getCurrentPositionMs, isFavorite, isReady, loadTrack, next, pause, play, prepareDownload, previous, resume, seekTo, setLooping, setPlaybackRate, setPlaylist, setRepeatMode, setSleepTimer, skipBy, sleepTimer, state, stop, subscribeToPosition, toggleFavorite, togglePlay]);

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer must be used within AudioPlayerProvider.');
  return context;
}
