import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n } from '../../i18n';

type LastReadingCardProps = { onResume?: () => void; surahName?: string; page?: number; verse?: number; progress?: number };

export default function LastReadingCard({ onResume, surahName, page, verse, progress = 0 }: LastReadingCardProps) {
  const { t } = useI18n();
  return (
    <LinearGradient colors={[colors.surfaceAlt, colors.surface]} style={styles.card}>
      <View style={styles.book}><Ionicons name="book-outline" size={31} color={colors.goldLight} /></View>
      <View style={styles.content}>
        <Text style={styles.caption}>{t('quran.continueReading')}</Text>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{surahName ?? t('quran.alBaqara')}</Text>
          <Ionicons name="bookmark" size={15} color={colors.gold} />
        </View>
        <Text style={styles.detail}>{t('quran.lastPosition', { page: page ?? 1, verse: verse ?? 1 })}</Text>
        <View style={styles.progressTrack}><LinearGradient colors={[colors.goldDark, colors.goldLight]} style={[styles.progress, { width: `${Math.max(2, progress)}%` }]} /></View>
      </View>
      <Pressable accessibilityRole="button" onPress={onResume} style={({ pressed }) => [styles.resume, pressed && styles.pressed]}>
        <Ionicons name="play" size={14} color={colors.background} />
        <Text style={styles.resumeText}>{t('quran.resume')}</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 126, padding: 13, flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  book: { width: 60, height: 82, alignItems: 'center', justifyContent: 'center', borderRadius: 17, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.purpleDeep },
  content: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  caption: { color: colors.gold, fontFamily: typography.sans, fontSize: 7.5, fontWeight: '700', letterSpacing: 1.1 },
  titleRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 20 },
  detail: { marginTop: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10, fontWeight: '500' },
  progressTrack: { height: 3, marginTop: 12, overflow: 'hidden', borderRadius: 2, backgroundColor: colors.surfaceLight },
  progress: { height: '100%' },
  resume: { minWidth: 72, height: 38, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: colors.goldLight },
  resumeText: { marginLeft: 4, color: colors.background, fontFamily: typography.sans, fontSize: 9, fontWeight: '700' },
  pressed: { opacity: 0.65 },
});
