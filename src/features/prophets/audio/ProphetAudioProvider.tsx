import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { ProphetAudioEpisode } from "./prophetAudioData";
import { getCachedProphetAudio } from "./prophetAudioCache";
import { getOummahLockScreenArtworkUri } from "../../audio/lockScreenArtwork";
import { goalProgressBridge } from "../../daily-goals/services/goalProgressBridge";

type ProphetAudioContextValue = {
  episode: ProphetAudioEpisode | null;
  isPlaying: boolean;
  isLoading: boolean;
  downloadProgress: number | null;
  error: string | null;
  currentTime: number;
  duration: number;
  progress: number;
  startEpisode(episode: ProphetAudioEpisode): Promise<void>;
  togglePlay(): Promise<void>;
  seekBy(seconds: number): Promise<void>;
  seekTo(seconds: number): Promise<void>;
  stop(): Promise<void>;
  close(): Promise<void>;
};

const ProphetAudioContext = createContext<ProphetAudioContextValue | null>(null);

const PLAYER_OPTIONS = {
  updateInterval: 200,
  keepAudioSessionActive: true,
};

export function ProphetAudioProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, PLAYER_OPTIONS);
  const status = useAudioPlayerStatus(player);
  const [episode, setEpisode] = useState<ProphetAudioEpisode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedEpisodeId = useRef<string | null>(null);

  const configureBackgroundSession = useCallback(async () => {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  }, []);

  const activateLockScreen = useCallback(
    (nextEpisode: ProphetAudioEpisode) => {
      try {
        player.setActiveForLockScreen(
          true,
          {
            title: nextEpisode.title,
            artist: "OUMMAH · Histoires des prophètes",
            albumTitle: nextEpisode.prophetName,
            artworkUrl: getOummahLockScreenArtworkUri(),
          },
          {
            showSeekBackward: true,
            showSeekForward: true,
          },
        );
      } catch {
        // La lecture reste disponible même si les contrôles système sont indisponibles.
      }
    },
    [player],
  );

  const startEpisode = useCallback(
    async (nextEpisode: ProphetAudioEpisode) => {
      setIsLoading(true);
      setError(null);
      try {
        await configureBackgroundSession();
        setEpisode(nextEpisode);

        if (loadedEpisodeId.current !== nextEpisode.id) {
          player.pause();
          const localUri = await getCachedProphetAudio(nextEpisode, setDownloadProgress);
          player.replace({ uri: localUri });
          loadedEpisodeId.current = nextEpisode.id;
        }

        activateLockScreen(nextEpisode);

        const duration = status.duration || player.duration || 0;
        const current = status.currentTime || player.currentTime || 0;
        if (duration > 0 && current >= Math.max(0, duration - 0.4)) {
          await player.seekTo(0).catch(() => undefined);
        }

        player.play();
      } catch (cause) {
        const message = cause instanceof Error
          ? cause.message
          : "Impossible de télécharger cette histoire. Vérifie ta connexion puis réessaie.";
        setError(message);
        setEpisode(null);
        throw cause;
      } finally {
        setIsLoading(false);
        setDownloadProgress(null);
      }
    },
    [activateLockScreen, configureBackgroundSession, player, status.currentTime, status.duration],
  );

  const togglePlay = useCallback(async () => {
    if (!episode) return;

    if (status.playing) {
      player.pause();
      return;
    }

    await configureBackgroundSession().catch(() => undefined);
    activateLockScreen(episode);

    const duration = status.duration || player.duration || 0;
    const current = status.currentTime || player.currentTime || 0;
    if (duration > 0 && current >= Math.max(0, duration - 0.4)) {
      await player.seekTo(0).catch(() => undefined);
    }

    player.play();
  }, [activateLockScreen, configureBackgroundSession, episode, player, status.currentTime, status.duration, status.playing]);

  const seekTo = useCallback(
    async (seconds: number) => {
      if (!player.isLoaded && !status.isLoaded) return;
      const duration = Math.max(0, status.duration || player.duration || 0);
      const next = duration > 0
        ? Math.min(duration, Math.max(0, seconds))
        : Math.max(0, seconds);
      await player.seekTo(next).catch(() => undefined);
    },
    [player, status.duration, status.isLoaded],
  );

  const seekBy = useCallback(
    async (seconds: number) => {
      await seekTo((status.currentTime || player.currentTime || 0) + seconds);
    },
    [player, seekTo, status.currentTime],
  );

  const stop = useCallback(async () => {
    setIsLoading(false);
    player.pause();
    if (player.isLoaded || status.isLoaded) {
      await player.seekTo(0).catch(() => undefined);
    }
    try {
      player.clearLockScreenControls();
    } catch {
      // Rien à faire.
    }
  }, [player, status.isLoaded]);

  const close = useCallback(async () => {
    setIsLoading(false);
    player.pause();
    if (player.isLoaded || status.isLoaded) {
      await player.seekTo(0).catch(() => undefined);
    }
    try {
      player.clearLockScreenControls();
    } catch {
      // Rien à faire.
    }
    setEpisode(null);
    // Expo Audio SDK 57: replace() n'accepte pas null. On garde la source locale
    // chargée mais la session est fermée côté interface et contrôles système.
  }, [player, status.isLoaded]);

  useEffect(() => {
    if (!status.didJustFinish) return;
    try {
      player.clearLockScreenControls();
    } catch {
      // Rien à faire.
    }
  }, [player, status.didJustFinish]);

  useEffect(
    () => () => {
      try {
        player.pause();
        player.clearLockScreenControls();
      } catch {
        // La fermeture complète de l'app termine cette session non persistée.
      }
    },
    [player],
  );

  const duration = Math.max(0, status.duration || player.duration || 0);
  const currentTime = Math.max(0, status.currentTime || player.currentTime || 0);

  // Objectif « Une histoire de prophète » : une histoire écoutée au moins à moitié (une fois par jour).
  const countedEpisode = useRef<string | null>(null);
  useEffect(() => {
    if (!episode || duration <= 0 || currentTime < duration * 0.5) return;
    const key = `${episode.id}:${new Date().toDateString()}`;
    if (countedEpisode.current === key) return;
    countedEpisode.current = key;
    goalProgressBridge.record({ metric: "prophet_story", amount: 1, evidenceId: `listen:${episode.id}` });
  }, [currentTime, duration, episode]);

  const value = useMemo<ProphetAudioContextValue>(
    () => ({
      episode,
      isPlaying: Boolean(status.playing),
      isLoading,
      downloadProgress,
      error,
      currentTime,
      duration,
      progress: duration > 0 ? Math.min(1, currentTime / duration) : 0,
      startEpisode,
      togglePlay,
      seekBy,
      seekTo,
      stop,
      close,
    }),
    [
      close,
      currentTime,
      duration,
      episode,
      isLoading,
      downloadProgress,
      error,
      seekBy,
      seekTo,
      startEpisode,
      status.playing,
      stop,
      togglePlay,
    ],
  );

  return <ProphetAudioContext.Provider value={value}>{children}</ProphetAudioContext.Provider>;
}

export function useProphetAudio() {
  const value = useContext(ProphetAudioContext);
  if (!value) {
    throw new Error("useProphetAudio doit être utilisé dans ProphetAudioProvider");
  }
  return value;
}
