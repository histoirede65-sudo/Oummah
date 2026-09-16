import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type VerseActionsProps = {
  isFavorite?: boolean;
  isBookmarked?: boolean;
  compact?: boolean;
  onListen: () => void;
  onTafsir: () => void;
  onDalil: () => void;
  onFavorite: () => void;
  onBookmark: () => void;
  onShare: () => void;
};

export default function VerseActions({
  isFavorite,
  isBookmarked,
  compact,
  onListen,
  onTafsir,
  onDalil,
  onFavorite,
  onBookmark,
  onShare,
}: VerseActionsProps) {
  const { t } = useI18n();
  const actions = [
    { label: t('common.listen'), icon: 'play-outline' as const, onPress: onListen },
    { label: t('common.tafsir'), icon: 'book-outline' as const, onPress: onTafsir },
    { label: t('quran.favorite'), icon: isFavorite ? 'star' as const : 'star-outline' as const, onPress: onFavorite },
    { label: t('common.bookmark'), icon: isBookmarked ? 'bookmark' as const : 'bookmark-outline' as const, onPress: onBookmark },
    { label: t('common.share'), icon: 'share-social-outline' as const, onPress: onShare },
  ];

  if (compact) {
    const compactActions = [
      actions[0],
      actions[1],
      { label: t('nav.dalil'), icon: 'sparkles' as const, onPress: onDalil },
      actions[2],
      actions[3],
      actions[4],
    ];

    return (
      <View style={styles.compactRow}>
        {compactActions.map((action) => (
          <Pressable key={action.label} onPress={action.onPress} style={({ pressed }) => [styles.compactAction, pressed && styles.pressed]}>
            <Ionicons name={action.icon} size={17} color={colors.goldMuted} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.compactLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {actions.map((action) => (
          <Pressable key={action.label} onPress={action.onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Ionicons name={action.icon} size={15} color={colors.gold} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.label}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onDalil} style={({ pressed }) => [styles.dalil, pressed && styles.pressed]}>
        <Ionicons name="sparkles" size={15} color={colors.goldLight} />
        <Text style={styles.dalilText}>{t('quran.explainDalil')}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.goldLight} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  row: { flexDirection: 'row', gap: 5 },
  action: { flex: 1, minWidth: 0, height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.purpleDeep },
  label: { width: '100%', marginTop: 3, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 7.5, fontWeight: '500', textAlign: 'center' },
  dalil: { height: 42, marginTop: 7, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.goldDark, backgroundColor: 'rgba(43,21,63,0.7)' },
  dalilText: { flex: 1, marginLeft: 7, color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '700' },
  pressed: { opacity: 0.58 },
  compactRow: { height: 48, marginTop: 7, flexDirection: 'row', borderRadius: 15, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.purpleDeep },
  compactAction: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: colors.borderSoft },
  compactLabel: { width: '100%', marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 7.5, textAlign: 'center' },
});
