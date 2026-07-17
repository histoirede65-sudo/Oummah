import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useI18n, type TranslationKey } from '../i18n';

const shortcuts = [
  { id: 'quran', labelKey: 'home.shortcutQuran', subtitleKey: 'home.shortcutQuranSubtitle' },
  { id: 'dhikr', labelKey: 'home.shortcutDhikr', subtitleKey: 'home.shortcutDhikrSubtitle' },
  { id: 'calendar', labelKey: 'home.shortcutCalendar', subtitleKey: 'home.shortcutCalendarSubtitle' },
  { id: 'qibla', labelKey: 'home.shortcutQibla', subtitleKey: 'home.shortcutQiblaSubtitle' },
] as const;

type ShortcutId = (typeof shortcuts)[number]['id'];

function ShortcutIcon({ id, size }: { id: ShortcutId; size: number }) {
  if (id === 'quran') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Path d="M5 10c8-2 14 0 19 5v25c-5-5-11-7-19-5V10Zm38 0c-8-2-14 0-19 5v25c5-5 11-7 19-5V10Z" fill="none" stroke={colors.gold} strokeWidth={2} strokeLinejoin="round" />
        <Path d="M9 14c5-.6 9 .6 12 3M39 14c-5-.6-9 .6-12 3" fill="none" stroke={colors.goldLight} strokeLinecap="round" />
      </Svg>
    );
  }

  if (id === 'dhikr') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Circle cx={24} cy={23} r={15} fill="none" stroke={colors.gold} strokeWidth={1.7} strokeDasharray="2.5 2.8" />
        <Circle cx={24} cy={7} r={2.3} fill={colors.goldLight} />
        <Circle cx={9} cy={23} r={2.3} fill={colors.goldLight} />
        <Circle cx={39} cy={23} r={2.3} fill={colors.goldLight} />
        <Path d="M21 38c2 5 7 6 11 3" fill="none" stroke={colors.gold} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }

  if (id === 'calendar') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Rect x={6} y={9} width={36} height={33} rx={5} fill="none" stroke={colors.gold} strokeWidth={2} />
        <Path d="M6 18h36M15 5v8M33 5v8" fill="none" stroke={colors.goldLight} strokeWidth={2} strokeLinecap="round" />
        {[15, 24, 33].flatMap((x) => [26, 34].map((y) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.5} fill={colors.gold} />))}
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={19} fill="none" stroke={colors.gold} strokeWidth={2} />
      <Path d="m31 15-4 12-12 6 6-12 10-6Z" fill="none" stroke={colors.goldLight} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={24} cy={24} r={2} fill={colors.gold} />
    </Svg>
  );
}

export default function HomeShortcuts() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 370;

  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      {shortcuts.map((item) => (
        <Pressable key={item.id} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <ShortcutIcon id={item.id} size={compact ? 25 : 29} />
          <Text style={styles.label}>{t(item.labelKey as TranslationKey)}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.subtitle}>{t(item.subtitleKey as TranslationKey)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 82, marginBottom: 8, flexDirection: 'row', gap: 6 },
  compactRow: { gap: 4 },
  card: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  label: { marginTop: 4, color: colors.text, fontFamily: typography.sans, fontSize: 10.5 },
  subtitle: { width: '100%', marginTop: 2, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 7.5, textAlign: 'center' },
  pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
});
