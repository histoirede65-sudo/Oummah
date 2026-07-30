import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useI18n, type TranslationKey } from '../../i18n';

export type QuranTab = 'surahs' | 'juz' | 'favorites';

type QuranQuickActionsProps = {
  activeTab: QuranTab;
  onTabChange: (tab: QuranTab) => void;
  onFavoritePress: () => void;
  onBookmarkPress: () => void;
  onAudioPress: () => void;
};

const actions = [
  { labelKey: 'quran.allSurahs', icon: 'book-outline' as const, action: 'surahs' as const },
  { labelKey: 'common.favorites', icon: 'star-outline' as const, action: 'favorites' as const },
  { labelKey: 'common.bookmarks', icon: 'bookmark-outline' as const, action: 'bookmarks' as const },
  { labelKey: 'common.audio', icon: 'headset-outline' as const, action: 'audio' as const },
];

const tabs: { id: QuranTab; labelKey: TranslationKey }[] = [
  { id: 'surahs', labelKey: 'quran.surahs' },
  { id: 'juz', labelKey: 'quran.juz' },
  { id: 'favorites', labelKey: 'common.favorites' },
];

export default function QuranQuickActions({
  activeTab,
  onTabChange,
  onFavoritePress,
  onBookmarkPress,
  onAudioPress,
}: QuranQuickActionsProps) {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 370;

  const runAction = (action: (typeof actions)[number]['action']) => {
    if (action === 'surahs') onTabChange('surahs');
    if (action === 'favorites') onFavoritePress();
    if (action === 'bookmarks') onBookmarkPress();
    if (action === 'audio') onAudioPress();
  };

  return (
    <>
      <View style={[styles.actions, compact && styles.actionsCompact]}>
        {actions.map((item) => (
          <Pressable key={item.action} onPress={() => runAction(item.action)} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Ionicons name={item.icon} size={compact ? 19 : 21} color={colors.gold} />
            <Text numberOfLines={2} style={styles.actionLabel}>{t(item.labelKey as TranslationKey)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable key={tab.id} onPress={() => onTabChange(tab.id)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t(tab.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  actions: { height: 78, marginVertical: 12, flexDirection: 'row', gap: 7 },
  actionsCompact: { gap: 4 },
  action: { flex: 1, minWidth: 0, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  actionLabel: { marginTop: 5, color: colors.text, fontFamily: typography.sans, fontSize: 8.5, fontWeight: '500', lineHeight: 11, textAlign: 'center' },
  tabs: { height: 42, marginBottom: 12, padding: 3, flexDirection: 'row', borderRadius: 14, backgroundColor: colors.purpleDeep },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  tabActive: { borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surfaceLight },
  tabLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, fontWeight: '600' },
  tabLabelActive: { color: colors.goldLight },
  pressed: { opacity: 0.6 },
});
