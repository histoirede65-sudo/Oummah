import * as Location from 'expo-location';
import { getMainMosque } from '../mosques/data/mosquePreferences';
import { applyApprovedMosquePrayerTimes, getApprovedMosquePrayerTimes } from '../mosques/data/mosquePrayerUpdates';
import {
  getMosquePrayerSchedule,
  loadPrayerCalculationSettings,
  type MosquePrayerSchedule,
} from '../mosques/data/mosquePrayerTimes';

/**
 * Same prayer times as the rest of OUMMAH (main mosque, or the phone's position; user's calculation
 * settings; validated mosque times). No second prayer-time engine.
 */
export async function loadTahajjudSchedule(days = 2): Promise<MosquePrayerSchedule> {
  const [mosque, settings] = await Promise.all([getMainMosque(), loadPrayerCalculationSettings()]);
  let latitude = mosque?.latitude;
  let longitude = mosque?.longitude;
  if (latitude == null || longitude == null) {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) throw new Error('LOCATION_REQUIRED');
    const position = (await Location.getLastKnownPositionAsync())
      ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
  }
  const schedule = await getMosquePrayerSchedule(latitude, longitude, undefined, settings, days);
  if (settings.scheduleSource !== 'mosque' || !mosque) return schedule;
  const approved = await getApprovedMosquePrayerTimes(mosque.id).catch(() => null);
  return applyApprovedMosquePrayerTimes(schedule, approved);
}
