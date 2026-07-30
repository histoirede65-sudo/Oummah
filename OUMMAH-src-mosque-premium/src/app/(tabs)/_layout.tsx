import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs, usePathname } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tadabburController } from '../../core/audio';
import { useI18n, type TranslationKey } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const tabs = [
  {
    labelKey: 'nav.home',
    route: 'index',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    labelKey: 'nav.read',
    route: 'quran',
    icon: 'book-outline',
    activeIcon: 'book',
  },
  {
    labelKey: 'nav.listen',
    route: 'listen',
    href: '/listen/reciters',
    icon: 'headset-outline',
    activeIcon: 'headset',
  },
  {
    labelKey: 'nav.dalil',
    route: 'dalil',
    icon: 'sparkles-outline',
    activeIcon: 'sparkles',
  },
  {
    labelKey: 'nav.profile',
    route: 'profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const pathname = usePathname();

  const tadabburMode = useSyncExternalStore(
    tadabburController.subscribe,
    tadabburController.getSnapshot,
    tadabburController.getSnapshot,
  );

  return (
    <Tabs
      backBehavior="history"
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: { duration: 220 },
        },
        sceneStyle: styles.scene,
        freezeOnBlur: true,
        lazy: false,
      }}
      tabBar={({ state, navigation }) => {
        if (tadabburMode.isActive) return null;

        return (
          <View
            style={[
              styles.tabBar,
              {
                height: 61 + insets.bottom,
                paddingBottom: Math.max(insets.bottom, 5),
              },
            ]}
          >
            {tabs.map((tab, index) => {
              const active = tab.route === 'listen'
                ? pathname.startsWith('/listen')
                : state.routes[state.index]?.name === tab.route;

              const center = index === 2;

              return (
                <Pressable
                  key={tab.route}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: active,
                  }}
                  onPress={() => {
                    if ('href' in tab) router.push(tab.href as never);
                    else navigation.navigate(tab.route as never);
                  }}
                  style={({ pressed }) => [
                    styles.tab,
                    center && styles.centerTab,
                    pressed && styles.pressed,
                  ]}
                >
                  {center ? (
                    <LinearGradient
                      colors={['#7B2C91', '#311447']}
                      style={styles.centerButton}
                    >
                      <Ionicons
                        name={
                          active
                            ? tab.activeIcon
                            : tab.icon
                        }
                        size={29}
                        color={colors.text}
                      />
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.iconWrap,
                        active &&
                          styles.iconActive,
                      ]}
                    >
                      <Ionicons
                        name={
                          active
                            ? tab.activeIcon
                            : tab.icon
                        }
                        size={20}
                        color={
                          active
                            ? colors.primaryLight
                            : colors.textMuted
                        }
                      />
                    </View>
                  )}

                  <Text
                    style={[
                      styles.label,
                      active &&
                        styles.labelActive,
                      center &&
                        styles.centerLabel,
                    ]}
                  >
                    {t(
                      tab.labelKey as TranslationKey,
                    )}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.home') }}
      />

      <Tabs.Screen
        name="quran"
        options={{ title: t('nav.read') }}
      />

      <Tabs.Screen
        name="dalil"
        options={{ title: t('nav.dalil') }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: t('nav.profile') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: colors.background,
  },

  tabBar: {
    paddingHorizontal: 6,
    paddingTop: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor:
      colors.backgroundSecondary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 10,
  },

  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },

  centerTab: {
    top: -18,
  },

  iconWrap: {
    width: 39,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },

  iconActive: {
    backgroundColor:
      'rgba(90,43,115,0.28)',
  },

  centerButton: {
    width: 59,
    height: 59,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    borderWidth: 2.2,
    borderColor: colors.goldLight,
    shadowColor: colors.gold,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 15,
  },

  label: {
    width: '100%',
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
    textAlign: 'center',
  },

  labelActive: {
    color: colors.primaryLight,
  },

  centerLabel: {
    marginTop: 1,
    color: colors.text,
  },

  pressed: {
    opacity: 0.6,
  },
});
