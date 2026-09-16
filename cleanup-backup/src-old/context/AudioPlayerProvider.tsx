import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import {
  AudioPlayerProvider as CoreAudioPlayerProvider,
  getTrackReciter,
  getTrackSurahId,
  listeningSession,
  resumeService,
  tadabburController,
  useAudioPlayer,
  type ListeningSnapshot,
  type ListeningSnapshotInput,
  type ListeningStateInput,
  type AudioPlayerContextValue as CoreAudioPlayerContextValue,
  type AudioTrack,
  type Playlist,
} from "../core/audio";
import { audioDependencies } from "../features/audio/audioDependencies";
import { useExpoAudioPlayerAdapter } from "../features/audio/adapters/useExpoAudioPlayerAdapter";
import { MiniPlayerController } from "../features/audio/presentation/MiniPlayerController";
import type { MiniPlayerState } from "../features/audio/presentation/MiniPlayerState";
import { useReciter } from "./ReciterProvider";
import { goalProgressBridge } from "../features/daily-goals/services/goalProgressBridge";

type GlobalAudioPlayerContextValue = Omit<
  CoreAudioPlayerContextValue,
  "loadTrack" | "setPlaylist"
> & {
  loadSurah(
    surahId: number,
    autoplay?: boolean,
    reciterId?: string,
  ): Promise<void>;
  miniPlayerState: MiniPlayerState;
  hideMiniPlayer(): void;
  showMiniPlayer(): void;
  setFullPlayerActive(active: boolean): void;
  listeningResume: ListeningSnapshot | null;
  resumeListening(): Promise<ListeningSnapshot | null>;
  startNewListening(): Promise<void>;
};

const GlobalAudioPlayerContext =
  createContext<GlobalAudioPlayerContextValue | null>(null);

async function withLocalDownload(track: AudioTrack): Promise<AudioTrack> {
  const download = await audioDependencies.repositories.downloads
    .get(track.id)
    .catch(() => null);
  if (download?.state !== "downloaded" || !download.localUri) return track;
  return {
    ...track,
    localUri: download.localUri,
    source: {
      ...track.source,
      localUri: download.localUri,
    },
  };
}

function toResumeInput(
  snapshot: CoreAudioPlayerContextValue,
  tadabbur = tadabburController.getSnapshot(),
): ListeningSnapshotInput | null {
  if (!snapshot.track) return null;
  const surahId = getTrackSurahId(snapshot.track);
  if (!surahId) return null;
  const reciter = getTrackReciter(snapshot.track);
  const verseFromTrack = snapshot.track.quran?.verseKey
    ? Number(snapshot.track.quran.verseKey.split(":")[1])
    : null;
  return {
    trackId: snapshot.track.id,
    surahId,
    verseId:
      tadabbur.isActive && tadabbur.verse?.surahId === surahId
        ? tadabbur.verse.verseId
        : (verseFromTrack ?? 1),
    positionSeconds: snapshot.currentTime,
    durationSeconds: snapshot.duration,
    reciterId: reciter.id,
    reciterName: reciter.name,
    playbackRate: snapshot.playbackRate,
    mode: tadabbur.isActive ? "tadabbur" : "normal",
    wasPlaying: snapshot.isPlaying,
  };
}

function CompatibilityBridge({ children }: { children: ReactNode }) {
  const player = useAudioPlayer();
  const { currentReciter, reciters, setCurrentReciter } = useReciter();
  const { setPlaylist } = player;
  const playlists = useRef(new Map<string, Playlist>());
  const currentTrack = useRef(player.track);
  const currentPosition = useRef(player.currentTime);
  const previousPlayer = useRef(player);
  const latestPlayer = useRef(player);
  const ignoreNextStop = useRef(false);
  const sessionActivatedThisRun = useRef(false);
  const goalListeningRef = useRef({ trackId: "", position: 0, pending: 0 });
  const miniPlayerController = useMemo(() => new MiniPlayerController(), []);
  const [miniPlayerState, setMiniPlayerState] = useState(
    miniPlayerController.getState(),
  );
  const [persistedResume, setPersistedResume] =
    useState<ListeningSnapshot | null>(null);
  const tadabburMode = useSyncExternalStore(
    tadabburController.subscribe,
    tadabburController.getSnapshot,
    tadabburController.getSnapshot,
  );

  currentTrack.current = player.track;
  currentPosition.current = player.currentTime;
  latestPlayer.current = player;
  const { currentTime, duration, isPlaying, playbackRate, repeatMode, track } =
    player;

  useEffect(() => {
    const tracker = goalListeningRef.current;
    const trackId = track?.id ?? "";
    if (tracker.trackId !== trackId) {
      tracker.trackId = trackId;
      tracker.position = currentTime;
      tracker.pending = 0;
      return;
    }
    const delta = currentTime - tracker.position;
    tracker.position = currentTime;
    if (!isPlaying || delta <= 0 || delta > 3) return;
    tracker.pending += delta;
    if (tracker.pending < 5) return;
    const seconds = Math.floor(tracker.pending);
    tracker.pending -= seconds;
    goalProgressBridge.record({
      metric: "quran_listen_seconds",
      amount: seconds,
    });
  }, [currentTime, isPlaying, track?.id]);

  useEffect(
    () => miniPlayerController.subscribe(setMiniPlayerState),
    [miniPlayerController],
  );
  useEffect(() => {
    if (isPlaying) {
      sessionActivatedThisRun.current = true;
      miniPlayerController.show();
    }
    miniPlayerController.syncPlayback(
      track !== null && sessionActivatedThisRun.current,
      isPlaying,
    );
  }, [isPlaying, miniPlayerController, track]);

  useEffect(() => {
    let active = true;
    void resumeService
      .restore()
      .then((session) => {
        if (active) setPersistedResume(session);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const remember = useCallback((snapshot: CoreAudioPlayerContextValue) => {
    if (!snapshot.track) return;
    const surahId = getTrackSurahId(snapshot.track);
    if (!surahId) return;
    const reciter = getTrackReciter(snapshot.track);
    const tadabbur = tadabburController.getSnapshot();
    const verseFromTrack = snapshot.track.quran?.verseKey
      ? Number(snapshot.track.quran.verseKey.split(":")[1])
      : null;
    const input: ListeningStateInput = {
      trackId: snapshot.track.id,
      surahId,
      verseId:
        tadabbur.isActive && tadabbur.verse?.surahId === surahId
          ? tadabbur.verse.verseId
          : (verseFromTrack ?? 1),
      positionSeconds: snapshot.currentTime,
      reciterId: reciter.id,
      reciterName: reciter.name,
      playbackRate: snapshot.playbackRate,
      mode: tadabbur.isActive ? "tadabbur" : "normal",
    };
    const resumeInput = toResumeInput(snapshot);
    void Promise.all([
      listeningSession.remember(input),
      resumeInput ? resumeService.flush(resumeInput) : Promise.resolve(null),
    ])
      .then(([, resume]) => {
        if (resume) setPersistedResume(resume);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const input = toResumeInput(player, tadabburMode);
    if (!input || (!isPlaying && currentTime <= 0)) return;
    resumeService.schedule(input);
  }, [
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    player,
    repeatMode,
    tadabburMode,
    track,
  ]);

  useEffect(() => {
    const flushLatest = () => {
      const input = toResumeInput(latestPlayer.current);
      if (
        input &&
        (latestPlayer.current.isPlaying || latestPlayer.current.currentTime > 0)
      ) {
        void resumeService.flush(input).catch(() => undefined);
      }
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") flushLatest();
    });
    return () => {
      subscription.remove();
      flushLatest();
    };
  }, []);

  useEffect(() => {
    const previous = previousPlayer.current;
    previousPlayer.current = player;
    if (previous.isPlaying && !player.isPlaying) {
      if (ignoreNextStop.current) {
        ignoreNextStop.current = false;
        return;
      }
      remember(previous);
    }
  }, [isPlaying, player, remember]);

  const hideMiniPlayer = useCallback(
    () => miniPlayerController.hide(),
    [miniPlayerController],
  );
  const showMiniPlayer = useCallback(
    () => miniPlayerController.show(),
    [miniPlayerController],
  );
  const setFullPlayerActive = useCallback(
    (active: boolean) => miniPlayerController.setFullPlayer(active),
    [miniPlayerController],
  );
  const loadSurah = useCallback(
    async (surahId: number, autoplay = false, reciterId?: string) => {
      if (reciterId && reciterId !== currentReciter?.id) {
        const selectedReciter = reciters.find(
          (reciter) => reciter.id === reciterId,
        );
        if (selectedReciter) await setCurrentReciter(selectedReciter);
      }
      const resolvedReciterId = reciterId ?? currentReciter?.id;
      if (!resolvedReciterId) return;
      const previousTrack = currentTrack.current;
      const preservePosition =
        previousTrack !== null &&
        getTrackSurahId(previousTrack) === surahId &&
        getTrackReciter(previousTrack).id === resolvedReciterId;
      const position = currentPosition.current;
      let playlist = playlists.current.get(resolvedReciterId);
      if (!playlist) {
        const track = await withLocalDownload(
          await audioDependencies.catalog.getTrack(surahId, resolvedReciterId),
        );
        await player.loadTrack(track, autoplay);
        if (preservePosition) await player.seekTo(position);
        else await player.seekTo(0);
        return;
      }
      const item = playlist.items.find(
        (candidate) => candidate.track.quran?.surahId === surahId,
      );
      if (item) {
        const localizedTrack = await withLocalDownload(item.track);
        const localizedPlaylist =
          localizedTrack === item.track
            ? playlist
            : {
                ...playlist,
                items: playlist.items.map((candidate) =>
                  candidate.id === item.id
                    ? { ...candidate, track: localizedTrack }
                    : candidate,
                ),
              };
        if (localizedPlaylist !== playlist)
          playlists.current.set(resolvedReciterId, localizedPlaylist);
        setPlaylist(localizedPlaylist, item.id, autoplay);
        if (preservePosition) await player.seekTo(position);
        else await player.seekTo(0);
      }
    },
    [currentReciter?.id, player, reciters, setCurrentReciter, setPlaylist],
  );

  const nextSurah = useCallback(async () => {
    const surahId = player.track ? getTrackSurahId(player.track) : undefined;
    const reciterId = player.track
      ? getTrackReciter(player.track).id
      : currentReciter?.id;
    if (!surahId || surahId >= 114) return;
    await loadSurah(surahId + 1, true, reciterId);
  }, [currentReciter?.id, loadSurah, player.track]);

  const previousSurah = useCallback(async () => {
    const surahId = player.track ? getTrackSurahId(player.track) : undefined;
    const reciterId = player.track
      ? getTrackReciter(player.track).id
      : currentReciter?.id;
    if (!surahId) return;
    if (player.currentTime > 3 || surahId <= 1) {
      await player.seekTo(0);
      return;
    }
    await loadSurah(surahId - 1, true, reciterId);
  }, [currentReciter?.id, loadSurah, player]);

  const resumeListening = useCallback(async () => {
    const session =
      player.track && (player.isPlaying || player.currentTime > 0)
        ? resumeService.snapshot(toResumeInput(player)!)
        : persistedResume;
    if (!session) return null;
    if (player.isPlaying) player.pause();
    const sameTrack = player.track?.id === session.trackId;
    if (!sameTrack) await loadSurah(session.surahId, false, session.reciterId);
    if (player.playbackRate !== session.playbackRate)
      player.setPlaybackRate(session.playbackRate);
    if (
      !sameTrack ||
      Math.abs(player.currentTime - session.positionSeconds) > 1
    ) {
      await player.seekTo(session.positionSeconds);
    }
    if (session.mode === "tadabbur") tadabburController.activate();
    else tadabburController.deactivate();
    return session;
  }, [loadSurah, persistedResume, player]);
  const startNewListening = useCallback(async () => {
    ignoreNextStop.current = player.isPlaying;
    sessionActivatedThisRun.current = false;
    miniPlayerController.hide();
    await Promise.all([listeningSession.startNew(), resumeService.clear()]);
    setPersistedResume(null);
    await player.stop();
  }, [miniPlayerController, player]);
  const liveResume = useMemo(() => {
    if (!player.track || (!player.isPlaying && player.currentTime <= 0))
      return null;
    const input = toResumeInput(player, tadabburMode);
    return input ? resumeService.snapshot(input) : null;
  }, [player, tadabburMode]);
  const listeningResume = liveResume ?? persistedResume;
  const value = useMemo<GlobalAudioPlayerContextValue>(() => {
    const {
      loadTrack: _loadTrack,
      setPlaylist: _setPlaylist,
      ...state
    } = player;
    return {
      ...state,
      next: nextSurah,
      previous: previousSurah,
      loadSurah,
      miniPlayerState,
      hideMiniPlayer,
      showMiniPlayer,
      setFullPlayerActive,
      listeningResume,
      resumeListening,
      startNewListening,
    };
  }, [
    hideMiniPlayer,
    listeningResume,
    loadSurah,
    miniPlayerState,
    nextSurah,
    player,
    previousSurah,
    resumeListening,
    setFullPlayerActive,
    showMiniPlayer,
    startNewListening,
  ]);
  return (
    <GlobalAudioPlayerContext.Provider value={value}>
      {children}
    </GlobalAudioPlayerContext.Provider>
  );
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const player = useExpoAudioPlayerAdapter();
  return (
    <CoreAudioPlayerProvider
      player={player}
      sessionRepository={audioDependencies.repositories.session}
      history={audioDependencies.repositories.history}
      favorites={audioDependencies.repositories.favorites}
      downloads={audioDependencies.repositories.downloads}
    >
      <CompatibilityBridge>{children}</CompatibilityBridge>
    </CoreAudioPlayerProvider>
  );
}

export function useGlobalAudioPlayer() {
  const context = useContext(GlobalAudioPlayerContext);
  if (!context)
    throw new Error(
      "useGlobalAudioPlayer must be used within AudioPlayerProvider.",
    );
  return context;
}
