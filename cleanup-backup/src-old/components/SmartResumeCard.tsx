import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ListeningSnapshot } from '../core/audio';
import { useReciter } from '../context/ReciterProvider';
import { useI18n } from '../i18n';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function SmartResumeCard({ snapshot, surahName, onResume }: {
  snapshot: ListeningSnapshot;
  surahName: string;
  onResume: () => void;
}) {
  const { t } = useI18n();
  const { currentReciter } = useReciter();
  const remainingSeconds = Math.max(0, snapshot.durationSeconds - snapshot.positionSeconds);
  const remaining = snapshot.durationSeconds > 0
    ? t('home.remainingMinutes', { minutes: Math.max(1, Math.ceil(remainingSeconds / 60)) })
    : t('home.remainingUnknown');

  return (
    <View style={styles.card}>
      <LinearGradient colors={[colors.surfaceAlt, colors.surface]} style={StyleSheet.absoluteFill} />
      <View style={styles.heading}>
        <Ionicons name="headset" size={17} color={colors.goldMuted} />
        <Text style={styles.headingText}>{t('home.continueRecitation')}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.surah}>{surahName}</Text>
          <Text style={styles.detail}>{t('home.listeningVerse', { verse: snapshot.verseId })} · {currentReciter?.name ?? ''}</Text>
          <Text style={styles.remaining}>{remaining}</Text>
        </View>
        <Pressable accessibilityLabel={t('quran.resume')} onPress={onResume} style={({ pressed }) => [styles.resume, pressed && styles.pressed]}>
          <Ionicons name="play" size={16} color={colors.background} />
          <Text style={styles.resumeText}>{t('quran.resume')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 126, marginBottom: 10, padding: 14, overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 4 },
  heading: { flexDirection: 'row', alignItems: 'center' },
  headingText: { marginLeft: 7, color: colors.goldMuted, fontFamily: typography.serifMedium, fontSize: 18 },
  content: { flex: 1, marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  copy: { flex: 1, minWidth: 0 },
  surah: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19 },
  detail: { marginTop: 2, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9.5 },
  remaining: { marginTop: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 8.5 },
  resume: { minWidth: 91, height: 38, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.goldMuted },
  resumeText: { marginLeft: 5, color: colors.background, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '700' },
  pressed: { opacity: 0.68 },
});
