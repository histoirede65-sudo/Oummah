import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import { normalizeDegrees, shortestAngle } from "./qiblaMath";

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

const initialState: CompassState = {
  location: null,
  heading: null,
  rawHeading: null,
  headingAccuracy: null,
  loading: true,
  permissionDenied: false,
  error: null,
};

function circularLerp(from: number, to: number, factor: number) {
  return normalizeDegrees(from + shortestAngle(to - from) * factor);
}

function smoothingFactor(delta: number, accuracy: number | null) {
  const absolute = Math.abs(delta);
  if (absolute >= 35) return 0.58;
  if (absolute >= 16) return 0.38;
  if (absolute >= 6) return 0.24;
  if (accuracy !== null && accuracy <= 1) return 0.1;
  return 0.16;
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
  const smoothHeadingRef = useRef<number | null>(null);

  const restart = useCallback(() => {
    smoothHeadingRef.current = null;
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    let positionSubscription: Location.LocationSubscription | null = null;
    let headingSubscription: Location.LocationSubscription | null = null;
    const stillCurrent = () => !cancelled;

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
        "Position actuelle";
      setState((current) => ({
        ...current,
        location: current.location
          ? { ...current.location, city }
          : current.location,
      }));
    }

    async function start() {
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

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
        requiredAccuracy: 2000,
      }).catch(() => null);

      if (lastKnown && stillCurrent()) {
        const location: QiblaLocation = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
          accuracy: lastKnown.coords.accuracy,
          city: "Position actuelle",
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
          city: "Position actuelle",
        };
        setState((previous) => ({
          ...previous,
          location,
          loading: false,
          error: null,
        }));
        void updateCity(location.latitude, location.longitude);
      } else if (!lastKnown) {
        setState((previous) => ({
          ...previous,
          loading: false,
          error:
            "Impossible d’obtenir votre position. Activez le GPS puis réessayez.",
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
              city: previous.location?.city ?? "Position actuelle",
            },
          }));
        },
      );

      headingSubscription = await Location.watchHeadingAsync((sample) => {
        if (!stillCurrent()) return;
        const candidate =
          sample.trueHeading >= 0 ? sample.trueHeading : sample.magHeading;
        if (!Number.isFinite(candidate)) return;

        const normalized = normalizeDegrees(candidate);
        const previous = smoothHeadingRef.current;
        const next =
          previous === null
            ? normalized
            : circularLerp(
                previous,
                normalized,
                smoothingFactor(shortestAngle(normalized - previous), sample.accuracy),
              );

        // Ignore sub-degree magnetic noise once the display has stabilised.
        if (
          previous !== null &&
          Math.abs(shortestAngle(next - previous)) < 0.08
        ) {
          return;
        }

        smoothHeadingRef.current = next;
        setState((currentState) => ({
          ...currentState,
          heading: next,
          rawHeading: normalized,
          headingAccuracy: sample.accuracy,
          loading: currentState.location === null,
        }));
      });
    }

    void start().catch(() => {
      if (!stillCurrent()) return;
      setState((current) => ({
        ...current,
        loading: false,
        error:
          "La boussole n’a pas pu démarrer. Fermez les applications utilisant le GPS puis réessayez.",
      }));
    });

    return () => {
      cancelled = true;
      positionSubscription?.remove();
      headingSubscription?.remove();
    };
  }, [revision]);

  return {
    ...state,
    sensorQuality: getQiblaSensorQuality(state.headingAccuracy),
    restart,
  };
}
