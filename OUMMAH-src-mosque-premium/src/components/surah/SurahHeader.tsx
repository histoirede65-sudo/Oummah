import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Surah } from '../../data/surahs';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type SurahHeaderProps = {
  surah: Surah;
  onBack: () => void;
  audioMode?: boolean;
};

export default function SurahHeader({ surah, onBack, audioMode }: SurahHeaderProps) {
  const { t } = useI18n();
  return (
    <View style={[styles.container, audioMode && styles.containerAudio]}>
      <Pressable accessibilityLabel={t('common.back')} onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Ionicons name="arrow-back" size={21} color={colors.goldMuted} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.french}>{audioMode ? surah.transliteration : surah.frenchName}</Text>
        {audioMode ? (
          <View style={styles.liveRow}><Text style={styles.live}>{t('quran.currentReading')}</Text><View style={styles.liveDot} /></View>
        ) : (
          <>
            <Text style={styles.transliteration}>{surah.transliteration}</Text>
            <Text style={styles.meta}>{t('common.surahMeta', { count: surah.verses, place: surah.revelationType })}</Text>
          </>
        )}
      </View>
      {audioMode ? null : <Text style={styles.arabic}>{surah.arabicName}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 86, flexDirection: 'row', alignItems: 'center' },
  containerAudio: { minHeight: 70 },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.purpleDeep },
  copy: { flex: 1, minWidth: 0, marginHorizontal: 12 },
  french: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 25, fontWeight: '400' },
  transliteration: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '600' },
  meta: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '500' },
  arabic: { maxWidth: '31%', color: colors.goldLight, fontSize: 25, textAlign: 'right', writingDirection: 'rtl' },
  liveRow: { flexDirection: 'row', alignItems: 'center' },
  live: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10, fontWeight: '500' },
  liveDot: { width: 5, height: 5, marginLeft: 6, borderRadius: 3, backgroundColor: colors.gold },
  pressed: { opacity: 0.6 },
});
