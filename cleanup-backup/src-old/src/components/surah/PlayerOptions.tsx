import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../../i18n';
import type { RepeatMode, SleepTimerOption } from '../../core/audio';
import type { DownloadState } from '../../core/repositories';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type PlayerOptionsProps = {
  repeatMode: RepeatMode;
  sleepTimer: SleepTimerOption;
  playbackRate: number;
  onCycleRepeat: () => void;
  onCycleSpeed: () => void;
  onCycleTimer: () => void;
  onPrepareDownload: () => void;
  downloadState?: DownloadState;
  downloadProgress?: number;
  compact?: boolean;
};

export default function PlayerOptions({ repeatMode, sleepTimer, playbackRate, onCycleRepeat, onCycleSpeed, onCycleTimer, onPrepareDownload, downloadState, downloadProgress = 0, compact }: PlayerOptionsProps) {
  const { t } = useI18n();
  const repeatLabel = repeatMode === 'verse'
    ? t('audio.repeatVerse')
    : repeatMode === 'surah'
      ? t('audio.repeatSurah')
      : t('audio.repeat');
  const timerLabel = sleepTimer === 'endOfSurah'
    ? t('audio.timerEnd')
    : typeof sleepTimer === 'number'
      ? t('audio.timerMinutes', { minutes: sleepTimer })
      : t('audio.timer');
  const downloadLabel = downloadState === 'downloaded'
    ? 'Hors ligne'
    : downloadState === 'downloading' || downloadState === 'queued'
      ? `${Math.round(downloadProgress * 100)}%`
      : downloadState === 'failed'
        ? 'Erreur'
        : t('audio.download');
  const options = [
    { id: 'speed', label: `${playbackRate}x`, icon: 'speedometer-outline' as const, active: playbackRate !== 1, onPress: onCycleSpeed },
    { id: 'repeat', label: repeatLabel, icon: repeatMode === 'none' ? 'repeat-outline' as const : 'repeat' as const, active: repeatMode !== 'none', onPress: onCycleRepeat },
    { id: 'download', label: downloadLabel, icon: downloadState === 'downloaded' ? 'checkmark' as const : downloadState === 'failed' ? 'warning-outline' as const : 'download-outline' as const, active: downloadState === 'downloaded' || downloadState === 'downloading' || downloadState === 'queued', onPress: onPrepareDownload },
    { id: 'timer', label: timerLabel, icon: 'timer-outline' as const, active: sleepTimer !== null, onPress: onCycleTimer },
  ];

  return (
    <View style={styles.options}>
      {options.map((option) => (
        <Pressable key={option.id} onPress={option.onPress} style={({ pressed }) => [styles.option, compact && styles.optionCompact, option.active && styles.active, pressed && styles.pressed]}>
          <View style={[styles.iconFrame, option.active && styles.iconFrameActive]}>
            <Ionicons name={option.icon} size={18} color={colors.goldMuted} />
          </View>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, option.active && styles.labelActive]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { marginTop: 4, flexDirection: 'row', gap: 8 },
  option: { flex: 1, minWidth: 0, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: 'rgba(23,16,38,0.84)' },
  optionCompact: { height: 44 },
  active: { borderColor: colors.goldDark, backgroundColor: colors.purpleDeep },
  iconFrame: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.purpleDeep },
  iconFrameActive: { backgroundColor: 'rgba(196,154,66,0.14)' },
  label: { width: '100%', marginTop: 7, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 8.5, fontWeight: '700', textAlign: 'center' },
  labelActive: { color: colors.goldLight },
  pressed: { opacity: 0.58 },
});
