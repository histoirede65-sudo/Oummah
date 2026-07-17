/* eslint-disable import/no-duplicates */
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
