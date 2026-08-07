import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n, type TranslationKey } from '../../i18n';

const categories = [
  { labelKey: 'quran.surahs', icon: 'book-outline' as const },
  { labelKey: 'common.favorites', icon: 'star-outline' as const },
  { labelKey: 'common.bookmarks', icon: 'bookmark-outline' as const },
  { labelKey: 'common.audio', icon: 'headset-outline' as const },
];

export default function QuranCategoryTabs() {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      {categories.map((category, index) => (
        <Pressable key={category.labelKey} style={({ pressed }) => [styles.item, index === 0 && styles.itemActive, pressed && styles.pressed]}>
          <Ionicons name={category.icon} size={20} color={index === 0 ? colors.goldLight : colors.gold} />
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, index === 0 && styles.labelActive]}>{t(category.labelKey as TranslationKey)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 72, marginVertical: 12, flexDirection: 'row', gap: 7 },
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  itemActive: { borderColor: colors.goldDark, backgroundColor: colors.surfaceAlt },
  label: { width: '100%', marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9, textAlign: 'center' },
  labelActive: { color: colors.goldLight, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
