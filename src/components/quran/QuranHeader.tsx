import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n } from '../../i18n';

type QuranHeaderProps = {
  onBackPress?: () => void;
};

export default function QuranHeader({ onBackPress }: QuranHeaderProps) {
  const { t } = useI18n();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel={t('common.back')}
        onPress={onBackPress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
      </Pressable>
      <Text style={styles.title}>{t('quran.title')}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(227,181,90,0.3)',
  },
  spacer: { width: 42 },
  title: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 30,
  },
  pressed: { opacity: 0.58 },
});
