import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n } from '../../i18n';
import { useReciter } from '../../context/ReciterProvider';

type ContinueListeningCardProps = {
  onResume: () => void;
  onOpenRecitations: () => void;
};

export default function ContinueListeningCard({ onResume, onOpenRecitations }: ContinueListeningCardProps) {
  const { t } = useI18n();
  const { currentReciter } = useReciter();
  return (
    <View style={styles.card}>
      <Pressable onPress={onResume} style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
        <View style={styles.icon}><Ionicons name="headset" size={22} color={colors.goldMuted} /></View>
        <View style={styles.copy}>
          <Text style={styles.caption}>{t('quran.continueListening')}</Text>
          <Text style={styles.title}>{t('quran.alFatiha')}</Text>
          <Text style={styles.detail}>{currentReciter ? `${currentReciter.name} · 02:45` : '02:45'}</Text>
        </View>
        <View style={styles.play}><Ionicons name="play" size={17} color={colors.background} /></View>
      </Pressable>
      <Pressable onPress={onOpenRecitations} style={({ pressed }) => [styles.library, pressed && styles.pressed]}>
        <Text style={styles.libraryText}>{t('quran.openRecitations')}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.goldMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 10, overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  main: { minHeight: 83, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.purpleDeep },
  copy: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  caption: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 7.5, fontWeight: '700', letterSpacing: 1 },
  title: { marginTop: 2, color: colors.text, fontFamily: typography.serifMedium, fontSize: 17 },
  detail: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 8.5 },
  play: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.goldMuted },
  library: { height: 34, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.borderSoft },
  libraryText: { marginRight: 5, color: colors.goldMuted, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '600' },
  pressed: { opacity: 0.62 },
});
