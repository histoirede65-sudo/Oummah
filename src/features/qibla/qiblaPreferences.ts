import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_KEY = 'oummah.qibla.tutorial.v1';
const HAPTICS_KEY = 'oummah.qibla.haptics.v1';
const LOCATION_KEY = 'oummah.qibla.last-location.v1';

export type CachedQiblaLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
};

type QiblaPreferences = {
  tutorialSeen: boolean;
  hapticsEnabled: boolean;
};

const defaults: QiblaPreferences = {
  tutorialSeen: false,
  hapticsEnabled: true,
};

export async function readQiblaPreferences(): Promise<QiblaPreferences> {
  const [tutorial, haptics] = await Promise.all([
    AsyncStorage.getItem(TUTORIAL_KEY),
    AsyncStorage.getItem(HAPTICS_KEY),
  ]);

  return {
    tutorialSeen: tutorial === 'true',
    hapticsEnabled: haptics === null ? defaults.hapticsEnabled : haptics === 'true',
  };
}

export async function setQiblaTutorialSeen(value: boolean): Promise<void> {
  await AsyncStorage.setItem(TUTORIAL_KEY, String(value));
}

export async function setQiblaHapticsEnabled(value: boolean): Promise<void> {
  await AsyncStorage.setItem(HAPTICS_KEY, String(value));
}

export async function readCachedQiblaLocation(): Promise<CachedQiblaLocation | null> {
  const raw = await AsyncStorage.getItem(LOCATION_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as CachedQiblaLocation;
    if (!Number.isFinite(value.latitude) || !Number.isFinite(value.longitude)) return null;
    return value;
  } catch {
    return null;
  }
}

export async function saveCachedQiblaLocation(location: CachedQiblaLocation): Promise<void> {
  await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(location));
}
