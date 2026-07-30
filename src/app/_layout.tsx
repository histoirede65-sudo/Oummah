/* eslint-disable import/no-duplicates */
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AudioPlayerProvider } from '../context/AudioPlayerProvider';
import { ReciterProvider } from '../context/ReciterProvider';
import MiniPlayer from '../features/audio/presentation/MiniPlayer';
import { I18nProvider } from '../i18n/I18nProvider';
import cormorantRegular from '../../assets/fonts/CormorantGaramond-Regular.ttf';
import cormorantMedium from '../../assets/fonts/CormorantGaramond-Medium.ttf';
import cormorantSemibold from '../../assets/fonts/CormorantGaramond-SemiBold.ttf';
import uthmanicHafs from '../../assets/fonts/quran/UthmanicHafs1Ver18.ttf';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'CormorantGaramond-Regular': cormorantRegular,
    'CormorantGaramond-Medium': cormorantMedium,
    'CormorantGaramond-SemiBold': cormorantSemibold,
    UthmanicHafs: uthmanicHafs,
  });

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
    openNotificationRoute(lastResponse);
    if (lastResponse) {
      void Notifications.clearLastNotificationResponseAsync();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(
      openNotificationRoute,
    );

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded && !fontError) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <ReciterProvider>
            <AudioPlayerProvider>
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
    </GestureHandlerRootView>
  );
}
