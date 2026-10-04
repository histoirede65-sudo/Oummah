import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useGlobalAudioPlayer } from '../../context/AudioPlayerProvider';
import { premiumAnimations } from '../../core/animations';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useOfflineDownloads } from '../../features/audio/presentation/useOfflineDownloads';
import AudioProgress from './AudioProgress';
import PlayerControls from './PlayerControls';
import PlayerOptions from './PlayerOptions';

type AudioPlayerProps = {
  compact?: boolean;
  /** Only the options (speed, repeat, download, timer): the transport lives elsewhere on the screen. */
  optionsOnly?: boolean;
  minimal?: boolean;
  onPlayLongPress?: () => void;
  onOpenMenu?: () => void;
  onTogglePlay?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function AudioPlayer({ compact, optionsOnly, minimal, onPlayLongPress, onOpenMenu, onTogglePlay, onPrevious, onNext }: AudioPlayerProps) {
  const { t } = useI18n();
  const secondaryMotion = useRef(premiumAnimations.createValues('fadeOut')).current;
  const initialized = useRef(false);
  const {
    track,
    isPlaying,
    playbackRate,
    repeatMode,
    sleepTimer,
    currentTime,
    duration,
    progress,
    togglePlay,
    skipBy,
    seekTo,
    previous,
    next,
    cycleRepeatMode,
    cyclePlaybackRate,
    cycleSleepTimer,
    prepareDownload,
  } = useGlobalAudioPlayer();
  const offline = useOfflineDownloads();
  const download = track ? offline.downloads.get(track.id) : undefined;

  const handleSeek = useCallback((position: number) => {
    if (duration <= 0) return;
    void seekTo(position * duration).catch(() => undefined);
  }, [duration, seekTo]);

  const handleDownload = useCallback(() => {
    if (!track) return;
    if (download?.state === 'downloading' || download?.state === 'queued') {
      offline.cancel(track.id);
      return;
    }
    offline.enqueue(track);
    void prepareDownload().catch(() => undefined);
  }, [download?.state, offline, prepareDownload, track]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      secondaryMotion.opacity?.setValue(minimal ? 0 : 1);
      return;
    }
    const animation = premiumAnimations.start(minimal ? 'fadeOut' : 'fadeIn', secondaryMotion);
    return () => animation.stop();
  }, [minimal, secondaryMotion]);

  return (
    <LinearGradient
      colors={['rgba(23,16,38,0.94)', 'rgba(15,11,27,0.97)', 'rgba(10,8,22,0.98)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrapper, compact && styles.wrapperCompact, optionsOnly && styles.wrapperOptions]}
    >
      {optionsOnly ? null : <AudioProgress progress={progress} elapsed={formatTime(currentTime)} duration={formatTime(duration)} onSeek={handleSeek} />}
      {optionsOnly ? null : <PlayerControls
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay ?? togglePlay}
        onPlayLongPress={onPlayLongPress}
        onSeekBackward={() => void skipBy(-10)}
        onSeekForward={() => void skipBy(10)}
        onPrevious={onPrevious ?? (() => void previous())}
        onNext={onNext ?? (() => void next())}
        compact={compact}
        primaryOnly={minimal}
        secondaryOpacity={secondaryMotion.opacity}
      />}
      <Animated.View pointerEvents={minimal ? 'none' : 'auto'} style={{ opacity: secondaryMotion.opacity }}>
        <PlayerOptions
          repeatMode={repeatMode}
          sleepTimer={sleepTimer}
          playbackRate={playbackRate}
          onCycleRepeat={cycleRepeatMode}
          onCycleSpeed={cyclePlaybackRate}
          onCycleTimer={cycleSleepTimer}
          onPrepareDownload={handleDownload}
          downloadState={download?.state}
          downloadProgress={download?.progress}
          compact={compact}
        />
        <View style={styles.modeRow}>
          <View style={[styles.modeDot, repeatMode !== 'none' && styles.modeDotActive]} />
          <Text style={styles.modeText}>{t(repeatMode === 'surah' ? 'audio.repeatSurah' : repeatMode === 'verse' ? 'audio.repeatVerse' : 'audio.normal')}</Text>
          {onOpenMenu ? (
            <Pressable onPress={onOpenMenu} style={({ pressed }) => [styles.surahMenuButton, pressed && styles.pressed]}>
              <Text style={styles.surahMenuText}>{t('tadabbur.mode')}</Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 18,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    borderRadius: 32,
    borderWidth: 1.2,
    borderColor: 'rgba(227,181,90,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 22,
    elevation: 7,
  },
  wrapperCompact: { marginTop: 5, padding: 10 },
  wrapperOptions: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10, borderRadius: 24 },
  modeRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  modeDot: { width: 5, height: 5, marginRight: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  modeDotActive: { backgroundColor: colors.goldMuted },
  modeText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '500' },
  surahMenuButton: { marginLeft: 10, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(227,181,90,0.35)', backgroundColor: 'rgba(21,12,36,0.88)' },
  surahMenuText: { color: colors.text, fontFamily: typography.sans, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.62 },
});
