/* eslint-disable import/no-duplicates */
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Animated, Easing, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AudioPlayerProvider } from '../context/AudioPlayerProvider';
import { ReciterProvider } from '../context/ReciterProvider';
import MiniPlayer from '../features/audio/presentation/MiniPlayer';
import { I18nProvider } from '../i18n/I18nProvider';
import { syncPushRegistration } from '../features/notifications/PushRegistrationService';
import AnalyticsRouteTracker from '../features/analytics/AnalyticsRouteTracker';
import { trackAnalyticsEvent } from '../features/analytics/AnalyticsService';
import cormorantRegular from '../../assets/fonts/CormorantGaramond-Regular.ttf';
import cormorantMedium from '../../assets/fonts/CormorantGaramond-Medium.ttf';
import cormorantSemibold from '../../assets/fonts/CormorantGaramond-SemiBold.ttf';
import uthmanicHafs from '../../assets/fonts/quran/UthmanicHafs1Ver18.ttf';



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
          <Text style={launchStyles.eyebrow}>BIENVENUE DANS</Text>
          <Text style={launchStyles.title}>OUMMAH</Text>
          <View style={launchStyles.brandLine} />
          <Text style={launchStyles.subtitle}>Votre compagnon musulman au quotidien</Text>
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

  const [fontsLoaded, fontError] = useFonts({
    'CormorantGaramond-Regular': cormorantRegular,
    'CormorantGaramond-Medium': cormorantMedium,
    'CormorantGaramond-SemiBold': cormorantSemibold,
    UthmanicHafs: uthmanicHafs,
  });

  useEffect(() => {
    void syncPushRegistration().catch(() => undefined);
    void trackAnalyticsEvent({
      eventName: 'app_open',
      module: 'home',
      route: '/',
    });
  }, []);

  useEffect(() => {
    const openNotificationRoute = async (
      response: Notifications.NotificationResponse | null,
    ) => {
      const data = response?.notification.request.content.data;
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

      router.push(fallbackRoute as never);
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      openNotificationRoute(lastResponse);
      void Notifications.clearLastNotificationResponseAsync();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(
      openNotificationRoute,
    );

    return () => subscription.remove();
  }, []);

  const appReady = fontsLoaded || Boolean(fontError);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {appReady ? (
        <SafeAreaProvider>
          <I18nProvider>
            <ReciterProvider>
              <AudioPlayerProvider>
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
                />
                <MiniPlayer />
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
    ...StyleSheet.absoluteFillObject,
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
