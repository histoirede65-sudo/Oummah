import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs, usePathname } from 'expo-router';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
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
    label: 'Scan',
    route: 'community',
    href: '/boycott',
    icon: 'qr-code-outline',
    activeIcon: 'qr-code',
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
  const listenMotion = useRef(new Animated.Value(0)).current;
  const isListeningRoute = pathname.startsWith('/listen');

  useEffect(() => {
    if (!isListeningRoute) {
      listenMotion.stopAnimation();
      listenMotion.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(listenMotion, {
          toValue: 1,
          duration: 1250,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(listenMotion, {
          toValue: 0,
          duration: 1250,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [isListeningRoute, listenMotion]);

  const listenAnimatedStyle = {
    transform: [
      {
        translateY: listenMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
      {
        scale: listenMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.045],
        }),
      },
    ],
  };

  const tadabburMode = useSyncExternalStore(
    tadabburController.subscribe,
    tadabburController.getSnapshot,
    tadabburController.getSnapshot,
  );

  return (
    <Tabs
      backBehavior="history"
      detachInactiveScreens
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: { duration: 220 },
        },
        sceneStyle: styles.scene,
        freezeOnBlur: true,
        lazy: true,
      }}
      tabBar={({ state, navigation }) => {
        if (tadabburMode.isActive) {
          return null;
        }

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
              const active =
                'href' in tab
                  ? pathname.startsWith(tab.href)
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
                    if ('href' in tab) {
                      router.push(tab.href as never);
                      return;
                    }

                    navigation.navigate(tab.route as never);
                  }}
                  style={({ pressed }) => [
                    styles.tab,
                    center && styles.centerTab,
                    pressed && styles.pressed,
                  ]}
                >
                  {center ? (
                    <Animated.View
                      style={[styles.centerMotion, listenAnimatedStyle]}
                    >
                      <View pointerEvents="none" style={styles.centerHalo} />
                      <LinearGradient
                        colors={['#3A2D52', '#1F1733', '#110C1E']}
                        locations={[0, 0.46, 1]}
                        style={styles.centerButton}
                      >
                        <View pointerEvents="none" style={styles.centerHighlight} />
                        <Ionicons
                          name={active ? tab.activeIcon : tab.icon}
                          size={30}
                          color={colors.goldLight}
                          style={styles.centerIcon}
                        />
                      </LinearGradient>
                    </Animated.View>
                  ) : (
                    <View
                      style={[
                        styles.iconWrap,
                        active && styles.iconActive,
                      ]}
                    >
                      <Ionicons
                        name={active ? tab.activeIcon : tab.icon}
                        size={20}
                        color={active ? colors.primaryLight : colors.textMuted}
                      />
                    </View>
                  )}

                  <Text
                    style={[
                      styles.label,
                      active && styles.labelActive,
                      center && styles.centerLabel,
                    ]}
                  >
                    {center
                      ? 'Écouter'
                      : 'label' in tab
                        ? tab.label
                        : t(tab.labelKey as TranslationKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.home') }} />

      <Tabs.Screen name="quran" options={{ title: t('nav.read') }} />

      <Tabs.Screen name="dalil" options={{ title: t('nav.dalil') }} />

      <Tabs.Screen name="community" options={{ title: t('nav.qibla') }} />

      <Tabs.Screen name="profile" options={{ title: t('nav.profile') }} />
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(8,13,22,0.98)',
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
    backgroundColor: 'rgba(227,181,90,0.13)',
  },

  centerMotion: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerHalo: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(227,181,90,0.08)',
    shadowColor: '#E3B55A',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },

  centerButton: {
    width: 61,
    height: 61,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 31,
    borderWidth: 2.2,
    borderColor: '#F3C86A',
    shadowColor: '#F0B84C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 14,
  },

  centerHighlight: {
    position: 'absolute',
    top: 3,
    right: 8,
    left: 8,
    height: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  centerIcon: {
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
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
    color: '#FFF7EC',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  pressed: {
    opacity: 0.6,
  },
});
