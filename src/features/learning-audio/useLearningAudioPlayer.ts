import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioSource,
} from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const LEARNING_AUDIO_SPEEDS = [0.75, 1, 1.25] as const;

type LearningAudioRequest = {
  key: string;
  source: AudioSource;
  startRatio?: number;
  endRatio?: number;
  startOffsetSeconds?: number;
  endOffsetSeconds?: number;
};

type UseLearningAudioPlayerOptions = {
  pauseCompetingAudio?: () => void;
};

type PendingRequest = LearningAudioRequest & {
  token: number;
};

type AudioRange = {
  key: string;
  startAt: number;
  endAt: number;
};

const LOAD_TIMEOUT_MS = 12_000;
const POLL_INTERVAL_MS = 70;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function resolveRange(duration: number, request: LearningAudioRequest): AudioRange {
  const startRatio = clamp(request.startRatio ?? 0, 0, 0.94);
  const endRatio = clamp(request.endRatio ?? 1, startRatio + 0.03, 1);
  const startAt = clamp(
    duration * startRatio + Math.max(0, request.startOffsetSeconds ?? 0),
    0,
    Math.max(0, duration - 0.45),
  );
  const requestedEnd =
    duration * endRatio - Math.max(0, request.endOffsetSeconds ?? 0);
  const endAt = clamp(requestedEnd, startAt + 0.4, duration);
  return { key: request.key, startAt, endAt };
}

/**
 * Lifecycle-safe learning player shared by Dhikr and Dou'a.
 * It supports a focused playback range so spoken introductions and notes can
 * be excluded without breaking the progress bar or the word highlighting.
 */
export function useLearningAudioPlayer({
  pauseCompetingAudio,
}: UseLearningAudioPlayerOptions = {}) {
  const player = useAudioPlayer(null, {
    updateInterval: 80,
    downloadFirst: true,
    keepAudioSessionActive: false,
  });
  const status = useAudioPlayerStatus(player);

  const [activeKey, setActiveKey] = useState<string>();
  const [pendingKey, setPendingKey] = useState<string>();
  const [speedIndex, setSpeedIndex] = useState(1);
  const [activeRange, setActiveRange] = useState<AudioRange>();
  const [error, setError] = useState<string>();
  const [completionCount, setCompletionCount] = useState(0);

  const speedIndexRef = useRef(1);
  const loadedKeyRef = useRef<string>();
  const loadedRequestRef = useRef<LearningAudioRequest>();
  const pendingRef = useRef<PendingRequest>();
  const rangeRef = useRef<AudioRange>();
  const commandTokenRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);
  const rangeFinishedRef = useRef(false);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = undefined;
    }
  }, []);

  const applyRange = useCallback(
    (request: LearningAudioRequest) => {
      const range = resolveRange(player.duration, request);
      rangeRef.current = range;
      setActiveRange(range);
      rangeFinishedRef.current = false;
      return range;
    },
    [player],
  );

  useEffect(() => {
    mountedRef.current = true;
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "doNotMix",
    }).catch(() => undefined);

    return () => {
      mountedRef.current = false;
      clearPoll();
      pendingRef.current = undefined;
      rangeRef.current = undefined;
      try {
        player.pause();
      } catch {
        // The hook disposes the native player automatically.
      }
    };
  }, [clearPoll, player]);

  const stop = useCallback(() => {
    commandTokenRef.current += 1;
    clearPoll();
    pendingRef.current = undefined;
    rangeRef.current = undefined;
    rangeFinishedRef.current = false;
    try {
      player.pause();
    } catch {
      // The native session can already be inactive while navigating.
    }
    setPendingKey(undefined);
    setActiveKey(undefined);
    setActiveRange(undefined);
    setError(undefined);
  }, [clearPoll, player]);

  useEffect(() => {
    if (!status.didJustFinish) return;
    setCompletionCount((value) => value + 1);
    clearPoll();
    pendingRef.current = undefined;
    rangeRef.current = undefined;
    setPendingKey(undefined);
    setActiveKey(undefined);
    setActiveRange(undefined);
  }, [clearPoll, status.didJustFinish]);

  useEffect(() => {
    const range = rangeRef.current;
    if (
      !range ||
      !status.playing ||
      activeKey !== range.key ||
      rangeFinishedRef.current ||
      status.currentTime < range.endAt - 0.055
    ) {
      return;
    }

    rangeFinishedRef.current = true;
    setCompletionCount((value) => value + 1);
    try {
      player.pause();
    } catch {
      // Ignore an end-of-range native race.
    }
    void player.seekTo(range.startAt).catch(() => undefined);
    setActiveKey(undefined);
  }, [activeKey, player, status.currentTime, status.playing]);

  const startWhenReady = useCallback(
    (request: PendingRequest, startedAt: number) => {
      const attempt = async () => {
        if (
          !mountedRef.current ||
          !pendingRef.current ||
          pendingRef.current.token !== request.token ||
          commandTokenRef.current !== request.token
        ) {
          return;
        }

        if (!player.isLoaded || player.duration <= 0) {
          if (Date.now() - startedAt >= LOAD_TIMEOUT_MS) {
            pendingRef.current = undefined;
            setPendingKey(undefined);
            setActiveKey(undefined);
            setError("L’audio met trop de temps à charger. Réessayez.");
            return;
          }
          pollTimerRef.current = setTimeout(attempt, POLL_INTERVAL_MS);
          return;
        }

        try {
          player.setPlaybackRate(LEARNING_AUDIO_SPEEDS[speedIndexRef.current]);
          const range = applyRange(request);
          await player.seekTo(range.startAt);
          if (!mountedRef.current || commandTokenRef.current !== request.token) {
            return;
          }
          player.play();
          loadedKeyRef.current = request.key;
          loadedRequestRef.current = request;
          pendingRef.current = undefined;
          setPendingKey(undefined);
          setActiveKey(request.key);
          setError(undefined);
        } catch {
          pendingRef.current = undefined;
          setPendingKey(undefined);
          setActiveKey(undefined);
          setError("Impossible de démarrer cet audio pour le moment.");
        }
      };

      pollTimerRef.current = setTimeout(attempt, 90);
    },
    [applyRange, player],
  );

  const toggle = useCallback(
    (request: LearningAudioRequest) => {
      setError(undefined);

      if (pendingKey === request.key) {
        stop();
        return;
      }

      if (activeKey === request.key && status.playing) {
        try {
          player.pause();
        } catch {
          // Ignore a native pause race.
        }
        return;
      }

      pauseCompetingAudio?.();
      void setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: "doNotMix",
      }).catch(() => undefined);

      const token = commandTokenRef.current + 1;
      commandTokenRef.current = token;
      clearPoll();

      if (loadedKeyRef.current === request.key && player.isLoaded) {
        const resume = async () => {
          try {
            player.setPlaybackRate(LEARNING_AUDIO_SPEEDS[speedIndexRef.current]);
            const range = applyRange(request);
            const outsideRange =
              player.currentTime < range.startAt - 0.08 ||
              player.currentTime >= range.endAt - 0.08;
            if (outsideRange || rangeFinishedRef.current) {
              await player.seekTo(range.startAt);
            }
            if (commandTokenRef.current !== token || !mountedRef.current) return;
            rangeFinishedRef.current = false;
            loadedRequestRef.current = request;
            player.play();
            setActiveKey(request.key);
          } catch {
            setActiveKey(undefined);
            setError("Impossible de reprendre cet audio.");
          }
        };
        void resume();
        return;
      }

      try {
        player.pause();
        const pending: PendingRequest = { ...request, token };
        pendingRef.current = pending;
        setActiveKey(request.key);
        setPendingKey(request.key);
        player.replace(request.source);
        startWhenReady(pending, Date.now());
      } catch {
        pendingRef.current = undefined;
        setPendingKey(undefined);
        setActiveKey(undefined);
        setError("Cette piste audio est momentanément indisponible.");
      }
    },
    [
      activeKey,
      applyRange,
      clearPoll,
      pauseCompetingAudio,
      pendingKey,
      player,
      startWhenReady,
      status.playing,
      stop,
    ],
  );

  const cycleSpeed = useCallback(() => {
    const next = (speedIndex + 1) % LEARNING_AUDIO_SPEEDS.length;
    speedIndexRef.current = next;
    setSpeedIndex(next);
    try {
      if (player.isLoaded) {
        player.setPlaybackRate(LEARNING_AUDIO_SPEEDS[next]);
      }
    } catch {
      // The selected speed is retained and applied after loading.
    }
  }, [player, speedIndex]);

  const seekToProgress = useCallback(
    (
      progress: number,
      startRatio = 0,
      endRatio = 1,
      startOffsetSeconds = 0,
      endOffsetSeconds = 0,
    ) => {
      if (!player.isLoaded || player.duration <= 0) return;
      const request: LearningAudioRequest = {
        key: activeKey ?? loadedKeyRef.current ?? "seek",
        source: loadedRequestRef.current?.source ?? 0,
        startRatio,
        endRatio,
        startOffsetSeconds,
        endOffsetSeconds,
      };
      const range = resolveRange(player.duration, request);
      rangeRef.current = range;
      setActiveRange(range);
      rangeFinishedRef.current = false;
      const target = range.startAt + clamp(progress, 0, 1) * (range.endAt - range.startAt);
      void player
        .seekTo(target)
        .catch(() => setError("Le déplacement dans l’audio a échoué."));
    },
    [activeKey, player],
  );

  const rangeStart = activeRange?.startAt ?? 0;
  const rangeEnd = activeRange?.endAt ?? status.duration;
  const focusedDuration = Math.max(0, rangeEnd - rangeStart);
  const focusedCurrentTime =
    activeRange && activeKey === activeRange.key
      ? clamp(status.currentTime - rangeStart, 0, focusedDuration)
      : 0;
  const focusedProgress =
    focusedDuration > 0 ? clamp(focusedCurrentTime / focusedDuration, 0, 1) : 0;

  const progress = useMemo(() => {
    if (status.duration <= 0) return 0;
    return clamp(status.currentTime / status.duration, 0, 1);
  }, [status.currentTime, status.duration]);

  return {
    activeKey,
    pendingKey,
    isPlaying: status.playing,
    isBuffering: status.isBuffering,
    isLoaded: status.isLoaded,
    currentTime: status.currentTime,
    duration: status.duration,
    progress,
    rangeStart,
    rangeEnd,
    focusedCurrentTime,
    focusedDuration,
    focusedProgress,
    speed: LEARNING_AUDIO_SPEEDS[speedIndex],
    error,
    completionCount,
    toggle,
    stop,
    cycleSpeed,
    seekToProgress,
  };
}
