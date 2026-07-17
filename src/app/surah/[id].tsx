import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { createAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, FlatList, Platform, Pressable, Share, StyleSheet, Text, useWindowDimensions, View, type AlertButton, type ListRenderItem, type ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { offlineRepository } from '../../core/offline';
import { hapticsService } from '../../core/settings';
import { SURAHS } from '../../data/surahs';
import { DEFAULT_READING_PREFERENCES, readingPreferencesStore, type ReadingMode, type ReadingPreferences, type ReadingTheme } from '../../features/quran/ReadingPreferences';
import { readingQuranRepository } from '../../features/quran/ReadingQuranRepository';
import { QuranArabicText } from '../../features/quran/QuranArabicText';
import { QuranWordHighlight } from '../../features/quran/QuranWordHighlight';
import { ARABIC_READING_FONT_FAMILY } from '../../features/quran/ArabicReadingPresentation';
import { audioPositionMilliseconds, getSyncPositionMs, getWordSyncState, normalizeWordTimestamps, type AudioSourceMode } from '../../features/quran/QuranWordSync';
import { quranFoundationRepository } from '../../features/quranfoundation/QuranFoundationRepository';
import type { QuranFoundationRecitation, QuranFoundationVerse } from '../../features/quranfoundation/QuranFoundationTypes';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useReciter } from '../../context/ReciterProvider';
import { useGlobalAudioPlayer } from '../../context/AudioPlayerProvider';
const modes: { id: ReadingMode; label: string }[] = [
  { id: 'arabic', label: 'Arabe' }, { id: 'arabic-translation', label: 'Arabe + traduction' },
  { id: 'arabic-transliteration', label: 'Arabe + phonétique' }, { id: 'translation', label: 'Traduction' },
  { id: 'mushaf', label: 'Mushaf' },
];

function resolveVerseAudioUrl(value?: string) {
  if (!value) return undefined;
  if (/^https?:\/\//.test(value)) return value;
  return `https://verses.quran.foundation/${value.replace(/^\/+/, '')}`;
}

type VerseTimeline = NonNullable<QuranFoundationRecitation['timestamps']>[number];

function waitForAudioCondition(
  condition: () => boolean,
  isCurrent: () => boolean,
  timeoutMs: number,
) {
  return new Promise<boolean>((resolve) => {
    const startedAt = Date.now();
    const check = () => {
      if (!isCurrent()) return resolve(false);
      if (condition()) return resolve(true);
      if (Date.now() - startedAt >= timeoutMs) return resolve(false);
      setTimeout(check, 20);
    };
    check();
  });
}

function replaceAndWaitForAudioSource(
  player: ReturnType<typeof createAudioPlayer>,
  audioUrl: string,
  isCurrent: () => boolean,
  timeoutMs: number,
) {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    let sawUnloaded = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      subscription.remove();
      resolve(ready);
    };
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (!isCurrent()) return finish(false);
      if (!status.isLoaded) {
        sawUnloaded = true;
        return;
      }
      if (sawUnloaded || status.currentTime <= 0.1) finish(true);
    });
    const timeout = setTimeout(() => finish(false), timeoutMs);
    player.replace({ uri: audioUrl });
  });
}

const VerseRow = memo(function VerseRow({ verse, settings, screenWidth, onPress, onListen, isPlaying, isActive, activeWordPosition, lastReadWordPosition, isWordSyncUnavailable }: { verse: QuranFoundationVerse; settings: ReadingPreferences; screenWidth: number; onPress: (verse: QuranFoundationVerse) => void; onListen: (verse: QuranFoundationVerse) => void; isPlaying: boolean; isActive: boolean; activeWordPosition: number | null; lastReadWordPosition: number | null; isWordSyncUnavailable: boolean }) {
  const showArabic = settings.mode !== 'translation';
  const showTranslation = settings.mode === 'arabic-translation' || settings.mode === 'translation';
  const showTransliteration = settings.showTransliteration || settings.mode === 'arabic-transliteration';
  const transliterationSize = screenWidth < 375 ? 16 : screenWidth < 430 ? 17 : 18;
  const arabicWords = useMemo(() => verse.textUthmani.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean), [verse.textUthmani]);
  return (
    <Pressable onPress={() => onPress(verse)} onLongPress={() => onPress(verse)} delayLongPress={350} style={[styles.verse, settings.columnWidth === 'wide' && styles.verseWide, isActive && styles.verseActive]}>
      <View style={styles.verseTop}><View style={styles.number}><Text style={styles.numberText}>{verse.id}</Text></View><Text style={styles.location}>Juz {verse.juzNumber || '—'} · Page {verse.pageNumber || '—'}</Text><Pressable accessibilityLabel={`Écouter le verset ${verse.id}`} onPress={() => onListen(verse)} hitSlop={10} style={styles.listenIcon}><Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={colors.goldLight} /></Pressable></View>
      {showArabic ? (
        <QuranArabicText selectable screenWidth={screenWidth} preferredSize={settings.arabicSize}>
          {isActive ? arabicWords.map((word, index) => (
            <QuranWordHighlight
              key={`${index + 1}-${word}`}
              text={`${word}${index < arabicWords.length - 1 ? ' ' : ''}`}
              fontFamily={ARABIC_READING_FONT_FAMILY}
              isActive={index + 1 === activeWordPosition}
              isRead={lastReadWordPosition !== null && index + 1 <= lastReadWordPosition}
            />
          )) : verse.textUthmani}
        </QuranArabicText>
      ) : null}
      {isWordSyncUnavailable ? <Text style={styles.syncUnavailable}>Synchronisation mot à mot indisponible pour ce récitateur.</Text> : null}
      {showTransliteration ? <Text selectable style={[styles.transliteration, { fontSize: transliterationSize }]}>{verse.transliteration || 'Translittération indisponible'}</Text> : null}
      {showTranslation ? <Text selectable style={[styles.translation, { fontSize: settings.translationSize, lineHeight: settings.translationSize * 1.55 }]}>{verse.translation || verse.translations?.[0]?.text || 'Traduction indisponible'}</Text> : null}
    </Pressable>
  );
});

export default function SurahReadingScreen() {
  const { id, verse: requestedVerse } = useLocalSearchParams<{ id: string; verse?: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const surahId = Number(id) || 1;
  const surah = SURAHS.find((item) => item.id === surahId) ?? SURAHS[0];
  const listRef = useRef<FlatList<QuranFoundationVerse>>(null);
  const offsetRef = useRef(0);
  const currentVerseRef = useRef(Number(requestedVerse) || 1);
  const [verses, setVerses] = useState<QuranFoundationVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [settings, setSettings] = useState(DEFAULT_READING_PREFERENCES);
  const [showSettings, setShowSettings] = useState(false);
  const [playingVerseKey, setPlayingVerseKey] = useState<string>();
  const [activeVerse, setActiveVerse] = useState<QuranFoundationVerse>();
  const [activeTiming, setActiveTiming] = useState<{ startMs: number; endMs: number; requestId: number; verseKey: string; reciterId: string; audioMode: AudioSourceMode }>();
  const [activeRecitationTimeline, setActiveRecitationTimeline] = useState<{ key: string; timestamps: unknown } | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const { currentReciter } = useReciter();
  const { pause: pauseGlobalAudio } = useGlobalAudioPlayer();
  const [versePlayer] = useState(() => createAudioPlayer(null, { updateInterval: 50, keepAudioSessionActive: false }));
  const [preloadPlayer] = useState(() => createAudioPlayer(null, { updateInterval: 1000, keepAudioSessionActive: false }));
  const versePlayerStatus = useAudioPlayerStatus(versePlayer);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sessionIdRef = useRef(0);
  const inlineReciterIdRef = useRef(currentReciter?.id);
  const timelineCacheRef = useRef(new Map<string, VerseTimeline[]>());
  const timelineRequestsRef = useRef(new Map<string, ReturnType<typeof quranFoundationRepository.getRecitation>>());
  const timelineAudioUrlsRef = useRef(new Map<string, string>());
  const loadedVerseAudioUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    sessionIdRef.current += 1;
    versePlayer.remove();
    preloadPlayer.remove();
  }, [preloadPlayer, versePlayer]);

  useEffect(() => {
    if (inlineReciterIdRef.current === currentReciter?.id) return;
    inlineReciterIdRef.current = currentReciter?.id;
    sessionIdRef.current += 1;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    versePlayer.pause();
    setActiveTiming(undefined);
    setActiveRecitationTimeline(null);
    setPlayingVerseKey(undefined);
    if (!currentReciter) return;
    const timelineKey = `${currentReciter.id}:${surahId}`;
    if (timelineCacheRef.current.has(timelineKey)) return;
    const request = quranFoundationRepository.getRecitation(currentReciter.id, surahId);
    timelineRequestsRef.current.set(timelineKey, request);
    void request.then((recitation) => {
      timelineCacheRef.current.set(timelineKey, [...(recitation.timestamps ?? [])]);
      timelineAudioUrlsRef.current.set(timelineKey, recitation.audioUrl);
    }).catch(() => undefined).finally(() => {
      if (timelineRequestsRef.current.get(timelineKey) === request) timelineRequestsRef.current.delete(timelineKey);
    });
  }, [currentReciter, surahId, versePlayer]);

  const loadVerses = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await readingQuranRepository.getVerses(surahId) as unknown as QuranFoundationVerse[] | { verses?: QuranFoundationVerse[] };
      const normalizedVerses = Array.isArray(response) ? response : response?.verses ?? [];
      setVerses(normalizedVerses);
      setTimeout(() => listRef.current?.scrollToOffset({ offset: offsetRef.current, animated: false }), 0);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Impossible de charger les versets.'); }
    finally { setLoading(false); }
  }, [surahId]);

  useEffect(() => {
    let active = true;
    Promise.all([readingPreferencesStore.load(), offlineRepository.getLastReading()]).then(([savedSettings, position]) => {
      if (!active) return;
      setSettings(savedSettings);
      if (position?.surahId === surahId) { offsetRef.current = position.scrollOffset ?? 0; currentVerseRef.current = position.verseNumber; }
      void loadVerses();
    });
    return () => { active = false; };
  }, [loadVerses, surahId]);

  useEffect(() => () => { void offlineRepository.saveLastReading({ surahId, verseNumber: currentVerseRef.current, page: verses.find((v) => v.id === currentVerseRef.current)?.pageNumber, scrollOffset: offsetRef.current, displayMode: settings.mode, updatedAt: new Date().toISOString() }); }, [settings.mode, surahId, verses]);

  const updateSettings = (patch: Partial<ReadingPreferences>) => {
    const next = { ...settings, ...patch }; setSettings(next); void readingPreferencesStore.save(next);
  };
  const listenToVerse = useCallback(async (verse: QuranFoundationVerse) => {
    if (!currentReciter) return;
    const player = versePlayer;
    if (playingVerseKey === verse.verseKey) {
      sessionIdRef.current += 1;
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      player.pause();
      setPlayingVerseKey(undefined);
      return;
    }
    const playerPositionMs = audioPositionMilliseconds(player.currentTime);
    const pausedPositionMs = activeTiming
      ? getSyncPositionMs(playerPositionMs, activeTiming.startMs, activeTiming.audioMode)
      : playerPositionMs;
    if (
      activeTiming?.verseKey === verse.verseKey
      && activeTiming.reciterId === currentReciter.id
      && pausedPositionMs >= activeTiming.startMs
      && pausedPositionMs < activeTiming.endMs
    ) {
      const requestId = ++sessionIdRef.current;
      pauseGlobalAudio();
      player.setPlaybackRate(playbackRate);
      player.play();
      setActiveTiming({ ...activeTiming, requestId });
      setPlayingVerseKey(verse.verseKey);
      stopTimerRef.current = setTimeout(() => {
        if (sessionIdRef.current !== requestId) return;
        player.pause();
        setPlayingVerseKey(undefined);
      }, Math.max(1, (activeTiming.endMs - pausedPositionMs) / playbackRate));
      return;
    }
    const requestId = ++sessionIdRef.current;
    const isCurrentRequest = () => sessionIdRef.current === requestId;
    pauseGlobalAudio();
    player.pause();
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    setActiveTiming(undefined);
    setActiveRecitationTimeline(null);
    setPlayingVerseKey(undefined);
    setActiveVerse(verse);
    const timelineKey = `${currentReciter.id}:${surahId}`;
    let timelines = timelineCacheRef.current.get(timelineKey);
    let audioUrl = timelineAudioUrlsRef.current.get(timelineKey);
    if (!timelines || !audioUrl) {
      let recitationRequest = timelineRequestsRef.current.get(timelineKey);
      if (!recitationRequest) {
        recitationRequest = quranFoundationRepository.getRecitation(currentReciter.id, surahId);
        timelineRequestsRef.current.set(timelineKey, recitationRequest);
      }
      const recitation = await recitationRequest.finally(() => {
        if (timelineRequestsRef.current.get(timelineKey) === recitationRequest) timelineRequestsRef.current.delete(timelineKey);
      });
      timelines = [...(recitation.timestamps ?? [])];
      audioUrl = recitation.audioUrl;
      timelineCacheRef.current.set(timelineKey, timelines);
      timelineAudioUrlsRef.current.set(timelineKey, audioUrl);
    }
    if (!isCurrentRequest()) return;
    const timing = timelines.find((item) => item.verseKey === verse.verseKey);
    if (!timing) {
      Alert.alert('Audio indisponible', 'Le minutage de ce verset est indisponible.');
      return;
    }
    const timestampFromMs = timing.timestampFrom;
    const endMs = timing.timestampTo;
    if (!Number.isFinite(timestampFromMs) || !Number.isFinite(endMs) || endMs <= timestampFromMs) {
      Alert.alert('Audio indisponible', 'Les bornes audio de ce verset sont invalides.');
      return;
    }
    const audioMode: AudioSourceMode = 'full-surah';
    setActiveRecitationTimeline({ key: timelineKey, timestamps: [timing] });
    const loaded = loadedVerseAudioUrlRef.current === audioUrl && player.isLoaded
      ? true
      : await replaceAndWaitForAudioSource(player, audioUrl, isCurrentRequest, 10_000);
    if (!loaded || !isCurrentRequest()) return;
    loadedVerseAudioUrlRef.current = audioUrl;
    const startSeconds = timestampFromMs / 1000;
    await player.seekTo(startSeconds, 0, 0);
    const seekConfirmed = await waitForAudioCondition(
      () => Math.abs(player.currentTime - startSeconds) <= 0.08,
      isCurrentRequest,
      2_000,
    );
    if (!seekConfirmed || !isCurrentRequest()) return;
    player.setPlaybackRate(playbackRate);
    setActiveVerse(verse);
    setActiveTiming({ startMs: timestampFromMs, endMs, requestId, verseKey: verse.verseKey, reciterId: currentReciter.id, audioMode });
    setPlayingVerseKey(verse.verseKey);
    player.play();
    stopTimerRef.current = setTimeout(() => {
      if (isCurrentRequest()) {
        player.pause();
        setPlayingVerseKey(undefined);
      }
    }, Math.max(1, (endMs - timestampFromMs) / playbackRate));
  }, [activeTiming, currentReciter, pauseGlobalAudio, playbackRate, playingVerseKey, surahId, versePlayer]);

  const playNeighbor = useCallback((direction: -1 | 1) => {
    if (!activeVerse) return;
    const index = verses.findIndex((verse) => verse.verseKey === activeVerse.verseKey);
    const neighbor = verses[index + direction];
    if (neighbor) void listenToVerse(neighbor);
  }, [activeVerse, listenToVerse, verses]);

  const cyclePlaybackRate = useCallback(() => {
    const next = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
    setPlaybackRate(next);
    versePlayer.setPlaybackRate(next);
    if (activeTiming && playingVerseKey && activeTiming.requestId === sessionIdRef.current) {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      const syncPositionMs = getSyncPositionMs(
        audioPositionMilliseconds(versePlayer.currentTime),
        activeTiming.startMs,
        activeTiming.audioMode,
      );
      const remainingMs = activeTiming.endMs - syncPositionMs;
      const requestId = activeTiming.requestId;
      stopTimerRef.current = setTimeout(() => {
        if (sessionIdRef.current !== requestId) return;
        versePlayer.pause();
        setPlayingVerseKey(undefined);
      }, Math.max(1, remainingMs / next));
    }
  }, [activeTiming, playbackRate, playingVerseKey, versePlayer]);

  const syncPositionMs = activeTiming
    ? getSyncPositionMs(
      audioPositionMilliseconds(versePlayerStatus.currentTime),
      activeTiming.startMs,
      activeTiming.audioMode,
    )
    : audioPositionMilliseconds(versePlayerStatus.currentTime);
  const verseProgress = activeTiming
    ? Math.max(0, Math.min(1, (syncPositionMs - activeTiming.startMs) / Math.max(1, activeTiming.endMs - activeTiming.startMs)))
    : versePlayerStatus.duration > 0
      ? Math.max(0, Math.min(1, versePlayerStatus.currentTime / versePlayerStatus.duration))
      : 0;

  const wordTimestamps = useMemo(
    () => activeRecitationTimeline?.key === `${currentReciter?.id}:${surahId}`
      ? normalizeWordTimestamps(activeRecitationTimeline.timestamps, versePlayerStatus.duration)
      : [],
    [activeRecitationTimeline, currentReciter?.id, surahId, versePlayerStatus.duration],
  );
  const activeWordState = useMemo(() => activeVerse
    ? getWordSyncState({
      positionMs: syncPositionMs,
      verseTimeline: wordTimestamps.filter((word) => word.verseId === activeVerse.id),
    })
    : { activeWordPosition: null, completedWordPositions: [] as number[] },
  [activeVerse, syncPositionMs, wordTimestamps]);
  const lastReadWordPosition = activeWordState.completedWordPositions.at(-1) ?? null;
  const isWordSyncUnavailable = Boolean(activeTiming && activeRecitationTimeline && wordTimestamps.length === 0);

  useEffect(() => {
    if (!activeTiming || !playingVerseKey || activeTiming.requestId !== sessionIdRef.current) return;
    const currentMs = getSyncPositionMs(
      audioPositionMilliseconds(versePlayerStatus.currentTime),
      activeTiming.startMs,
      activeTiming.audioMode,
    );
    if (currentMs < activeTiming.endMs) return;
    versePlayer.pause();
    setPlayingVerseKey(undefined);
  }, [activeTiming, playingVerseKey, versePlayer, versePlayerStatus.currentTime]);
  const verseShareText = (verse: QuranFoundationVerse) => `${verse.textUthmani}\n\n${verse.translation ?? verse.translations?.[0]?.text ?? ''}\n— Coran ${verse.verseKey}`;
  const runVerseAction = async (verse: QuranFoundationVerse, action: number) => {
    const verseKey = verse.verseKey as `${number}:${number}`;
    if (action === 0) return listenToVerse(verse);
    if (action === 1) {
      const favorites = await offlineRepository.getFavorites();
      const id = `verse:${verseKey}`;
      await offlineRepository.saveFavorites(favorites.some((item) => item.id === id) ? favorites.filter((item) => item.id !== id) : [...favorites, { id, type: 'verse', targetId: verseKey, createdAt: new Date().toISOString() }]);
      void hapticsService.favorite();
    }
    if (action === 2) {
      const bookmarks = await offlineRepository.getBookmarks();
      const existing = bookmarks.find((item) => item.verseKey === verseKey);
      await offlineRepository.saveBookmarks(existing ? bookmarks.filter((item) => item.verseKey !== verseKey) : [...bookmarks, { id: verseKey, verseKey, createdAt: new Date().toISOString() }]);
      void hapticsService.bookmark();
    }
    if (action === 3) {
      await Clipboard.setStringAsync(verseShareText(verse));
      Alert.alert('Copié', `Le verset ${verseKey} a été copié.`);
    }
    if (action === 4) await Share.share({ message: verseShareText(verse) });
    if (action === 5) Alert.alert(`Tafsir · ${verseKey}`, 'Le tafsir de ce verset sera affiché ici dès que la ressource sera disponible.');
    if (action === 6) {
      const bookmarks = await offlineRepository.getBookmarks();
      const existing = bookmarks.find((item) => item.verseKey === verseKey);
      if (Platform.OS === 'ios') {
        Alert.prompt('Ajouter une note', `Verset ${verseKey}`, async (note) => {
          const next = bookmarks.filter((item) => item.verseKey !== verseKey);
          if (note.trim()) next.push({ id: verseKey, verseKey, note: note.trim(), createdAt: existing?.createdAt ?? new Date().toISOString() });
          await offlineRepository.saveBookmarks(next);
        }, 'plain-text', existing?.note);
      } else {
        Alert.alert('Ajouter une note', 'La saisie de notes est disponible sur iOS.');
      }
    }
  };
  const actions = (verse: QuranFoundationVerse) => {
    const options = ['Écouter ce verset', 'Mettre en favori', 'Ajouter un signet', 'Copier', 'Partager', 'Ouvrir le tafsir', 'Ajouter une note', 'Annuler'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ title: `Verset ${verse.verseKey}`, options, cancelButtonIndex: 7 }, (index) => { if (index < 7) void runVerseAction(verse, index); });
      return;
    }
    const buttons: AlertButton[] = options.slice(0, 7).map((text, index) => ({ text, onPress: () => void runVerseAction(verse, index) }));
    buttons.push({ text: 'Annuler', style: 'cancel' });
    Alert.alert(`Verset ${verse.verseKey}`, 'Choisissez une action', buttons);
  };
  const listenToVerseRef = useRef(listenToVerse);
  const actionsRef = useRef(actions);
  listenToVerseRef.current = listenToVerse;
  actionsRef.current = actions;
  const handleVerseListen = useCallback((verse: QuranFoundationVerse) => { void listenToVerseRef.current(verse); }, []);
  const handleVerseActions = useCallback((verse: QuranFoundationVerse) => actionsRef.current(verse), []);

  useEffect(() => {
    if (!activeVerse || !currentReciter) return;
    const nextVerse = verses[verses.findIndex((verse) => verse.verseKey === activeVerse.verseKey) + 1];
    if (!nextVerse) return;
    const timelineKey = `${currentReciter.id}:${surahId}`;
    const timing = timelineCacheRef.current.get(timelineKey)?.find((item) => item.verseKey === nextVerse.verseKey);
    const dedicatedUrl = resolveVerseAudioUrl(nextVerse.audioUrl ?? timing?.audioUrl ?? timing?.url);
    if (dedicatedUrl) preloadPlayer.replace({ uri: dedicatedUrl });
  }, [activeVerse, currentReciter, preloadPlayer, surahId, verses]);

  const renderVerse = useCallback<ListRenderItem<QuranFoundationVerse>>(({ item }) => (
    <VerseRow
      verse={item}
      settings={settings}
      screenWidth={screenWidth}
      onPress={handleVerseActions}
      onListen={handleVerseListen}
      isPlaying={playingVerseKey === item.verseKey}
      isActive={activeVerse?.verseKey === item.verseKey}
      activeWordPosition={activeVerse?.verseKey === item.verseKey ? activeWordState.activeWordPosition : null}
      lastReadWordPosition={activeVerse?.verseKey === item.verseKey ? lastReadWordPosition : null}
      isWordSyncUnavailable={activeVerse?.verseKey === item.verseKey && isWordSyncUnavailable}
    />
  ), [activeVerse?.verseKey, activeWordState.activeWordPosition, handleVerseActions, handleVerseListen, isWordSyncUnavailable, lastReadWordPosition, playingVerseKey, screenWidth, settings]);
  const viewability = useRef(({ viewableItems }: { viewableItems: ViewToken<QuranFoundationVerse>[] }) => { const first = viewableItems.find((item) => item.item); if (first?.item) currentVerseRef.current = first.item.id; }).current;
  const palette = settings.theme === 'light' ? '#F7F3EA' : settings.theme === 'sepia' ? '#241D16' : colors.background;

  return <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette }]}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={21} color={colors.goldLight} /></Pressable><View style={styles.headerCopy}><Text style={styles.title}>{surah.frenchName}</Text><Text style={styles.meta}>Sourate {surah.id} · {surah.revelationType} · {surah.verses} versets</Text></View><Text style={styles.headerArabic}>{surah.arabicName}</Text><Pressable onPress={() => setShowSettings((value) => !value)} style={styles.iconButton}><Ionicons name="options-outline" size={21} color={colors.goldLight} /></Pressable></View>
    {showSettings ? <View style={styles.settings}>
      <FlatList horizontal data={modes} keyExtractor={(item) => item.id} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <Pressable onPress={() => updateSettings({ mode: item.id })} style={[styles.chip, settings.mode === item.id && styles.chipActive]}><Text style={styles.chipText}>{item.label}</Text></Pressable>} />
      <View style={styles.settingRow}><Text style={styles.settingLabel}>Arabe</Text><Pressable onPress={() => updateSettings({ arabicSize: Math.max(20, settings.arabicSize - 2) })}><Text style={styles.adjust}>A−</Text></Pressable><Pressable onPress={() => updateSettings({ arabicSize: Math.min(48, settings.arabicSize + 2) })}><Text style={styles.adjust}>A+</Text></Pressable><Pressable accessibilityRole="switch" accessibilityState={{ checked: settings.showTransliteration }} onPress={() => updateSettings({ showTransliteration: !settings.showTransliteration })} style={[styles.transliterationToggle, settings.showTransliteration && styles.transliterationToggleActive]}><Ionicons name="text-outline" size={14} color={settings.showTransliteration ? colors.background : colors.goldLight} /><Text style={[styles.transliterationToggleText, settings.showTransliteration && styles.transliterationToggleTextActive]}>Phonétique</Text></Pressable></View>
      <View style={styles.settingRow}><Text style={styles.settingLabel}>Thème</Text>{(['dark','sepia','light'] as ReadingTheme[]).map((theme) => <Pressable key={theme} onPress={() => updateSettings({ theme })} style={[styles.themeDot, { backgroundColor: theme === 'light' ? '#F7F3EA' : theme === 'sepia' ? '#6B5237' : '#090711' }, settings.theme === theme && styles.themeActive]} />)}</View>
    </View> : null}
    {loading ? <ActivityIndicator style={styles.loader} color={colors.gold} /> : error ? <Pressable onPress={() => void loadVerses()} style={styles.error}><Text style={styles.errorText}>{error}\nTouchez pour réessayer</Text></Pressable> : verses.length === 0 ? <View style={styles.error}><Text style={styles.errorText}>Aucun verset disponible.</Text></View> : <FlatList ref={listRef} data={verses} keyExtractor={(item) => item.verseKey} renderItem={renderVerse} contentContainerStyle={styles.content} initialNumToRender={8} maxToRenderPerBatch={8} updateCellsBatchingPeriod={40} windowSize={7} removeClippedSubviews onViewableItemsChanged={viewability} onScroll={(event) => { offsetRef.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={250} />}
    {activeVerse ? <View style={styles.inlinePlayer}>
      <View style={styles.inlineProgressTrack}><View style={[styles.inlineProgress, { width: `${verseProgress * 100}%` }]} /></View>
      <View style={styles.inlineControls}>
        <Pressable accessibilityLabel="Verset précédent" disabled={activeVerse.id <= 1} onPress={() => playNeighbor(-1)} style={styles.inlineSmallButton}><Ionicons name="play-skip-back" size={18} color={activeVerse.id <= 1 ? colors.textMuted : colors.goldLight} /></Pressable>
        <Pressable accessibilityLabel={playingVerseKey ? 'Pause' : 'Lecture'} onPress={() => void listenToVerse(activeVerse)} style={styles.inlinePlayButton}><Ionicons name={playingVerseKey ? 'pause' : 'play'} size={21} color={colors.background} /></Pressable>
        <Pressable accessibilityLabel="Verset suivant" disabled={activeVerse.id >= verses.length} onPress={() => playNeighbor(1)} style={styles.inlineSmallButton}><Ionicons name="play-skip-forward" size={18} color={activeVerse.id >= verses.length ? colors.textMuted : colors.goldLight} /></Pressable>
        <View style={styles.inlineCopy}><Text numberOfLines={1} style={styles.inlineTitle}>{surah.frenchName} · Verset {activeVerse.id}</Text><Text numberOfLines={1} style={styles.inlineSubtitle}>{currentReciter?.name ?? 'Récitateur'}</Text></View>
        <Pressable accessibilityLabel="Vitesse de lecture" onPress={cyclePlaybackRate} style={styles.rateButton}><Text style={styles.rateText}>{playbackRate}×</Text></Pressable>
      </View>
    </View> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1}, header:{minHeight:74,paddingHorizontal:12,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderColor:colors.borderSoft,backgroundColor:colors.backgroundSecondary},iconButton:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',backgroundColor:colors.purpleDeep},headerCopy:{flex:1,marginLeft:10},title:{color:colors.text,fontFamily:typography.serifMedium,fontSize:22},meta:{color:colors.textMuted,fontSize:9},headerArabic:{maxWidth:90,color:colors.goldLight,fontFamily:typography.arabic,fontSize:20,textAlign:'right'},settings:{padding:10,borderBottomWidth:1,borderColor:colors.borderSoft,backgroundColor:colors.backgroundSecondary},chip:{marginRight:7,paddingHorizontal:12,paddingVertical:8,borderRadius:14,backgroundColor:colors.surface},chipActive:{borderWidth:1,borderColor:colors.gold},chipText:{color:colors.textSecondary,fontSize:10},settingRow:{marginTop:10,flexDirection:'row',alignItems:'center',gap:10},settingLabel:{color:colors.textMuted,fontSize:10},adjust:{color:colors.goldLight,fontSize:14,fontWeight:'700'},transliterationToggle:{marginLeft:'auto',paddingHorizontal:11,height:32,flexDirection:'row',alignItems:'center',gap:6,borderRadius:16,borderWidth:1,borderColor:colors.borderSoft},transliterationToggleActive:{backgroundColor:colors.goldLight,borderColor:colors.goldLight},transliterationToggleText:{color:colors.goldLight,fontSize:10,fontWeight:'600'},transliterationToggleTextActive:{color:colors.background},themeDot:{width:23,height:23,borderRadius:12,borderWidth:1,borderColor:colors.borderSoft},themeActive:{borderWidth:2,borderColor:colors.gold},content:{paddingHorizontal:20,paddingBottom:190},verse:{maxWidth:760,width:'100%',alignSelf:'center',paddingVertical:34,paddingHorizontal:8,borderBottomWidth:StyleSheet.hairlineWidth,borderColor:'rgba(224,188,112,0.22)'},verseActive:{borderRadius:18,borderBottomColor:'rgba(224,188,112,0.48)',backgroundColor:'rgba(200,148,58,0.07)'},verseWide:{maxWidth:920},verseTop:{flexDirection:'row',alignItems:'center',marginBottom:26},number:{width:27,height:27,borderRadius:14,alignItems:'center',justifyContent:'center',borderWidth:StyleSheet.hairlineWidth,borderColor:colors.goldLight,backgroundColor:colors.goldDark},numberText:{color:colors.background,fontSize:9,fontWeight:'700'},location:{marginLeft:9,color:colors.textMuted,fontSize:10,letterSpacing:0.3},listenIcon:{marginLeft:'auto',width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(126,72,148,0.18)'},arabic:{color:colors.goldLight,fontFamily:typography.arabic,textAlign:'right',writingDirection:'rtl',paddingVertical:8},arabicText:{width:'100%',flexShrink:1,textAlign:'right',writingDirection:'rtl',includeFontPadding:false},syncUnavailable:{marginTop:12,color:colors.textMuted,fontSize:11,textAlign:'center'},translation:{marginTop:28,paddingTop:22,borderTopWidth:StyleSheet.hairlineWidth,borderColor:'rgba(224,188,112,0.16)',color:colors.textSecondary},transliteration:{marginTop:22,color:colors.textMuted,fontStyle:'italic',fontWeight:'400',lineHeight:28,textAlign:'left'},inlinePlayer:{position:'absolute',left:12,right:12,bottom:12,overflow:'hidden',borderRadius:20,borderWidth:1,borderColor:colors.goldDark,backgroundColor:colors.backgroundSecondary,shadowColor:'#000',shadowOffset:{width:0,height:8},shadowOpacity:0.35,shadowRadius:14,elevation:14},inlineProgressTrack:{height:3,backgroundColor:colors.surfaceLight},inlineProgress:{height:'100%',backgroundColor:colors.goldLight},inlineControls:{minHeight:72,paddingHorizontal:10,flexDirection:'row',alignItems:'center'},inlineSmallButton:{width:34,height:40,alignItems:'center',justifyContent:'center'},inlinePlayButton:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:colors.goldLight},inlineCopy:{flex:1,minWidth:0,marginLeft:10},inlineTitle:{color:colors.text,fontFamily:typography.serifMedium,fontSize:16},inlineSubtitle:{marginTop:2,color:colors.textMuted,fontSize:9},rateButton:{minWidth:38,height:32,paddingHorizontal:6,alignItems:'center',justifyContent:'center',borderRadius:16,borderWidth:1,borderColor:colors.borderSoft},rateText:{color:colors.goldLight,fontSize:10,fontWeight:'700'},loader:{flex:1},error:{flex:1,alignItems:'center',justifyContent:'center'},errorText:{color:colors.textSecondary,textAlign:'center',lineHeight:22},
});
