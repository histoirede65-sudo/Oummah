import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n } from '../../i18n';

type QuranHeaderProps = {
  onMenuPress?: () => void;
  onFavoritePress?: () => void;
};

export default function QuranHeader({ onMenuPress, onFavoritePress }: QuranHeaderProps) {
  const { t } = useI18n();
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel={t('common.menu')} onPress={onMenuPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Ionicons name="menu" size={23} color={colors.goldLight} />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.eyebrow}>{t('common.brand')}</Text>
        <Text style={styles.title}>{t('quran.title')}</Text>
      </View>
      <Pressable accessibilityLabel={t('common.favorites')} onPress={onFavoritePress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Ionicons name="heart-outline" size={21} color={colors.goldLight} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  button: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.purpleDeep },
  center: { alignItems: 'center' },
  eyebrow: { color: colors.gold, fontFamily: typography.sans, fontSize: 8, fontWeight: '700', letterSpacing: 2 },
  title: { marginTop: -1, color: colors.text, fontFamily: typography.serifMedium, fontSize: 27 },
  pressed: { opacity: 0.58 },
});
