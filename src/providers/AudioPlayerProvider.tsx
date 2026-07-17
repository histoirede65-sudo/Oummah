import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  audioRepository as defaultAudioRepository,
  type AudioRepository,
} from '../services/quran/AudioRepository';
import type { AudioTrack } from '../core/audio';

interface AudioPlayerState {
  track: AudioTrack | null;
  status: 'idle' | 'ready' | 'playing' | 'paused';
  positionSeconds: number;
  durationSeconds: number;
}

const INITIAL_STATE: AudioPlayerState = {
  track: null,
  status: 'idle',
  positionSeconds: 0,
  durationSeconds: 0,
};

export interface AudioPlayerContextValue extends AudioPlayerState {
  loadChapter: (chapterId: number, reciterId?: number) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (positionSeconds: number) => void;
}

export interface AudioPlayerProviderProps {
  children: ReactNode;
  repository?: AudioRepository;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

/**
 * Architecture-only player for the Quran.Foundation integration.
 * It changes React state but intentionally does not start any real audio playback.
 */
export function AudioPlayerProvider({
  children,
  repository = defaultAudioRepository,
}: AudioPlayerProviderProps) {
  const [state, setState] = useState<AudioPlayerState>(INITIAL_STATE);

  const loadChapter = useCallback(async (chapterId: number, reciterId?: number) => {
    const track = await repository.getTrack(chapterId, { reciterId });
    setState(track
      ? {
          track,
          status: 'ready',
          positionSeconds: 0,
          durationSeconds: track.durationHint ?? 0,
        }
      : INITIAL_STATE);
  }, [repository]);

  const play = useCallback(() => {
    setState((current) => current.track ? { ...current, status: 'playing' } : current);
  }, []);

  const pause = useCallback(() => {
    setState((current) => current.track ? { ...current, status: 'paused' } : current);
  }, []);

  const stop = useCallback(() => setState(INITIAL_STATE), []);

  const seekTo = useCallback((positionSeconds: number) => {
    setState((current) => {
      if (!current.track) return current;
      const maximum = current.durationSeconds > 0
        ? current.durationSeconds
        : Number.POSITIVE_INFINITY;

      return {
        ...current,
        positionSeconds: Math.max(0, Math.min(positionSeconds, maximum)),
      };
    });
  }, []);

  const value = useMemo<AudioPlayerContextValue>(() => ({
    ...state,
    loadChapter,
    play,
    pause,
    stop,
    seekTo,
  }), [loadChapter, pause, play, seekTo, state, stop]);

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer must be used within AudioPlayerProvider.');
  return context;
}
