import * as Speech from "expo-speech";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SPEEDS = [0.72, 0.88, 1] as const;

type SpeechRequest = {
  key: string;
  text: string;
};

type UseDuaSpeechOptions = {
  pauseCompetingAudio?: () => void;
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function makeWordRanges(text: string) {
  const ranges: Array<{ start: number; end: number }> = [];
  const matcher = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text))) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  return ranges;
}

function boundaryCharIndex(event: unknown) {
  if (!event || typeof event !== "object") return 0;
  const value = (event as { charIndex?: unknown }).charIndex;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function useDuaSpeech({
  pauseCompetingAudio,
}: UseDuaSpeechOptions = {}) {
  const [activeKey, setActiveKey] = useState<string>();
  const [pendingKey, setPendingKey] = useState<string>();
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [error, setError] = useState<string>();

  const mountedRef = useRef(true);
  const requestRef = useRef<SpeechRequest>();
  const tokenRef = useRef(0);

  const stop = useCallback(() => {
    tokenRef.current += 1;
    requestRef.current = undefined;
    setActiveKey(undefined);
    setPendingKey(undefined);
    setActiveWordIndex(-1);
    setProgress(0);
    void Speech.stop().catch(() => undefined);
  }, []);

  const speak = useCallback(
    (request: SpeechRequest, forcedSpeedIndex = speedIndex) => {
      const token = tokenRef.current + 1;
      tokenRef.current = token;
      requestRef.current = request;
      pauseCompetingAudio?.();
      void Speech.stop().catch(() => undefined);
      setError(undefined);
      setActiveKey(request.key);
      setPendingKey(request.key);
      setActiveWordIndex(-1);
      setProgress(0);

      const ranges = makeWordRanges(request.text);
      const textLength = Math.max(1, request.text.length);

      Speech.speak(request.text, {
        language: "ar-SA",
        pitch: 1,
        rate: SPEEDS[forcedSpeedIndex],
        volume: 1,
        useApplicationAudioSession: false,
        onStart: () => {
          if (!mountedRef.current || tokenRef.current !== token) return;
          setPendingKey(undefined);
          setActiveKey(request.key);
        },
        onBoundary: (event: unknown) => {
          if (!mountedRef.current || tokenRef.current !== token) return;
          const charIndex = boundaryCharIndex(event);
          const wordIndex = ranges.findIndex(
            (range) => charIndex >= range.start && charIndex < range.end,
          );
          if (wordIndex >= 0) setActiveWordIndex(wordIndex);
          setProgress(clamp(charIndex / textLength));
        },
        onDone: () => {
          if (!mountedRef.current || tokenRef.current !== token) return;
          setPendingKey(undefined);
          setActiveKey(undefined);
          setActiveWordIndex(-1);
          setProgress(1);
        },
        onStopped: () => {
          if (!mountedRef.current || tokenRef.current !== token) return;
          setPendingKey(undefined);
          setActiveKey(undefined);
          setActiveWordIndex(-1);
        },
        onError: () => {
          if (!mountedRef.current || tokenRef.current !== token) return;
          setPendingKey(undefined);
          setActiveKey(undefined);
          setActiveWordIndex(-1);
          setError(
            "La voix arabe du téléphone est indisponible. Vérifiez les voix installées dans les réglages du téléphone.",
          );
        },
      });
    },
    [pauseCompetingAudio, speedIndex],
  );

  const toggle = useCallback(
    (request: SpeechRequest) => {
      if (activeKey === request.key || pendingKey === request.key) {
        stop();
        return;
      }
      speak(request);
    },
    [activeKey, pendingKey, speak, stop],
  );

  const cycleSpeed = useCallback(() => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    const request = requestRef.current;
    if (request && activeKey === request.key) {
      speak(request, next);
    }
  }, [activeKey, speak, speedIndex]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void Speech.stop().catch(() => undefined);
    };
  }, []);

  const estimatedDuration = useMemo(() => {
    const words = requestRef.current?.text.trim().split(/\s+/).length ?? 0;
    return words > 0 ? (words * 0.58) / SPEEDS[speedIndex] : 0;
  }, [activeKey, speedIndex]);

  return {
    activeKey,
    pendingKey,
    activeWordIndex,
    progress,
    speed: SPEEDS[speedIndex],
    estimatedDuration,
    estimatedCurrentTime: progress * estimatedDuration,
    isPlaying: Boolean(activeKey && !pendingKey),
    error,
    toggle,
    stop,
    cycleSpeed,
  };
}
