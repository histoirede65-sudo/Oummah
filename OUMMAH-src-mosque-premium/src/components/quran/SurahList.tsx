import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Surah } from '../../data/surahs';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n } from '../../i18n';

type SurahListProps = {
  data: Surah[];
  header: React.ReactElement;
  onSurahPress: (surah: Surah) => void;
  emptyMessage?: string;
};

export default function SurahList({ data, header, onSurahPress, emptyMessage }: SurahListProps) {
  const { t } = useI18n();
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>{emptyMessage ?? t('quran.empty')}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => onSurahPress(item)}
          style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
        >
          <View style={styles.number}><Text style={styles.numberText}>{item.id}</Text></View>
          <View style={styles.main}>
            <Text numberOfLines={1} style={styles.french}>{item.frenchName}</Text>
            <Text numberOfLines={1} style={styles.transliteration}>{item.transliteration}</Text>
            <Text style={styles.meta}>{t('common.surahMeta', { count: item.verses, place: item.revelationType })}</Text>
          </View>
          <Text numberOfLines={1} style={styles.arabic}>{item.arabicName}</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={14}
      maxToRenderPerBatch={12}
      windowSize={9}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 104 },
  cell: { minHeight: 86, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 17, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  number: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: colors.goldDark, backgroundColor: colors.purpleDeep },
  numberText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: '700' },
  main: { flex: 1, minWidth: 0, marginLeft: 12 },
  french: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 16 },
  transliteration: { marginTop: -1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '500' },
  meta: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9 },
  arabic: { maxWidth: '28%', marginHorizontal: 9, color: colors.goldLight, fontFamily: typography.arabic, fontSize: 18, textAlign: 'right', writingDirection: 'rtl' },
  separator: { height: 7 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.995 }] },
  empty: { paddingVertical: 54, alignItems: 'center' },
  emptyText: { marginTop: 9, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
});
