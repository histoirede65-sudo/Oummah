import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useI18n } from '../i18n';

type AppHeaderProps = {
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
};

function MosqueLogo() {
  return (
    <Svg width={26} height={26} viewBox="0 0 34 34">
      <Path d="M13 12C13 7.7 17 5 17 5s4 2.7 4 7v2h-8v-2Z" fill={colors.goldLight} />
      <Rect x="11" y="14" width="12" height="15" rx="1" fill={colors.gold} />
      <Path d="M15 29v-6a2 2 0 0 1 4 0v6h-4Z" fill={colors.purpleDeep} />
      <Path d="M4 16c0-3 3-5 3-5s3 2 3 5v2H4v-2Zm20 0c0-3 3-5 3-5s3 2 3 5v2h-6v-2Z" fill={colors.goldLight} />
      <Rect x="3" y="18" width="8" height="11" rx="1" fill={colors.gold} />
      <Rect x="23" y="18" width="8" height="11" rx="1" fill={colors.gold} />
      <Rect x="5" y="7" width="2" height="9" rx="1" fill={colors.gold} />
      <Rect x="27" y="7" width="2" height="9" rx="1" fill={colors.gold} />
      <Path d="M6 4.5 7 7H5l1-2.5Zm22 0L29 7h-2l1-2.5ZM17 1l.8 2H16.2L17 1Z" fill={colors.goldLight} />
    </Svg>
  );
}

function MenuIcon() {
  return (
    <Svg width={25} height={25} viewBox="0 0 25 25">
      <Path d="M4 6.5h17M4 12.5h17M4 18.5h17" stroke={colors.goldLight} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function NotificationIcon() {
  return (
    <Svg width={23} height={23} viewBox="0 0 23 23">
      <Path d="M5 16h13l-2-3v-4a4.5 4.5 0 0 0-9 0v4l-2 3Zm4.5 3h4" fill="none" stroke={colors.goldLight} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={18.5} cy={4.5} r={2.3} fill={colors.danger} />
    </Svg>
  );
}

export default function AppHeader({ onMenuPress, onNotificationPress }: AppHeaderProps) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <Pressable accessibilityLabel={t('common.menu')} onPress={onMenuPress} style={({ pressed }) => [styles.circle, pressed && styles.pressed]}>
        <MenuIcon />
      </Pressable>
      <View style={styles.brand}>
        <MosqueLogo />
        <Text style={styles.brandText}>{t('common.brand')}</Text>
      </View>
      <Pressable accessibilityLabel={t('common.notifications')} onPress={onNotificationPress} style={({ pressed }) => [styles.circle, pressed && styles.pressed]}>
        <NotificationIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circle: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.purpleDeep,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandText: {
    marginLeft: 10,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 21,
    fontWeight: '400',
    letterSpacing: 1.8,
  },
  pressed: { opacity: 0.6 },
});
