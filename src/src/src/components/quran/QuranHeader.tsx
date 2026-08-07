import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n } from '../../i18n';

type QuranHeaderProps = {
  onBackPress?: () => void;
  onFavoritePress?: () => void;
  favoritesActive?: boolean;
};

export default function QuranHeader({
  onBackPress,
  onFavoritePress,
  favoritesActive = false,
}: QuranHeaderProps) {
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
      <View style={styles.center}>
        <Text style={styles.eyebrow}>{t('common.brand')}</Text>
        <Text style={styles.title}>{t('quran.title')}</Text>
      </View>
      <Pressable
        accessibilityLabel={
          favoritesActive ? 'Afficher toutes les sourates' : t('common.favorites')
        }
        onPress={onFavoritePress}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons
          name={favoritesActive ? 'heart' : 'heart-outline'}
          size={21}
          color={colors.goldLight}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(227,181,90,0.22)',
    backgroundColor: 'rgba(24,13,39,0.86)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 9,
  },
  center: { alignItems: 'center' },
  eyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: {
    marginTop: -2,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 31,
  },
  pressed: { opacity: 0.58 },
});
