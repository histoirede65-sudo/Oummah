import { translate } from '../../i18n';
import * as Location from "expo-location";
import { DeviceMotion } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { normalizeDegrees, shortestAngle } from "./qiblaMath";
import { readCachedQiblaLocation, saveCachedQiblaLocation } from "./qiblaPreferences";

export type QiblaSensorQuality = "excellent" | "medium" | "low";

export type QiblaLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  city: string;
};

type CompassState = {
  location: QiblaLocation | null;
  heading: number | null;
  rawHeading: number | null;
  headingAccuracy: number | null;
  loading: boolean;
  permissionDenied: boolean;
  error: string | null;
};

// The text under the compass (degrees left, turn left/right) is refreshed at
// this pace; the needle itself follows every sample on the UI thread.
const TEXT_REFRESH_MS = 120;
const MOTION_INTERVAL_MS = 20;

const initialState: CompassState = {
  location: null,
  heading: null,
  rawHeading: null,
  headingAccuracy: null,
  loading: true,
  permissionDenied: false,
  error: null,
};

/**
 * Android: heading from the fused rotation vector (gyroscope + accelerometer +
 * magnetometer) instead of Expo Location's raw magnetometer reading, which is
 * sampled ~5 times per second, only reports 2° steps and goes wrong as soon as
 * the phone is tilted. The direction used is the top edge of the phone plus
 * its back, projected on the horizon: it stays right whether the phone is
 * held flat, tilted or upright. Expo gives alpha = -azimuth, beta = -pitch,
 * gamma = roll of Android's getOrientation, in radians.
 */
function headingFromRotation(alpha: number, beta: number, gamma: number) {
  const s = Math.sin(alpha);
  const c = Math.cos(alpha);
  const sb = Math.sin(beta);
  const cb = Math.cos(beta);
  const sg = Math.sin(gamma);
  const cg = Math.cos(gamma);
  const east = -s * cb - c * sg - s * sb * cg;
  const north = c * cb - s * sg + c * sb * cg;
  if (Math.abs(east) + Math.abs(north) < 1e-6) return null;
  return normalizeDegrees((Math.atan2(east, north) * 180) / Math.PI);
}

export function getQiblaSensorQuality(
  accuracy: number | null,
): QiblaSensorQuality {
  if (accuracy === null) return "low";
  if (accuracy >= 3) return "excellent";
  if (accuracy >= 2) return "medium";
  return "low";
}

export function useQiblaCompass() {
  const [state, setState] = useState<CompassState>(initialState);
  const [revision, setRevision] = useState(0);
  // Latest heading, unwrapped (no jump from 359° to 0°), read by the needle on
  // the UI thread. NaN until the first sample.
  const headingValue = useSharedValue(Number.NaN);
  const lastTextUpdateRef = useRef(0);

  const restart = useCallback(() => {
    headingValue.set(Number.NaN);
    lastTextUpdateRef.current = 0;
    setRevision((value) => value + 1);
    setState((current) => ({
      ...current,
      heading: null,
      rawHeading: null,
      headingAccuracy: null,
      loading: true,
      permissionDenied: false,
      error: null,
    }));
  }, [headingValue]);

  useEffect(() => {
    let cancelled = false;
    let positionSubscription: Location.LocationSubscription | null = null;
    let headingSubscription: Location.LocationSubscription | null = null;
    let motionSubscription: { remove(): void } | null = null;
    const stillCurrent = () => !cancelled;
    // True north = magnetic north + declination; Expo Location knows the
    // declination once it has a position (trueHeading - magHeading).
    let declination = 0;
    let accuracy: number | null = null;

    const publishHeading = (heading: number) => {
      const previous = headingValue.get();
      headingValue.set(
        Number.isNaN(previous) ? heading : previous + shortestAngle(heading - normalizeDegrees(previous)),
      );
      const now = Date.now();
      if (now - lastTextUpdateRef.current < TEXT_REFRESH_MS) return;
      lastTextUpdateRef.current = now;
      setState((currentState) => ({
        ...currentState,
        heading,
        rawHeading: heading,
        headingAccuracy: accuracy,
        loading: currentState.location === null,
      }));
    };

    async function updateCity(latitude: number, longitude: number) {
      const places = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      }).catch(() => []);
      if (!stillCurrent()) return;
      const first = places[0];
      const city =
        first?.city ||
        first?.district ||
        first?.subregion ||
        first?.region ||
        translate("qibla.currentPosition");
      setState((current) => ({
        ...current,
        location: current.location
          ? { ...current.location, city }
          : current.location,
      }));
    }

    async function start() {
      const cached = await readCachedQiblaLocation().catch(() => null);
      if (cached && stillCurrent()) {
        setState((current) => ({
          ...current,
          location: {
            latitude: cached.latitude,
            longitude: cached.longitude,
            accuracy: cached.accuracy,
            city: translate("qibla.lastKnownPosition"),
          },
          loading: false,
        }));
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!stillCurrent()) return;

      if (permission.status !== "granted") {
        setState((current) => ({
          ...current,
          loading: false,
          permissionDenied: true,
          error: null,
        }));
        return;
      }

      // Start the compass immediately. Acquiring a fresh high-accuracy GPS
      // position can take several seconds on some devices and must not block
      // the first heading updates.
      const useRotationVector =
        Platform.OS === "android" &&
        (await DeviceMotion.isAvailableAsync().catch(() => false));
      if (!stillCurrent()) return;

      // iOS headings are already fused and tilt-compensated by Core Location.
      // On Android this subscription only provides calibration and declination.
      headingSubscription = await Location.watchHeadingAsync((sample) => {
        if (!stillCurrent()) return;
        accuracy = sample.accuracy;
        if (sample.trueHeading >= 0 && Number.isFinite(sample.magHeading)) {
          declination = shortestAngle(sample.trueHeading - sample.magHeading);
        }
        if (useRotationVector) return;
        const candidate =
          sample.trueHeading >= 0 ? sample.trueHeading : sample.magHeading;
        if (!Number.isFinite(candidate)) return;
        publishHeading(normalizeDegrees(candidate));
      });

      if (useRotationVector) {
        DeviceMotion.setUpdateInterval(MOTION_INTERVAL_MS);
        motionSubscription = DeviceMotion.addListener((motion) => {
          if (!stillCurrent() || !motion.rotation) return;
          const { alpha, beta, gamma } = motion.rotation;
          const magnetic = headingFromRotation(alpha, beta, gamma);
          if (magnetic === null) return;
          publishHeading(normalizeDegrees(magnetic + declination));
        });
      }

      const lastKnown = await Location.getLastKnownPositionAsync({ requiredAccuracy: 2000 }).catch(() => null);

      if (lastKnown && stillCurrent()) {
        const location: QiblaLocation = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          accuracy: lastKnown.coords.accuracy,
          city: translate("qibla.currentPosition"),
        };
        setState((current) => ({ ...current, location }));
        void updateCity(location.latitude, location.longitude);
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }).catch(() => null);

      if (!stillCurrent()) return;

      if (current) {
        const location: QiblaLocation = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          accuracy: current.coords.accuracy,
          city: translate("qibla.currentPosition"),
        };
        setState((previous) => ({
          ...previous,
          location,
          loading: false,
          error: null,
        }));
        void saveCachedQiblaLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          updatedAt: new Date().toISOString(),
        }).catch(() => undefined);
        void updateCity(location.latitude, location.longitude);
      } else if (!lastKnown) {
        setState((previous) => ({
          ...previous,
          loading: false,
          error:
            translate("qibla.positionError"),
        }));
      } else {
        setState((previous) => ({ ...previous, loading: false }));
      }

      positionSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 500,
          timeInterval: 20_000,
        },
        (next) => {
          if (!stillCurrent()) return;
          setState((previous) => ({
            ...previous,
            location: {
              latitude: next.coords.latitude,
              longitude: next.coords.longitude,
              accuracy: next.coords.accuracy,
              city: previous.location?.city ?? translate("qibla.currentPosition"),
            },
          }));
          void saveCachedQiblaLocation({
            latitude: next.coords.latitude,
            longitude: next.coords.longitude,
            accuracy: next.coords.accuracy,
            updatedAt: new Date().toISOString(),
          }).catch(() => undefined);
        },
      );

    }

    void start().catch(() => {
      if (!stillCurrent()) return;
      setState((current) => ({
        ...current,
        loading: false,
        error:
          translate("qibla.compassError"),
      }));
    });

    return () => {
      cancelled = true;
      positionSubscription?.remove();
      headingSubscription?.remove();
      motionSubscription?.remove();
    };
  }, [headingValue, revision]);

  return {
    ...state,
    headingValue,
    sensorQuality: getQiblaSensorQuality(state.headingAccuracy),
    restart,
  };
}
