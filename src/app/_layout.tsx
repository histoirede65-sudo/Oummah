/* eslint-disable import/no-duplicates */
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Alert, Animated, AppState, Easing, Image, InteractionManager, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AudioPlayerProvider } from '../context/AudioPlayerProvider';
import { ReciterProvider } from '../context/ReciterProvider';
import MiniPlayer from '../features/audio/presentation/MiniPlayer';
import { ProphetAudioProvider } from '../features/prophets/audio/ProphetAudioProvider';
import ProphetAudioMiniPlayer from '../features/prophets/audio/ProphetAudioMiniPlayer';
import { I18nProvider } from '../i18n/I18nProvider';
import { syncPushRegistration } from '../features/notifications/PushRegistrationService';
import { isNotificationPermissionGranted } from '../features/notifications/NotificationPermissions';
import { loadNotificationCenterPreferences, notificationResponseReadId, requestNotificationCenterPermission, saveNotificationCenterPreferences, saveReadNotificationIds, syncNotificationCenterSchedule, verseOfDayRoute } from '../features/notifications/NotificationCenter';
import { syncJumuahNotification } from '../features/jumuah/JumuahService';
import AnalyticsRouteTracker from '../features/analytics/AnalyticsRouteTracker';
import FirstVisitGuideHost from '../components/FirstVisitGuideHost';
import GoalCelebrationHost from '../features/daily-goals/presentation/GoalCelebrationHost';
import PrayerValidationCelebrationHost from '../features/prayers/presentation/PrayerValidationCelebrationHost';
import { trackAnalyticsEvent } from '../features/analytics/AnalyticsService';
import { STOP_ADHAN_ACTION } from '../features/adhan/AdhanNotifications';
import { loadHifzState } from '../features/hifz/HifzStore';
import { getMainMosque } from '../features/mosques/data/mosquePreferences';
import { getMosquePrayerSchedule, loadPrayerCalculationSettings, type MosquePrayerSchedule } from '../features/mosques/data/mosquePrayerTimes';
import { applyApprovedMosquePrayerTimes, getApprovedMosquePrayerTimes } from '../features/mosques/data/mosquePrayerUpdates';
import cormorantRegular from '../../assets/fonts/CormorantGaramond-Regular.ttf';
import cormorantMedium from '../../assets/fonts/CormorantGaramond-Medium.ttf';
import cormorantSemibold from '../../assets/fonts/CormorantGaramond-SemiBold.ttf';
import uthmanicHafs from '../../assets/fonts/quran/UthmanicHafs1Ver18.ttf';


const REVIEW_LAUNCH_COUNT_KEY = '@oummah/review/launch-count-v1';
const REVIEW_NEXT_PROMPT_KEY = '@oummah/review/next-prompt-v1';
const REVIEW_COMPLETED_KEY = '@oummah/review/completed-v1';
const NOTIFICATION_PERMISSION_REPAIR_KEY = '@oummah/notifications/permission-repair-v1';
const FIRST_REVIEW_PROMPT_AT = 3;
const REVIEW_REMIND_LATER_AFTER = 10;

async function openOummahStoreReview() {
  const primaryUrl =
    Platform.OS === 'ios'
      ? 'itms-apps://itunes.apple.com/app/id6797700838?action=write-review'
      : 'market://details?id=com.oummah.app';
  const fallbackUrl =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/fr/app/oummah/id6797700838?action=write-review'
      : 'https://play.google.com/store/apps/details?id=com.oummah.app';

  try {
    if (await Linking.canOpenURL(primaryUrl)) {
      await Linking.openURL(primaryUrl);
      return;
    }
  } catch {
    // Use the web store URL below.
  }

  await Linking.openURL(fallbackUrl).catch(() => undefined);
}

function AppLaunchAnimation({
  appReady,
  onFinished,
}: {
  appReady: boolean;
  onFinished: () => void;
}) {
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const sceneOpacity = useRef(new Animated.Value(0)).current;
  const brandRise = useRef(new Animated.Value(24)).current;
  const brandScale = useRef(new Animated.Value(0.9)).current;
  const wasilOpacity = useRef(new Animated.Value(0)).current;
  const wasilRise = useRef(new Animated.Value(34)).current;
  const wasilScale = useRef(new Animated.Value(0.82)).current;
  const ringProgress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const [introFinished, setIntroFinished] = useState(false);
  const hasStartedExit = useRef(false);

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.timing(sceneOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(brandScale, {
            toValue: 1,
            tension: 52,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(brandRise, {
            toValue: 0,
            duration: 620,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ringProgress, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(420),
        Animated.parallel([
          Animated.timing(wasilOpacity, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(wasilScale, {
            toValue: 1,
            tension: 54,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(wasilRise, {
            toValue: 0,
            duration: 560,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(180),
            Animated.timing(sparkleOpacity, {
              toValue: 1,
              duration: 280,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1050,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1050,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);

    intro.start();
    const timer = setTimeout(() => setIntroFinished(true), 1180);
    return () => {
      clearTimeout(timer);
      intro.stop();
    };
  }, [
    brandRise,
    brandScale,
    pulse,
    ringProgress,
    sceneOpacity,
    sparkleOpacity,
    wasilOpacity,
    wasilRise,
    wasilScale,
  ]);

  useEffect(() => {
    if (!appReady || !introFinished || hasStartedExit.current) return;
    hasStartedExit.current = true;

    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 620,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sceneOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandScale, {
          toValue: 1.07,
          duration: 620,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(wasilRise, {
          toValue: -14,
          duration: 620,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onFinished();
      });
    }, 650);

    return () => clearTimeout(exitTimer);
  }, [
    appReady,
    brandScale,
    introFinished,
    onFinished,
    overlayOpacity,
    sceneOpacity,
    wasilRise,
  ]);

  const ringRotation = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-35deg', '0deg'],
  });

  return (
    <Animated.View
      style={[launchStyles.container, { opacity: overlayOpacity }]}
      pointerEvents="auto"
    >
      <View style={launchStyles.topAura} />
      <View style={launchStyles.bottomAura} />
      <View style={launchStyles.goldMist} />

      <Animated.View style={[launchStyles.scene, { opacity: sceneOpacity }]}> 
        <Animated.View
          style={[
            launchStyles.orbitWrap,
            {
              opacity: ringProgress,
              transform: [
                { rotate: ringRotation },
                {
                  scale: ringProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.72, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              launchStyles.orbitGlow,
              {
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.16, 0.34],
                }),
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1.05],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={launchStyles.orbitOuter} />
          <View style={launchStyles.orbitInner} />
          <View style={[launchStyles.orbitDot, launchStyles.dotTop]} />
          <View style={[launchStyles.orbitDot, launchStyles.dotRight]} />
          <View style={[launchStyles.orbitDot, launchStyles.dotBottom]} />
          <View style={[launchStyles.orbitDot, launchStyles.dotLeft]} />
        </Animated.View>

        <Animated.View
          style={[
            launchStyles.brand,
            {
              transform: [
                { translateY: brandRise },
                { scale: brandScale },
              ],
            },
          ]}
        >
          <Text allowFontScaling={false} style={launchStyles.eyebrow}>BIENVENUE DANS</Text>
          <Text allowFontScaling={false} style={launchStyles.title}>OUMMAH</Text>
          <View style={launchStyles.brandLine} />
          <Text allowFontScaling={false} style={launchStyles.subtitle}>Votre compagnon musulman au quotidien</Text>
        </Animated.View>

        <Animated.View
          style={[
            launchStyles.wasilWrap,
            {
              opacity: wasilOpacity,
              transform: [
                { translateY: wasilRise },
                { scale: wasilScale },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              launchStyles.wasilHalo,
              {
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.42],
                }),
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.92, 1.08],
                    }),
                  },
                ],
              },
            ]}
          />
          <Image
            source={require('../assets/images/home/wasil-idle.png')}
            style={launchStyles.wasilImage}
            resizeMode="contain"
          />
          <Animated.Text
            style={[launchStyles.sparkle, { opacity: sparkleOpacity }]}
          >
            ✦
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [launchVisible, setLaunchVisible] = useState(true);
  const [notificationSettingsRequired, setNotificationSettingsRequired] = useState(false);
  const startupTasksStarted = useRef(false);
  const notificationPermissionRef = useRef<Promise<boolean> | null>(null);
  const waitingForNotificationSettingsRef = useRef(false);

  useEffect(() => {
    // Déclencher la demande au montage, sans attendre les polices, l’intro
    // ou une session connectée. Ne pas redemander après une décision système.
    if (notificationPermissionRef.current) return;
    notificationPermissionRef.current = (async () => {
      if (Platform.OS === 'web') return false;
      const current = await Notifications.getPermissionsAsync();
      if (isNotificationPermissionGranted(current)) {
        const repairDone = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_REPAIR_KEY);
        if (repairDone !== '1') {
          const preferences = await loadNotificationCenterPreferences();
          if (!preferences.systemEnabled) {
            await saveNotificationCenterPreferences({ ...preferences, systemEnabled: true });
          }
          await AsyncStorage.setItem(NOTIFICATION_PERMISSION_REPAIR_KEY, '1');
        }
        return true;
      }
      if (current.status !== 'undetermined' || !current.canAskAgain) {
        setNotificationSettingsRequired(true);
        return false;
      }
      const granted = await requestNotificationCenterPermission('sound');
      if (granted) {
        const preferences = await loadNotificationCenterPreferences();
        await saveNotificationCenterPreferences({ ...preferences, systemEnabled: true });
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_REPAIR_KEY, '1');
      }
      return granted;
    })().catch(() => false);
  }, []);

  useEffect(() => {
    if (launchVisible || !notificationSettingsRequired) return;

    const timer = setTimeout(() => {
      Alert.alert(
        'Notifications désactivées',
        'Autorisez les notifications dans les réglages du téléphone pour recevoir les rappels OUMMAH.',
        [
          { text: 'Plus tard', style: 'cancel' },
          {
            text: 'Ouvrir les réglages',
            onPress: () => {
              waitingForNotificationSettingsRef.current = true;
              void Linking.openSettings().catch(() => undefined);
            },
          },
        ],
      );
      setNotificationSettingsRequired(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [launchVisible, notificationSettingsRequired]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !waitingForNotificationSettingsRef.current) return;
      waitingForNotificationSettingsRef.current = false;

      void Notifications.getPermissionsAsync()
        .then(async (permission) => {
          if (!isNotificationPermissionGranted(permission)) return;
          const preferences = await loadNotificationCenterPreferences();
          await saveNotificationCenterPreferences({ ...preferences, systemEnabled: true });
          await AsyncStorage.setItem(NOTIFICATION_PERMISSION_REPAIR_KEY, '1');
          await syncJumuahNotification().catch(() => false);
          await syncPushRegistration().catch(() => undefined);

          const [hifzState, mosque, calculation] = await Promise.all([
            loadHifzState(),
            getMainMosque(),
            loadPrayerCalculationSettings(),
          ]);
          let schedule: MosquePrayerSchedule | null = null;
          if (mosque) {
            const calculated = await getMosquePrayerSchedule(
              mosque.latitude,
              mosque.longitude,
              undefined,
              calculation,
            ).catch(() => null);
            const approved = await getApprovedMosquePrayerTimes(mosque.id).catch(() => null);
            schedule = calculated
              ? calculation.scheduleSource === 'mosque'
                ? applyApprovedMosquePrayerTimes(calculated, approved)
                : calculated
              : null;
          }
          await syncNotificationCenterSchedule(
            { ...preferences, systemEnabled: true },
            schedule,
            mosque?.name,
            hifzState,
          );
        })
        .catch(() => undefined);
    });

    return () => subscription.remove();
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'CormorantGaramond-Regular': cormorantRegular,
    'CormorantGaramond-Medium': cormorantMedium,
    'CormorantGaramond-SemiBold': cormorantSemibold,
    UthmanicHafs: uthmanicHafs,
  });
  const appReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (!appReady || launchVisible || Platform.OS === 'web') return;

    let cancelled = false;
    let promptVisible = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const interactionTask = InteractionManager.runAfterInteractions(() => {
      timers.push(
        setTimeout(() => {
          if (cancelled) return;

          void (async () => {
            const values = await AsyncStorage.multiGet([
              REVIEW_LAUNCH_COUNT_KEY,
              REVIEW_NEXT_PROMPT_KEY,
              REVIEW_COMPLETED_KEY,
            ]);
            if (cancelled) return;

            const stored = Object.fromEntries(values);
            if (stored[REVIEW_COMPLETED_KEY] === '1') return;

            const currentCount = Number.parseInt(stored[REVIEW_LAUNCH_COUNT_KEY] ?? '0', 10);
            const launchCount = (Number.isFinite(currentCount) ? currentCount : 0) + 1;
            await AsyncStorage.setItem(REVIEW_LAUNCH_COUNT_KEY, String(launchCount));
            if (cancelled) return;

            const storedNextPrompt = Number.parseInt(
              stored[REVIEW_NEXT_PROMPT_KEY] ?? String(FIRST_REVIEW_PROMPT_AT),
              10,
            );
            const nextPromptAt = Number.isFinite(storedNextPrompt)
              ? storedNextPrompt
              : FIRST_REVIEW_PROMPT_AT;

            if (launchCount < nextPromptAt) return;

            promptVisible = true;
            const postpone = () => {
              promptVisible = false;
              void AsyncStorage.setItem(
                REVIEW_NEXT_PROMPT_KEY,
                String(launchCount + REVIEW_REMIND_LATER_AFTER),
              );
            };

            Alert.alert(
              'Vous aimez OUMMAH ? ⭐️',
              'Votre avis nous aide énormément à améliorer OUMMAH et à la faire connaître.',
              [
                {
                  text: 'Plus tard',
                  style: 'cancel',
                  onPress: postpone,
                },
                {
                  text: 'Noter OUMMAH',
                  onPress: () => {
                    promptVisible = false;
                    void AsyncStorage.setItem(REVIEW_COMPLETED_KEY, '1');
                    void openOummahStoreReview();
                  },
                },
              ],
              {
                cancelable: true,
                onDismiss: postpone,
              },
            );
          })().catch(() => undefined);
        }, 1200),
      );
    });

    return () => {
      cancelled = true;
      interactionTask.cancel();
      timers.forEach(clearTimeout);
      if (promptVisible) promptVisible = false;
    };
  }, [appReady, launchVisible]);

  useEffect(() => {
    // Les tâches ci-dessous sont utiles, mais aucune n'est nécessaire pour afficher
    // le premier écran. On attend donc que l'intro soit terminée et que les
    // interactions initiales soient passées, pour éviter le pic CPU / stockage /
    // réseau au moment précis où l'accueil apparaît.
    if (!appReady || launchVisible || startupTasksStarted.current) return;

    startupTasksStarted.current = true;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const permissionReady = notificationPermissionRef.current ?? Promise.resolve(false);

    const interactionTask = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;

      // Analytics : léger, mais non bloquant pour le premier rendu.
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          void trackAnalyticsEvent({
            eventName: 'app_open',
            module: 'home',
            route: '/',
          });
        }, 150),
      );

      // Joumou'a : rappel global hebdomadaire, indépendant d'une mosquée
      // ou des préférences du centre. Il reste soumis à l'autorisation système.
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          void permissionReady
            .then((granted) => {
              if (cancelled || !granted) return false;
              return syncJumuahNotification();
            })
            .catch(() => false);
        }, 700),
      );

      // Push : permissions/token/session/réseau, donc légèrement après l'accueil.
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          void permissionReady
            .then((granted) => {
              if (cancelled || !granted) return;
              return syncPushRegistration();
            })
            .then((result) => {
              if (__DEV__) console.info("[PushDiagnostic] résultat syncPushRegistration", result);
            })
            .catch((error) => {
              if (__DEV__) console.warn("[PushDiagnostic] syncPushRegistration a échoué", error);
            });
        }, 900),
      );

      // Centre de notifications : le plus coûteux (stockage + calculs + éventuelle
      // reprogrammation). On le décale davantage, sans changer sa logique.
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          void permissionReady.then(() => Promise.all([
            loadNotificationCenterPreferences(),
            loadHifzState(),
            getMainMosque(),
            loadPrayerCalculationSettings(),
          ]))
            .then(async ([preferences, hifzState, mosque, calculation]) => {
              if (cancelled || !preferences.systemEnabled) return;

              let schedule: MosquePrayerSchedule | null = null;
              if (mosque) {
                const calculated = await getMosquePrayerSchedule(
                  mosque.latitude,
                  mosque.longitude,
                  undefined,
                  calculation,
                ).catch(() => null);
                const approved = await getApprovedMosquePrayerTimes(mosque.id).catch(() => null);
                schedule = calculated
                  ? calculation.scheduleSource === 'mosque'
                    ? applyApprovedMosquePrayerTimes(calculated, approved)
                    : calculated
                  : null;
              }

              if (cancelled) return;
              return syncNotificationCenterSchedule(
                preferences,
                schedule,
                mosque?.name,
                hifzState,
              );
            })
            .catch(() => undefined);
        }, 1600),
      );
    });

    return () => {
      cancelled = true;
      interactionTask.cancel();
      timers.forEach(clearTimeout);
    };
  }, [appReady, launchVisible]);

  useEffect(() => {
    if (!appReady) return;

    const openNotificationRoute = async (
      response: Notifications.NotificationResponse | null,
    ) => {
      if (!response) return;
      const data = response.notification.request.content.data;
      const readId = notificationResponseReadId(response.notification);
      if (readId) {
        // A storage error must not prevent the notification from opening its page.
        await saveReadNotificationIds([readId]).catch(() => undefined);
      }
      const isAdhanNotification = data?.notificationOwner === 'oummah-adhan';
      if (isAdhanNotification && response) {
        await Notifications.dismissNotificationAsync(
          response.notification.request.identifier,
        ).catch(() => undefined);
        if (response.actionIdentifier === STOP_ADHAN_ACTION) return;
      }
      const route = data?.route;
      const rawLatitude = data?.mosqueLatitude;
      const rawLongitude = data?.mosqueLongitude;
      const hasLatitude =
        (typeof rawLatitude === 'number' || typeof rawLatitude === 'string') &&
        String(rawLatitude).trim() !== '';
      const hasLongitude =
        (typeof rawLongitude === 'number' || typeof rawLongitude === 'string') &&
        String(rawLongitude).trim() !== '';
      const latitude = hasLatitude ? Number(rawLatitude) : Number.NaN;
      const longitude = hasLongitude ? Number(rawLongitude) : Number.NaN;
      const hasValidCoordinates =
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180;
      const fallbackRoute =
        typeof route === 'string' && route.trim().length > 0 ? route : '/';

      try {
        if (hasValidCoordinates) {
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          if (await Linking.canOpenURL(mapsUrl)) {
            await Linking.openURL(mapsUrl);
            return;
          }
        }
      } catch {
        // Fall back to the notification route below.
      }

      if (fallbackRoute === "/hadiths?open=daily") {
        router.push({ pathname: "/hadiths", params: { open: "daily" } });
        return;
      }
      if (fallbackRoute === "/verse-of-day") {
        router.push(verseOfDayRoute() as never);
        return;
      }
      router.push(fallbackRoute as never);
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      void openNotificationRoute(lastResponse).then(() =>
        Notifications.clearLastNotificationResponseAsync(),
      );
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(
      openNotificationRoute,
    );

    return () => subscription.remove();
  }, [appReady]);

  return (
    <GestureHandlerRootView
      style={{ flex: 1 }}
    >
      {appReady ? (
        <SafeAreaProvider>
          <I18nProvider>
            <ReciterProvider>
              <AudioPlayerProvider>
                <ProphetAudioProvider>
                <AnalyticsRouteTracker />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    animationDuration: 250,
                    contentStyle: {
                      backgroundColor: '#071F1D',
                    },
                  }}
                >
                  <Stack.Screen
                    name="listen/reciters"
                    options={{ animation: "none", contentStyle: { backgroundColor: "#071F1D" } }}
                  />
                  <Stack.Screen
                    name="listen/reciter/[reciterId]"
                    options={{ animation: "none", contentStyle: { backgroundColor: "#071F1D" } }}
                  />
                  <Stack.Screen
                    name="listen/[surahId]"
                    options={{ animation: "none", contentStyle: { backgroundColor: "#071F1D" } }}
                  />
                </Stack>
                <MiniPlayer />
                <ProphetAudioMiniPlayer />
                <FirstVisitGuideHost enabled={!launchVisible} />
                <GoalCelebrationHost />
                <PrayerValidationCelebrationHost />
                </ProphetAudioProvider>
              </AudioPlayerProvider>
            </ReciterProvider>
          </I18nProvider>
        </SafeAreaProvider>
      ) : null}

      {launchVisible ? (
        <AppLaunchAnimation
          appReady={appReady}
          onFinished={() => setLaunchVisible(false)}
        />
      ) : null}
    </GestureHandlerRootView>
  );
}

const launchStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05030D',
    overflow: 'hidden',
    zIndex: 9999,
  },
  topAura: {
    position: 'absolute',
    top: -210,
    right: -180,
    width: 470,
    height: 470,
    borderRadius: 235,
    backgroundColor: 'rgba(85, 31, 116, 0.34)',
  },
  bottomAura: {
    position: 'absolute',
    bottom: -260,
    left: -210,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(55, 22, 68, 0.42)',
  },
  goldMist: {
    position: 'absolute',
    top: '38%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(234, 180, 65, 0.035)',
  },
  scene: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  orbitWrap: {
    position: 'absolute',
    top: '50%',
    width: 330,
    height: 330,
    marginTop: -208,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitGlow: {
    position: 'absolute',
    width: 282,
    height: 282,
    borderRadius: 141,
    backgroundColor: '#7B359C',
  },
  orbitOuter: {
    position: 'absolute',
    width: 314,
    height: 314,
    borderRadius: 157,
    borderWidth: 1,
    borderColor: 'rgba(235, 181, 64, 0.22)',
  },
  orbitInner: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: 'rgba(239, 190, 74, 0.70)',
    shadowColor: '#F0BE4B',
    shadowOpacity: 0.42,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  orbitDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#F1C452',
    shadowColor: '#F1C452',
    shadowOpacity: 0.9,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  dotTop: { top: 34, left: 161 },
  dotRight: { right: 34, top: 161 },
  dotBottom: { bottom: 34, left: 161 },
  dotLeft: { left: 34, top: 161 },
  brand: {
    alignItems: 'center',
    marginTop: -70,
    zIndex: 3,
  },
  eyebrow: {
    color: 'rgba(239, 190, 74, 0.88)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 5,
    marginBottom: 5,
  },
  title: {
    color: '#F1C451',
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 52,
    lineHeight: 59,
    letterSpacing: 6.5,
    textShadowColor: 'rgba(239, 190, 74, 0.22)',
    textShadowRadius: 14,
  },
  brandLine: {
    width: 78,
    height: 1,
    marginTop: 7,
    marginBottom: 12,
    backgroundColor: 'rgba(239, 190, 74, 0.72)',
  },
  subtitle: {
    color: 'rgba(239, 234, 244, 0.72)',
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  wasilWrap: {
    position: 'absolute',
    bottom: 58,
    width: 122,
    height: 162,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 4,
  },
  wasilHalo: {
    position: 'absolute',
    bottom: 6,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#71318E',
  },
  wasilImage: {
    width: 116,
    height: 158,
  },
  sparkle: {
    position: 'absolute',
    top: 19,
    right: -5,
    color: '#F4CA58',
    fontSize: 22,
    textShadowColor: '#F4CA58',
    textShadowRadius: 12,
  },
});
