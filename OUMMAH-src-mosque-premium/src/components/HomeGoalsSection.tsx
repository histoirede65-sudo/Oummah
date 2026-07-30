import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useI18n, type TranslationKey } from '../i18n';

const goals = [
  ['home.goalFajr', 'moon-outline', true],
  ['home.goalQuran', 'book-outline', true],
  ['home.goalDhikr', 'radio-button-on-outline', false],
  ['home.goalMorningDua', 'hand-left-outline', false],
  ['home.goalMulk', 'book-outline', false],
  ['home.goalDhuhr', 'business-outline', false],
] as const;

export default function HomeGoalsSection() {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <LinearGradient colors={[colors.surfaceAlt, colors.surface]} style={styles.card}>
        <View style={styles.heading}>
          <Text style={styles.title}>{t('home.goalsToday')}</Text>
          <Text style={styles.counter}>2 / 6</Text>
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.progress} />
        </View>
        <View style={styles.list}>
          {goals.map(([label, icon, done]) => (
            <View key={label} style={styles.goal}>
              <View style={[styles.checkbox, done && styles.checkboxDone]}>
                {done ? <Ionicons name="checkmark" size={10} color={colors.background} /> : null}
              </View>
              <Ionicons name={icon} size={12} color={colors.primaryLight} />
              <Text numberOfLines={1} style={styles.goalText}>{t(label as TranslationKey)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.button}>
          <Text style={styles.buttonText}>{t('home.allGoals')}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.text} />
        </View>
      </LinearGradient>

      <LinearGradient colors={[colors.surfaceAlt, colors.surface]} style={[styles.card, styles.duaCard]}>
        <Text style={[styles.title, styles.duaTitle]}>{t('home.duaToday')}</Text>
        <View style={styles.ornamentRow}>
          <View style={styles.line} /><Text style={styles.diamonds}>{t('home.ornament')}</Text><View style={styles.line} />
        </View>
        <Text style={styles.arabic}>{t('home.duaArabic')}</Text>
        <View style={styles.ornamentRow}>
          <View style={styles.line} /><Text style={styles.diamonds}>{t('home.ornament')}</Text><View style={styles.line} />
        </View>
        <Text style={styles.translation}>{t('home.duaTranslation')}</Text>
        <Text style={styles.source}>{t('home.duaSource')}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 220, marginBottom: 8, flexDirection: 'row', gap: 6 },
  card: {
    flex: 1.05,
    minWidth: 0,
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  },
  duaCard: { flex: 0.95, alignItems: 'center' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.primaryLight, fontFamily: typography.serifMedium, fontSize: 14, fontWeight: '400' },
  counter: { color: colors.primaryLight, fontFamily: typography.sans, fontSize: 11 },
  progressTrack: { height: 4, marginTop: 8, marginBottom: 11, overflow: 'hidden', borderRadius: 3, backgroundColor: colors.surfaceLight },
  progress: { width: '63%', height: '100%', borderRadius: 4 },
  list: { gap: 7 },
  goal: { height: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 3, borderWidth: 1, borderColor: colors.textMuted },
  checkboxDone: { borderColor: colors.primaryLight, backgroundColor: colors.primaryLight },
  goalText: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '500' },
  button: {
    minHeight: 26,
    marginTop: 'auto',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(43,21,63,0.45)',
  },
  buttonText: { color: colors.primaryLight, fontFamily: typography.sans, fontSize: 9.5 },
  duaTitle: { textAlign: 'center' },
  ornamentRow: { marginTop: 9, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  line: { width: 23, height: 1, backgroundColor: 'rgba(216,184,106,0.35)' },
  diamonds: { marginHorizontal: 4, color: colors.primaryLight, fontSize: 5 },
  arabic: { color: colors.primaryLight, fontSize: 16.5, lineHeight: 25, textAlign: 'center', writingDirection: 'rtl' },
  translation: { color: colors.text, fontFamily: typography.sans, fontSize: 9.4, lineHeight: 14, fontWeight: '500', textAlign: 'center' },
  source: { marginTop: 'auto', color: colors.primary, fontFamily: typography.sans, fontSize: 9.5 },
});
