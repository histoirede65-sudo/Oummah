import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useI18n } from '../i18n';

type ContinueReadingCardProps = { onPress?: () => void };

export default function ContinueReadingCard({ onPress }: ContinueReadingCardProps) {
  const { t } = useI18n();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <LinearGradient colors={[colors.surfaceAlt, colors.surface]} style={[StyleSheet.absoluteFill, styles.background]} />
      <View style={styles.heading}>
        <Text style={styles.title}>{t('home.continueReading')}</Text>
        <View style={styles.seeAllRow}>
          <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.cover}>
          <Ionicons name="book" size={34} color={colors.primaryLight} />
          <View style={styles.coverBorder} />
        </View>
        <View style={styles.content}>
          <Text style={styles.surah}>{t('quran.alBaqara')}</Text>
          <Text style={styles.detail}>{t('quran.lastPosition', { page: 45, verse: 152 })}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.progress} />
            </View>
            <Text style={styles.percent}>{t('quran.completed', { percent: 60 })}</Text>
          </View>
        </View>
        <View style={styles.bookmark}>
          <Ionicons name="bookmark-outline" size={25} color={colors.primaryLight} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 96,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  },
  background: { borderRadius: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.primaryLight, fontFamily: typography.serifMedium, fontSize: 14, fontWeight: '400' },
  seeAllRow: { flexDirection: 'row', alignItems: 'center' },
  seeAll: { marginRight: 5, color: colors.primaryLight, fontFamily: typography.sans, fontSize: 9.5 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cover: {
    width: 72,
    height: 67,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transform: [{ rotate: '-6deg' }],
    backgroundColor: '#0F1427',
  },
  coverBorder: { position: 'absolute', top: 5, right: 5, bottom: 5, left: 5, borderWidth: 1, borderColor: colors.primaryDark },
  content: { flex: 1, minWidth: 0 },
  surah: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 14, fontWeight: '400' },
  detail: { marginTop: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '500' },
  progressRow: { marginTop: 5, flexDirection: 'row', alignItems: 'center' },
  progressTrack: { flex: 1, height: 3, overflow: 'hidden', borderRadius: 2, backgroundColor: colors.surfaceLight },
  progress: { width: '62%', height: '100%' },
  percent: { marginLeft: 7, color: colors.text, fontFamily: typography.sans, fontSize: 8.5, fontWeight: '500' },
  bookmark: { width: 49, height: 49, marginLeft: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 25, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(43,21,63,0.62)' },
  pressed: { opacity: 0.7 },
});
