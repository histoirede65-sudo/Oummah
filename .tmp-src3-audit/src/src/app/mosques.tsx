import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getFavoriteMosques,
  getMainMosque,
  setMosqueFavorite,
  type StoredMosque,
} from '../features/mosques/data/mosquePreferences';
import {
  getMosquePrayerSchedule,
  getNextPrayer,
  type MosquePrayerTime,
} from '../features/mosques/data/mosquePrayerTimes';
import {
  getWalkingRoute,
  type MosqueRoute,
} from '../features/mosques/data/mosqueRoute';
import {
  readMosqueSearchCache,
  writeMosqueSearchCache,
} from '../features/mosques/data/mosqueSearchCache';
import {
  getNearbyMosques,
  type NearbyMosque,
} from '../features/mosques/data/nearbyMosques';
import {
  getUserMosques,
  type UserMosque,
} from '../features/mosques/data/userMosques';
import { getMosqueImageSource } from '../features/mosques/data/mosqueImage';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type ExploreMode = 'list' | 'map';

type LocationState = 'idle' | 'loading' | 'ready' | 'denied' | 'error';

type UserCoordinates = {
  latitude: number;
  longitude: number;
};

const MOSQUE_HERO_IMAGE = require('../assets/images/mosques/mosque-hero-premium.jpg');
const MOSQUE_CARD_IMAGES: readonly ImageSourcePropType[] = [
  require('../assets/images/mosques/mosque-neighborhood.jpg'),
  require('../assets/images/mosques/mosque-coastal.jpg'),
  require('../assets/images/mosques/mosque-a-00.jpg'),
  require('../assets/images/mosques/mosque-a-01.jpg'),
  require('../assets/images/mosques/mosque-a-02.jpg'),
  require('../assets/images/mosques/mosque-a-03.jpg'),
  require('../assets/images/mosques/mosque-a-04.jpg'),
  require('../assets/images/mosques/mosque-a-05.jpg'),
  require('../assets/images/mosques/mosque-a-06.jpg'),
  require('../assets/images/mosques/mosque-a-07.jpg'),
  require('../assets/images/mosques/mosque-a-08.jpg'),
  require('../assets/images/mosques/mosque-a-09.jpg'),
  require('../assets/images/mosques/mosque-a-10.jpg'),
  require('../assets/images/mosques/mosque-a-11.jpg'),
  require('../assets/images/mosques/mosque-b-00.jpg'),
  require('../assets/images/mosques/mosque-b-01.jpg'),
  require('../assets/images/mosques/mosque-b-02.jpg'),
  require('../assets/images/mosques/mosque-b-03.jpg'),
  require('../assets/images/mosques/mosque-b-04.jpg'),
  require('../assets/images/mosques/mosque-b-05.jpg'),
  require('../assets/images/mosques/mosque-b-06.jpg'),
  require('../assets/images/mosques/mosque-b-07.jpg'),
  require('../assets/images/mosques/mosque-b-08.jpg'),
  require('../assets/images/mosques/mosque-b-09.jpg'),
  require('../assets/images/mosques/mosque-b-10.jpg'),
  require('../assets/images/mosques/mosque-b-11.jpg'),
  require('../assets/images/mosques/mosque-c-00.jpg'),
  require('../assets/images/mosques/mosque-c-01.jpg'),
  require('../assets/images/mosques/mosque-c-02.jpg'),
  require('../assets/images/mosques/mosque-c-03.jpg'),
  require('../assets/images/mosques/mosque-c-04.jpg'),
  require('../assets/images/mosques/mosque-c-05.jpg'),
  require('../assets/images/mosques/mosque-c-06.jpg'),
  require('../assets/images/mosques/mosque-c-07.jpg'),
  require('../assets/images/mosques/mosque-c-08.jpg'),
  require('../assets/images/mosques/mosque-c-09.jpg'),
  require('../assets/images/mosques/mosque-c-10.jpg'),
  require('../assets/images/mosques/mosque-c-11.jpg'),
  require('../assets/images/mosques/mosque-d-00.jpg'),
  require('../assets/images/mosques/mosque-d-01.jpg'),
  require('../assets/images/mosques/mosque-d-02.jpg'),
  require('../assets/images/mosques/mosque-d-03.jpg'),
  require('../assets/images/mosques/mosque-d-04.jpg'),
  require('../assets/images/mosques/mosque-d-05.jpg'),
  require('../assets/images/mosques/mosque-d-06.jpg'),
  require('../assets/images/mosques/mosque-d-07.jpg'),
  require('../assets/images/mosques/mosque-d-08.jpg'),
  require('../assets/images/mosques/mosque-d-09.jpg'),
  require('../assets/images/mosques/mosque-d-10.jpg'),
  require('../assets/images/mosques/mosque-d-11.jpg'),
];
const MOSQUE_RENDER_BATCH_SIZE = 24;

type DisplayMosque = Omit<
  NearbyMosque,
  'source' | 'serviceTimes' | 'lastCheckedAt'
> & {
  source: 'openstreetmap' | 'islamic_app' | 'google' | 'user';
  serviceTimes?: string | string[];
  lastCheckedAt?: string;
  imageKey?: string;
};

const USER_MOSQUE_IMAGES: Record<string, ImageSourcePropType> = {
  'mosque-a-00': require('../assets/images/mosques/mosque-a-00.jpg'),
  'mosque-a-01': require('../assets/images/mosques/mosque-a-01.jpg'),
  'mosque-a-02': require('../assets/images/mosques/mosque-a-02.jpg'),
  'mosque-a-03': require('../assets/images/mosques/mosque-a-03.jpg'),
  'mosque-a-04': require('../assets/images/mosques/mosque-a-04.jpg'),
  'mosque-a-05': require('../assets/images/mosques/mosque-a-05.jpg'),
  'mosque-a-06': require('../assets/images/mosques/mosque-a-06.jpg'),
  'mosque-a-07': require('../assets/images/mosques/mosque-a-07.jpg'),
  'mosque-a-08': require('../assets/images/mosques/mosque-a-08.jpg'),
  'mosque-a-09': require('../assets/images/mosques/mosque-a-09.jpg'),
  'mosque-a-10': require('../assets/images/mosques/mosque-a-10.jpg'),
  'mosque-a-11': require('../assets/images/mosques/mosque-a-11.jpg'),
  'mosque-b-00': require('../assets/images/mosques/mosque-b-00.jpg'),
  'mosque-b-01': require('../assets/images/mosques/mosque-b-01.jpg'),
  'mosque-b-02': require('../assets/images/mosques/mosque-b-02.jpg'),
  'mosque-b-03': require('../assets/images/mosques/mosque-b-03.jpg'),
  'mosque-b-04': require('../assets/images/mosques/mosque-b-04.jpg'),
  'mosque-b-05': require('../assets/images/mosques/mosque-b-05.jpg'),
  'mosque-b-06': require('../assets/images/mosques/mosque-b-06.jpg'),
  'mosque-b-07': require('../assets/images/mosques/mosque-b-07.jpg'),
  'mosque-b-08': require('../assets/images/mosques/mosque-b-08.jpg'),
  'mosque-b-09': require('../assets/images/mosques/mosque-b-09.jpg'),
  'mosque-b-10': require('../assets/images/mosques/mosque-b-10.jpg'),
  'mosque-b-11': require('../assets/images/mosques/mosque-b-11.jpg'),
  'mosque-coastal': require('../assets/images/mosques/mosque-coastal.jpg'),
  'mosque-neighborhood': require('../assets/images/mosques/mosque-neighborhood.jpg'),
  'mosque-c-00': require('../assets/images/mosques/mosque-c-00.jpg'),
  'mosque-c-01': require('../assets/images/mosques/mosque-c-01.jpg'),
  'mosque-c-02': require('../assets/images/mosques/mosque-c-02.jpg'),
  'mosque-c-03': require('../assets/images/mosques/mosque-c-03.jpg'),
  'mosque-c-04': require('../assets/images/mosques/mosque-c-04.jpg'),
  'mosque-c-05': require('../assets/images/mosques/mosque-c-05.jpg'),
  'mosque-c-06': require('../assets/images/mosques/mosque-c-06.jpg'),
  'mosque-c-07': require('../assets/images/mosques/mosque-c-07.jpg'),
  'mosque-c-08': require('../assets/images/mosques/mosque-c-08.jpg'),
  'mosque-c-09': require('../assets/images/mosques/mosque-c-09.jpg'),
  'mosque-c-10': require('../assets/images/mosques/mosque-c-10.jpg'),
  'mosque-c-11': require('../assets/images/mosques/mosque-c-11.jpg'),
  'mosque-d-00': require('../assets/images/mosques/mosque-d-00.jpg'),
  'mosque-d-01': require('../assets/images/mosques/mosque-d-01.jpg'),
  'mosque-d-02': require('../assets/images/mosques/mosque-d-02.jpg'),
  'mosque-d-03': require('../assets/images/mosques/mosque-d-03.jpg'),
  'mosque-d-04': require('../assets/images/mosques/mosque-d-04.jpg'),
  'mosque-d-05': require('../assets/images/mosques/mosque-d-05.jpg'),
  'mosque-d-06': require('../assets/images/mosques/mosque-d-06.jpg'),
  'mosque-d-07': require('../assets/images/mosques/mosque-d-07.jpg'),
  'mosque-d-08': require('../assets/images/mosques/mosque-d-08.jpg'),
  'mosque-d-09': require('../assets/images/mosques/mosque-d-09.jpg'),
  'mosque-d-10': require('../assets/images/mosques/mosque-d-10.jpg'),
  'mosque-d-11': require('../assets/images/mosques/mosque-d-11.jpg'),
};

const USER_MOSQUE_FALLBACK_IMAGE = USER_MOSQUE_IMAGES['mosque-a-00'];

function distanceBetween(
  first: UserCoordinates,
  second: UserCoordinates,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) return `${Math.max(1, Math.round(distanceMeters))} m`;
  return `${(distanceMeters / 1_000).toFixed(distanceMeters < 10_000 ? 1 : 0)} km`;
}

function formatWalkingTime(distanceMeters: number) {
  return `${Math.max(1, Math.round(distanceMeters / 80))} min à pied`;
}

function normalizeMosqueName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .trim();
}

function namesLookSimilar(first: string, second: string) {
  const left = normalizeMosqueName(first);
  const right = normalizeMosqueName(second);
  return left === right || left.includes(right) || right.includes(left);
}

function userMosqueToDisplay(
  mosque: UserMosque,
  userCoordinates: UserCoordinates | null,
): DisplayMosque {
  const distanceMeters = userCoordinates
    ? distanceBetween(userCoordinates, {
        latitude: mosque.latitude,
        longitude: mosque.longitude,
      })
    : null;

  return {
    id: mosque.id,
    name: mosque.name,
    alternativeName: mosque.alternativeName,
    arabicName: mosque.arabicName,
    address: mosque.address,
    latitude: mosque.latitude,
    longitude: mosque.longitude,
    distanceMeters: distanceMeters ?? 0,
    distanceLabel:
      distanceMeters === null
        ? 'Distance indisponible'
        : formatDistance(distanceMeters),
    walkingTimeLabel:
      distanceMeters === null
        ? '—'
        : formatWalkingTime(distanceMeters),
    phone: mosque.phone,
    email: mosque.email,
    website: mosque.website,
    openingHours: mosque.openingHours,
    operator: mosque.operator,
    denomination: mosque.denomination,
    wheelchair: mosque.wheelchair,
    womenSpace: mosque.womenSpace,
    ablutions: mosque.ablutions,
    parking: mosque.parking,
    toilets: mosque.toilets,
    languages: mosque.languages,
    serviceTimes: mosque.serviceTimes,
    source: 'user',
    imageKey: mosque.imageKey,
  };
}

function getMosqueImage(mosqueId: string) {
  let hash = 2_166_136_261;

  for (const character of mosqueId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  return MOSQUE_CARD_IMAGES[(hash >>> 0) % MOSQUE_CARD_IMAGES.length];
}

const INITIAL_REGION: Region = {
  latitude: 46.603354,
  longitude: 1.888334,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

function getLocationErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.startsWith('OVERPASS_')) {
    return 'Le service de recherche des mosquées est momentanément indisponible.';
  }

  return 'Impossible de récupérer les mosquées autour de vous pour le moment.';
}

function openMosqueDetails(mosque: DisplayMosque) {
  router.push({
    pathname: '/mosque/[id]',
    params: {
      id: mosque.id,
      name: mosque.name,
      address: mosque.address,
      latitude: String(mosque.latitude),
      longitude: String(mosque.longitude),
      distance: mosque.distanceLabel,
      phone: mosque.phone ?? '',
      website: mosque.website ?? '',
      openingHours: mosque.openingHours ?? '',
      alternativeName: mosque.alternativeName ?? '',
      arabicName: mosque.arabicName ?? '',
      email: mosque.email ?? '',
      operator: mosque.operator ?? '',
      denomination: mosque.denomination ?? '',
      wheelchair: mosque.wheelchair ?? 'unknown',
      womenSpace: mosque.womenSpace ?? 'unknown',
      ablutions: mosque.ablutions ?? 'unknown',
      parking: mosque.parking ?? 'unknown',
      toilets: mosque.toilets ?? 'unknown',
      languages: JSON.stringify(mosque.languages ?? []),
       serviceTimes: Array.isArray(mosque.serviceTimes)
         ? JSON.stringify(mosque.serviceTimes)
         : mosque.serviceTimes ?? '',
      source: mosque.source,
      imageKey: mosque.imageKey ?? '',
      sourceUrl: mosque.sourceUrl ?? '',
      lastCheckedAt: mosque.lastCheckedAt,
    },
  } as Href);
}

export default function MosquesScreen() {
  const [mode, setMode] = useState<ExploreMode>('list');
  const [query, setQuery] = useState('');
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [userMosques, setUserMosques] = useState<UserMosque[]>([]);
  const [userCoordinates, setUserCoordinates] =
    useState<UserCoordinates | null>(null);
  const [selectedMosque, setSelectedMosque] = useState<DisplayMosque | null>(
    null,
  );
  const [route, setRoute] = useState<MosqueRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [usingCachedResults, setUsingCachedResults] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [mainMosque, setMainMosqueState] = useState<StoredMosque | null>(null);
  const [mainMosqueNextPrayer, setMainMosqueNextPrayer] =
    useState<MosquePrayerTime | null>(null);
  const [favoriteMosqueIds, setFavoriteMosqueIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [savingFavoriteId, setSavingFavoriteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [renderedMosqueCount, setRenderedMosqueCount] = useState(
    MOSQUE_RENDER_BATCH_SIZE,
  );

  const requestController = useRef<AbortController | null>(null);
  const routeController = useRef<AbortController | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const displayMosques = useMemo<DisplayMosque[]>(() => {
    const userDisplays = userMosques.map((mosque) =>
      userMosqueToDisplay(mosque, userCoordinates),
    );

    const mergedMosques: DisplayMosque[] = [
      ...mosques,
      ...userDisplays.filter(
        (userMosque) =>
          !mosques.some(
            (osmMosque) =>
              distanceBetween(
                {
                  latitude: userMosque.latitude,
                  longitude: userMosque.longitude,
                },
                {
                  latitude: osmMosque.latitude,
                  longitude: osmMosque.longitude,
                },
              ) <= 50 && namesLookSimilar(userMosque.name, osmMosque.name),
          ),
      ),
    ];

    if (!userCoordinates) return mergedMosques;

    return mergedMosques
      .map((mosque) => {
        const distanceMeters = distanceBetween(userCoordinates, {
          latitude: mosque.latitude,
          longitude: mosque.longitude,
        });

        return {
          ...mosque,
          distanceMeters,
          distanceLabel: formatDistance(distanceMeters),
          walkingTimeLabel: formatWalkingTime(distanceMeters),
        };
      })
      .sort((first, second) => first.distanceMeters - second.distanceMeters);
  }, [mosques, userMosques, userCoordinates]);

  const filteredMosques = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr');

    if (!normalized) return displayMosques;

    return displayMosques.filter((mosque) =>
      `${mosque.name} ${mosque.alternativeName ?? ''} ${mosque.arabicName ?? ''} ${mosque.address}`
        .toLocaleLowerCase('fr')
        .includes(normalized),
    );
  }, [displayMosques, query]);

  const renderedMosques = useMemo(
    () => filteredMosques.slice(0, renderedMosqueCount),
    [filteredMosques, renderedMosqueCount],
  );

  useEffect(() => {
    setRenderedMosqueCount(MOSQUE_RENDER_BATCH_SIZE);
  }, [query, displayMosques]);

  const handleContentScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (mode !== 'list' || renderedMosqueCount >= filteredMosques.length) {
      return;
    }

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom < layoutMeasurement.height * 1.5) {
      setRenderedMosqueCount((current) =>
        Math.min(current + MOSQUE_RENDER_BATCH_SIZE, filteredMosques.length),
      );
    }
  };

  const mapRegion = useMemo<Region>(() => {
    if (!userCoordinates) return INITIAL_REGION;

    return {
      latitude: userCoordinates.latitude,
      longitude: userCoordinates.longitude,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [userCoordinates]);

  const centerMapOnUser = () => {
    if (!userCoordinates) return;

    mapRef.current?.animateToRegion(
      {
        latitude: userCoordinates.latitude,
        longitude: userCoordinates.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
      500,
    );
  };

  const fitAllMarkers = () => {
    if (!userCoordinates) return;

    const coordinates = [
      userCoordinates,
      ...filteredMosques.map((mosque) => ({
        latitude: mosque.latitude,
        longitude: mosque.longitude,
      })),
    ];

    if (coordinates.length === 1) {
      centerMapOnUser();
      return;
    }

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 80,
        right: 55,
        bottom: 80,
        left: 55,
      },
      animated: true,
    });
  };

  const selectMosqueOnMap = (mosque: DisplayMosque) => {
    setSelectedMosque(mosque);
    setRoute(null);
    setRouteError('');

    mapRef.current?.animateToRegion(
      {
        latitude: mosque.latitude,
        longitude: mosque.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      450,
    );
  };

  const drawRouteToSelectedMosque = async () => {
    if (!userCoordinates || !selectedMosque || routeLoading) return;

    routeController.current?.abort();

    const controller = new AbortController();
    routeController.current = controller;

    setRouteLoading(true);
    setRouteError('');

    try {
      const nextRoute = await getWalkingRoute(
        userCoordinates,
        {
          latitude: selectedMosque.latitude,
          longitude: selectedMosque.longitude,
        },
        controller.signal,
      );

      setRoute(nextRoute);

      mapRef.current?.fitToCoordinates(nextRoute.coordinates, {
        edgePadding: {
          top: 85,
          right: 55,
          bottom: 185,
          left: 55,
        },
        animated: true,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      setRoute(null);
      setRouteError(
        'Impossible de calculer le trajet dans OUMMAH pour le moment.',
      );
    } finally {
      setRouteLoading(false);
    }
  };

  const clearSelectedMosque = () => {
    routeController.current?.abort();
    setSelectedMosque(null);
    setRoute(null);
    setRouteError('');
    fitAllMarkers();
  };

  const toggleMosqueFavorite = async (
    event: GestureResponderEvent,
    mosque: DisplayMosque,
  ) => {
    event.stopPropagation();

    if (savingFavoriteId) return;

    const wasFavorite = favoriteMosqueIds.has(mosque.id);
    const nextFavorite = !wasFavorite;

    setSavingFavoriteId(mosque.id);
    setFavoriteMosqueIds((current) => {
      const next = new Set(current);

      if (nextFavorite) {
        next.add(mosque.id);
      } else {
        next.delete(mosque.id);
      }

      return next;
    });

    try {
      await setMosqueFavorite(
        {
          id: mosque.id,
          name: mosque.name,
          address: mosque.address,
          latitude: mosque.latitude,
          longitude: mosque.longitude,
          alternativeName: mosque.alternativeName,
          arabicName: mosque.arabicName,
          phone: mosque.phone,
          email: mosque.email,
          website: mosque.website,
          openingHours: mosque.openingHours,
          operator: mosque.operator,
          denomination: mosque.denomination,
          wheelchair: mosque.wheelchair,
          womenSpace: mosque.womenSpace,
          ablutions: mosque.ablutions,
          parking: mosque.parking,
          toilets: mosque.toilets,
          languages: mosque.languages,
          serviceTimes: Array.isArray(mosque.serviceTimes)
            ? mosque.serviceTimes.join(', ')
            : mosque.serviceTimes,
          ...(mosque.source === 'openstreetmap'
            ? { source: mosque.source, sourceUrl: mosque.sourceUrl }
            : {}),
        },
        nextFavorite,
      );
    } catch {
      setFavoriteMosqueIds((current) => {
        const next = new Set(current);

        if (wasFavorite) {
          next.add(mosque.id);
        } else {
          next.delete(mosque.id);
        }

        return next;
      });

      Alert.alert(
        'Favori non enregistré',
        'Impossible de modifier vos mosquées favorites pour le moment.',
      );
    } finally {
      setSavingFavoriteId(null);
    }
  };

  const searchFromCoordinates = async (
    coordinates: UserCoordinates,
    controller: AbortController,
  ) => {
    setUserCoordinates(coordinates);

    const nearbyMosques = await getNearbyMosques(
      coordinates.latitude,
      coordinates.longitude,
      controller.signal,
    );

    setMosques(nearbyMosques);
    setUsingCachedResults(false);
    setLocationState('ready');

    await writeMosqueSearchCache({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      createdAt: Date.now(),
      mosques: nearbyMosques,
    }).catch(() => undefined);

    return nearbyMosques;
  };

  const locateMosques = async (silent = false) => {
    if (locationState === 'loading') return;

    requestController.current?.abort();

    const controller = new AbortController();
    requestController.current = controller;

    setLocationState('loading');
    setErrorMessage('');
    setSelectedMosque(null);
    setRoute(null);
    setRouteError('');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setLocationState('denied');
        setMosques([]);
        setUserCoordinates(null);
        return;
      }

      let position: Location.LocationObject;
      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (currentPositionError) {
        const lastKnownPosition = await Location.getLastKnownPositionAsync({
          maxAge: 5 * 60 * 1000,
          requiredAccuracy: 1_000,
        });
        if (!lastKnownPosition) throw currentPositionError;
        position = lastKnownPosition;
      }

      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const nearbyMosques = await searchFromCoordinates(
        coordinates,
        controller,
      );

      setTimeout(() => {
        if (mode === 'map') {
          const allCoordinates = [
            coordinates,
            ...nearbyMosques.map((mosque) => ({
              latitude: mosque.latitude,
              longitude: mosque.longitude,
            })),
          ];

          mapRef.current?.fitToCoordinates(allCoordinates, {
            edgePadding: {
              top: 80,
              right: 55,
              bottom: 80,
              left: 55,
            },
            animated: true,
          });
        }
      }, 350);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const cache = await readMosqueSearchCache().catch(() => null);

      if (cache) {
        setUserCoordinates({
          latitude: cache.latitude,
          longitude: cache.longitude,
        });
        setMosques(cache.mosques);
        setUsingCachedResults(true);
        setLocationState('ready');
        setErrorMessage(
          'Connexion instable : les derniers résultats enregistrés sont affichés.',
        );
        return;
      }

      setMosques([]);
      setErrorMessage(getLocationErrorMessage(error));
      setLocationState('error');

      if (!silent) {
        Alert.alert('Recherche impossible', getLocationErrorMessage(error));
      }
    }
  };

  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        'Réglages indisponibles',
        'Ouvrez les réglages du téléphone puis autorisez la localisation pour OUMMAH.',
      );
    }
  };

  const selectMode = (nextMode: ExploreMode) => {
    setMode(nextMode);

    if (nextMode === 'map' && userCoordinates && mosques.length > 0) {
      setTimeout(fitAllMarkers, 300);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const prayerController = new AbortController();

      const loadMosquePreferences = async () => {
        const [storedMainMosque, favoriteMosques, storedUserMosques] = await Promise.all([
          getMainMosque().catch(() => null),
          getFavoriteMosques().catch(() => []),
          getUserMosques().catch(() => []),
        ]);

        if (active) {
          setMainMosqueState(storedMainMosque);
          setFavoriteMosqueIds(
            new Set(favoriteMosques.map((mosque) => mosque.id)),
          );
          setUserMosques(storedUserMosques);
          setMainMosqueNextPrayer(null);
        }

        if (!storedMainMosque) return;

        const schedule = await getMosquePrayerSchedule(
          storedMainMosque.latitude,
          storedMainMosque.longitude,
          prayerController.signal,
        ).catch(() => null);

        if (active && schedule) {
          setMainMosqueNextPrayer(getNextPrayer(schedule));
        }
      };

      void loadMosquePreferences();

      return () => {
        active = false;
        prayerController.abort();
      };
    }, []),
  );

  useEffect(() => {
    let active = true;

    const initializeMosques = async () => {
      const cache = await readMosqueSearchCache().catch(() => null);

      if (!active) return;

      if (cache) {
        setMosques(cache.mosques);
        setUserCoordinates({
          latitude: cache.latitude,
          longitude: cache.longitude,
        });
        setUsingCachedResults(true);
        setLocationState('ready');
      }

      let permission: Location.LocationPermissionResponse;

      try {
        permission = await Location.getForegroundPermissionsAsync();
      } catch {
        if (!active) return;

        setInitializing(false);
        setLocationState(cache ? 'ready' : 'error');
        setErrorMessage('La localisation est temporairement indisponible.');
        return;
      }

      if (!active) return;

      setInitializing(false);

      if (permission.granted) void locateMosques(true);
    };

    void initializeMosques();

    return () => {
      active = false;
      requestController.current?.abort();
      routeController.current?.abort();
    };
  }, []);

  const locationButtonLabel =
    locationState === 'loading'
      ? 'Recherche en cours…'
      : locationState === 'ready'
        ? 'Actualiser ma position'
        : 'Utiliser ma position';

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={23} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>AUTOUR DE VOUS</Text>
          <Text style={styles.title}>Mosquées</Text>
        </View>

        <Pressable
          accessibilityLabel="Mes mosquées favorites"
          onPress={() => router.push('/mosque/favorites' as Href)}
          style={styles.headerButton}
        >
          <Ionicons name="heart-outline" size={23} color={colors.goldLight} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={handleContentScroll}
        scrollEventThrottle={100}
      >
        <View style={styles.heroCard}>
          <Image
            source={MOSQUE_HERO_IMAGE}
            resizeMode="cover"
            style={styles.heroImage}
          />
          <LinearGradient
            colors={[
              'rgba(7,5,16,0.03)',
              'rgba(8,5,18,0.16)',
              'rgba(8,5,18,0.74)',
            ]}
            locations={[0, 0.44, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroPhotoLabel}>
            <Ionicons
              name="location-outline"
              size={15}
              color={colors.goldLight}
            />
            <Text style={styles.heroPhotoLabelText}>
              MOSQUÉES AUTOUR DE VOUS
            </Text>
          </View>

          <LinearGradient
            colors={[
              'rgba(82,57,94,0.54)',
              'rgba(38,24,51,0.67)',
              'rgba(13,8,24,0.79)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGlassPanel}
          >
            <View pointerEvents="none" style={styles.heroGlassOrbTop} />
            <View pointerEvents="none" style={styles.heroGlassOrbBottom} />
            <LinearGradient
              pointerEvents="none"
              colors={[
                'rgba(255,255,255,0.18)',
                'rgba(255,255,255,0.035)',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.72, y: 0.9 }}
              style={styles.heroGlassSheen}
            />
            <View pointerEvents="none" style={styles.heroGlassTopLine} />

            <View style={styles.heroHeadingRow}>
              <View style={styles.heroLocationIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.goldLight}
                />
              </View>

              <Text style={styles.heroTitle}>
                Trouvez une mosquée près de vous
              </Text>
            </View>

            <Text style={styles.heroText}>
              OUMMAH utilise votre position pour afficher les mosquées proches
              et calculer leur distance.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={locationState === 'loading'}
              onPress={() => void locateMosques(false)}
              style={({ pressed }) => [
                pressed && styles.pressed,
                locationState === 'loading' && styles.disabledButton,
              ]}
            >
              <LinearGradient
                colors={['#F3D27A', '#D9A846']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.locationButton}
              >
                {locationState === 'loading' ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Ionicons
                    name="navigate"
                    size={19}
                    color={colors.background}
                  />
                )}

                <Text style={styles.locationButtonText}>
                  {locationButtonLabel}
                </Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.privacyPill}>
              <Ionicons name="lock-closed" size={11} color="#C9BFCE" />
              <Text style={styles.privacyText}>
                Votre position n’est ni publiée ni enregistrée.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {locationState === 'denied' ? (
          <View style={styles.messageCard}>
            <Ionicons
              name="location-outline"
              size={26}
              color={colors.goldLight}
            />

            <View style={styles.messageCopy}>
              <Text style={styles.messageTitle}>Localisation refusée</Text>
              <Text style={styles.messageText}>
                Autorisez la localisation dans les réglages pour découvrir les
                mosquées autour de vous.
              </Text>
            </View>

            <Pressable
              onPress={() => void openAppSettings()}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsButtonText}>Réglages</Text>
            </Pressable>
          </View>
        ) : null}

        {errorMessage && locationState === 'ready' ? (
          <View style={styles.cacheWarningCard}>
            <Ionicons
              name="cloud-offline-outline"
              size={21}
              color={colors.goldLight}
            />
            <Text style={styles.cacheWarningText}>{errorMessage}</Text>
          </View>
        ) : null}

        {locationState === 'error' ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={23}
              color={colors.goldLight}
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => {
            if (mainMosque) {
              router.push({
                pathname: '/mosque/[id]',
                params: {
                  id: mainMosque.id,
                  name: mainMosque.name,
                  address: mainMosque.address,
                  latitude: String(mainMosque.latitude),
                  longitude: String(mainMosque.longitude),
                  distance: mainMosque.distanceLabel ?? '',
                  phone: mainMosque.phone ?? '',
                  website: mainMosque.website ?? '',
                  openingHours: mainMosque.openingHours ?? '',
                  source: mainMosque.source ?? '',
                  imageKey: mainMosque.imageKey ?? '',
                },
              } as Href);
              return;
            }

            Alert.alert(
              'Ma mosquée',
              'Ouvrez une fiche puis choisissez « Définir comme ma mosquée ».',
            );
          }}
          style={({ pressed }) => [
            styles.myMosqueCard,
            mainMosque && styles.myMosqueCardActive,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.myMosqueImageWrap}>
            <Image
              source={getMosqueImageSource(mainMosque?.id ?? 'main')}
              resizeMode="cover"
              style={styles.myMosqueImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(8,7,19,0.50)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.myMosqueImageBadge}>
              <Ionicons
                name={mainMosque ? 'home' : 'home-outline'}
                size={14}
                color={colors.background}
              />
            </View>
          </View>

          <View style={styles.myMosqueCopy}>
            <Text style={styles.sectionEyebrow}>MA MOSQUÉE</Text>
            <Text numberOfLines={2} style={styles.myMosqueTitle}>
              {mainMosque
                ? mainMosque.name
                : 'Choisissez votre mosquée principale'}
            </Text>
            <Text numberOfLines={2} style={styles.myMosqueText}>
              {mainMosque
                ? mainMosque.address
                : 'Retrouvez ses horaires et ses événements en un geste.'}
            </Text>

            {mainMosque && mainMosqueNextPrayer ? (
              <View style={styles.nextPrayerRow}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={styles.nextPrayerLabel}>Prochaine prière</Text>
                <View style={styles.nextPrayerDot} />
                <Text style={styles.nextPrayerValue}>
                  {mainMosqueNextPrayer.label} {mainMosqueNextPrayer.time}
                </Text>
              </View>
            ) : null}
          </View>

          <Ionicons name="chevron-forward" size={21} color={colors.goldLight} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter une mosquée"
          onPress={() => router.push('/mosque/add' as Href)}
          style={({ pressed }) => [
            styles.addMosqueButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.addMosqueIcon}>
            <Ionicons name="add" size={21} color={colors.background} />
          </View>
          <View style={styles.addMosqueCopy}>
            <Text style={styles.addMosqueTitle}>Tu ne trouves pas ta mosquée ?</Text>
            <Text style={styles.addMosqueSubtitle}>
              Ajoute-la à la carte
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.goldLight}
          />
        </Pressable>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={21} color={colors.textMuted} />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une mosquée"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            style={styles.searchInput}
          />

          {query ? (
            <Pressable
              accessibilityLabel="Effacer la recherche"
              onPress={() => setQuery('')}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>
              {locationState === 'ready' ? 'Mosquées proches' : 'Explorer'}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {locationState === 'ready'
                ? `${mosques.length} résultat${mosques.length > 1 ? 's' : ''} autour de vous`
                : initializing
                  ? 'Préparation de la recherche…'
                  : 'Activez votre position pour lancer la recherche'}
            </Text>

            {usingCachedResults ? (
              <Text style={styles.cacheStatus}>
                Derniers résultats enregistrés
              </Text>
            ) : null}
          </View>

          <View style={styles.modeSwitch}>
            <Pressable
              accessibilityLabel="Afficher la liste"
              onPress={() => selectMode('list')}
              style={[
                styles.modeButton,
                mode === 'list' && styles.modeButtonActive,
              ]}
            >
              <Ionicons
                name="list-outline"
                size={17}
                color={mode === 'list' ? colors.background : colors.goldLight}
              />

              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'list' && styles.modeButtonTextActive,
                ]}
              >
                Liste
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Afficher la carte"
              onPress={() => selectMode('map')}
              style={[
                styles.modeButton,
                mode === 'map' && styles.modeButtonActive,
              ]}
            >
              <Ionicons
                name="map-outline"
                size={17}
                color={mode === 'map' ? colors.background : colors.goldLight}
              />

              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'map' && styles.modeButtonTextActive,
                ]}
              >
                Carte
              </Text>
            </Pressable>
          </View>
        </View>

        {mode === 'map' ? (
          <View style={styles.mapCard}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              showsUserLocation={Boolean(userCoordinates)}
              showsMyLocationButton={false}
              showsCompass
              showsScale
              toolbarEnabled={false}
            >
              {route ? (
                <Polyline
                  coordinates={route.coordinates}
                  strokeColor="#7b4b92"
                  strokeWidth={6}
                  lineCap="round"
                  lineJoin="round"
                />
              ) : null}

              {filteredMosques.map((mosque) => (
                <Marker
                  key={mosque.id}
                  coordinate={{
                    latitude: mosque.latitude,
                    longitude: mosque.longitude,
                  }}
                  title={mosque.name}
                  description={`${mosque.distanceLabel} • ${mosque.address}`}
                  pinColor={
                    selectedMosque?.id === mosque.id ? '#d9b45f' : '#8a5aa4'
                  }
                  tracksViewChanges={false}
                  onPress={() => selectMosqueOnMap(mosque)}
                  onCalloutPress={() => openMosqueDetails(mosque)}
                />
              ))}
            </MapView>

            {!userCoordinates ? (
              <View style={styles.mapOverlay}>
                <View style={styles.mapOverlayIcon}>
                  <Ionicons
                    name="navigate-outline"
                    size={29}
                    color={colors.goldLight}
                  />
                </View>

                <Text style={styles.mapOverlayTitle}>
                  Activez votre position
                </Text>

                <Text style={styles.mapOverlayText}>
                  La carte affichera votre position et les mosquées autour de
                  vous.
                </Text>

                <Pressable
                  onPress={() => void locateMosques(false)}
                  style={styles.mapOverlayButton}
                >
                  <Text style={styles.mapOverlayButtonText}>
                    Utiliser ma position
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {selectedMosque ? (
              <View style={styles.selectedMosqueCard}>
                <Pressable
                  accessibilityLabel="Fermer la sélection"
                  onPress={clearSelectedMosque}
                  style={styles.selectedMosqueClose}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </Pressable>

                <Text numberOfLines={2} style={styles.selectedMosqueName}>
                  {selectedMosque.name}
                </Text>

                <Text numberOfLines={1} style={styles.selectedMosqueAddress}>
                  {selectedMosque.address}
                </Text>

                <View style={styles.selectedMosqueMeta}>
                  <Text style={styles.selectedMosqueDistance}>
                    {route?.distanceLabel ?? selectedMosque.distanceLabel}
                  </Text>

                  <View style={styles.selectedMosqueDot} />

                  <Text style={styles.selectedMosqueDuration}>
                    {route?.durationLabel ?? selectedMosque.walkingTimeLabel}
                  </Text>
                </View>

                {routeError ? (
                  <Text style={styles.routeErrorText}>{routeError}</Text>
                ) : null}

                <View style={styles.selectedMosqueActions}>
                  <Pressable
                    disabled={routeLoading}
                    onPress={() => void drawRouteToSelectedMosque()}
                    style={({ pressed }) => [
                      styles.routeButton,
                      pressed && styles.pressed,
                      routeLoading && styles.disabledButton,
                    ]}
                  >
                    {routeLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.background}
                      />
                    ) : (
                      <Ionicons
                        name="navigate-outline"
                        size={18}
                        color={colors.background}
                      />
                    )}

                    <Text style={styles.routeButtonText}>
                      {route ? 'Recalculer' : 'Afficher le trajet'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openMosqueDetails(selectedMosque)}
                    style={({ pressed }) => [
                      styles.detailButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.detailButtonText}>Voir la fiche</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {userCoordinates ? (
              <View
                style={[
                  styles.mapControls,
                  selectedMosque && styles.mapControlsRaised,
                ]}
              >
                <Pressable
                  accessibilityLabel="Centrer sur ma position"
                  onPress={centerMapOnUser}
                  style={styles.mapControlButton}
                >
                  <Ionicons name="locate" size={21} color={colors.goldLight} />
                </Pressable>

                <Pressable
                  accessibilityLabel="Afficher toutes les mosquées"
                  onPress={fitAllMarkers}
                  style={styles.mapControlButton}
                >
                  <Ionicons
                    name="scan-outline"
                    size={21}
                    color={colors.goldLight}
                  />
                </Pressable>
              </View>
            ) : null}

            {locationState === 'loading' ? (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="small" color={colors.goldLight} />
                <Text style={styles.mapLoadingText}>
                  Recherche des mosquées…
                </Text>
              </View>
            ) : null}
          </View>
        ) : locationState === 'loading' ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="large" color={colors.goldLight} />

            <Text style={styles.emptyTitle}>Recherche autour de vous</Text>

            <Text style={styles.emptyText}>
              La première recherche peut prendre quelques secondes.
            </Text>
          </View>
        ) : locationState === 'ready' && filteredMosques.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="business-outline"
              size={34}
              color={colors.goldLight}
            />

            <Text style={styles.emptyTitle}>Aucune mosquée trouvée</Text>

            <Text style={styles.emptyText}>
              Effacez la recherche ou actualisez votre position.
            </Text>
          </View>
        ) : filteredMosques.length > 0 ? (
          <View style={styles.list}>
            {renderedMosques.map((mosque) => (
              <Pressable
                key={mosque.id}
                onPress={() =>
                  openMosqueDetails(mosque)
                }
                style={({ pressed }) => [
                  styles.mosqueCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.mosqueImageWrap}>
                  <Image
                    source={
                      getMosqueImageSource(mosque.id, mosque.imageKey)
                    }
                    resizeMode="cover"
                    style={styles.mosqueImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(9,7,19,0.72)']}
                    style={StyleSheet.absoluteFill}
                  />
                </View>

                <View style={styles.mosqueCopy}>
                  <Text numberOfLines={2} style={styles.mosqueName}>
                    {mosque.name}
                  </Text>

                  <Text numberOfLines={2} style={styles.mosqueAddress}>
                    {mosque.address}
                  </Text>

                  <View style={styles.mosqueMetaRow}>
                    <Text style={styles.mosqueDistance}>
                      {mosque.distanceLabel}
                    </Text>

                    <View style={styles.dot} />

                    <Text style={styles.mosqueMeta}>
                      {mosque.walkingTimeLabel}
                    </Text>
                  </View>

                  <View style={styles.tags}>
                    <View style={[styles.tag, styles.availableTag]}>
                      <View style={styles.availableDot} />
                      <Text style={styles.availableTagText}>
                        {mosque.source === 'user'
                          ? 'Ajoutée sur cet appareil'
                          : 'Fiche disponible'}
                      </Text>
                    </View>

                    {mosque.openingHours ? (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>Horaires renseignés</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={styles.mosqueActions}>
                  <Pressable
                    accessibilityLabel={
                      favoriteMosqueIds.has(mosque.id)
                        ? 'Retirer des favoris'
                        : 'Ajouter aux favoris'
                    }
                    disabled={savingFavoriteId !== null}
                    onPress={(event) =>
                      void toggleMosqueFavorite(event, mosque)
                    }
                    style={styles.mosqueFavoriteButton}
                  >
                    {savingFavoriteId === mosque.id ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.goldLight}
                      />
                    ) : (
                      <Ionicons
                        name={
                          favoriteMosqueIds.has(mosque.id)
                            ? 'heart'
                            : 'heart-outline'
                        }
                        size={20}
                        color={colors.goldLight}
                      />
                    )}
                  </Pressable>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.goldLight}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons
              name="navigate-outline"
              size={34}
              color={colors.goldLight}
            />

            <Text style={styles.emptyTitle}>
              Découvrez les mosquées proches
            </Text>

            <Text style={styles.emptyText}>
              Appuyez sur « Utiliser ma position » pour commencer.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080713',
  },
  header: {
    minHeight: 96,
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080713',
  },
  headerButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.18)',
    backgroundColor: 'rgba(31,18,47,0.72)',
  },
  headerCopy: {
    flex: 1,
    marginHorizontal: 13,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 2,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 34,
    lineHeight: 39,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 62,
    alignSelf: 'center',
  },
  heroCard: {
    overflow: 'hidden',
    minHeight: 410,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(236,196,102,0.48)',
    backgroundColor: '#130D20',
    shadowColor: '#000',
    shadowOpacity: 0.42,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 11,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroPhotoLabel: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(236,196,102,0.34)',
    backgroundColor: 'rgba(12,8,22,0.68)',
  },
  heroPhotoLabelText: {
    color: '#F1D385',
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.05,
  },
  heroGlassPanel: {
    position: 'absolute',
    right: 13,
    bottom: 13,
    left: 13,
    overflow: 'hidden',
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,236,209,0.38)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  heroGlassOrbTop: {
    position: 'absolute',
    top: -86,
    right: -46,
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: 'rgba(255,255,255,0.075)',
  },
  heroGlassOrbBottom: {
    position: 'absolute',
    bottom: -104,
    left: 44,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(117,70,139,0.16)',
  },
  heroGlassSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  heroGlassTopLine: {
    position: 'absolute',
    top: 1,
    right: 24,
    left: 24,
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  heroHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroLocationIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(240,205,124,0.54)',
    backgroundColor: 'rgba(126,79,147,0.28)',
  },
  privacyPill: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 99,
  },
  heroTitle: {
    flex: 1,
    color: '#FFF9F3',
    fontFamily: typography.serifMedium,
    fontSize: 24,
    lineHeight: 27,
  },
  heroText: {
    marginTop: 6,
    marginLeft: 46,
    color: '#D6CEDB',
    fontFamily: typography.sans,
    fontSize: 11.25,
    lineHeight: 16,
  },
  locationButton: {
    minHeight: 47,
    marginTop: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 16,
    shadowColor: '#DDAF4F',
    shadowOpacity: 0.22,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  disabledButton: {
    opacity: 0.72,
  },
  locationButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 12.75,
    fontWeight: '700',
  },
  privacyText: {
    color: '#C9BFCE',
    fontFamily: typography.sans,
    fontSize: 8.75,
    lineHeight: 12,
  },
  messageCard: {
    marginTop: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.30)',
    backgroundColor: colors.backgroundSecondary,
  },
  messageCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  messageTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  messageText: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  settingsButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: colors.goldLight,
  },
  settingsButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: '700',
  },
  errorCard: {
    marginTop: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.30)',
    backgroundColor: colors.backgroundSecondary,
  },
  errorText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  myMosqueCard: {
    minHeight: 142,
    marginTop: 18,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.38)',
    backgroundColor: '#100C1B',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  myMosqueCardActive: {
    borderColor: 'rgba(232,190,91,0.62)',
    backgroundColor: '#120D1E',
  },
  myMosqueImageWrap: {
    width: 112,
    height: 120,
    overflow: 'hidden',
    borderRadius: 19,
    backgroundColor: '#1A1324',
  },
  myMosqueImage: {
    width: '100%',
    height: '100%',
  },
  myMosqueImageBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.goldLight,
  },
  myMosqueCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },
  sectionEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  myMosqueTitle: {
    marginTop: 5,
    color: '#FFF8F1',
    fontFamily: typography.serifMedium,
    fontSize: 21,
    lineHeight: 24,
  },
  myMosqueText: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  nextPrayerRow: {
    marginTop: 10,
    paddingTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(199,190,209,0.18)',
  },
  nextPrayerLabel: {
    marginLeft: 5,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  nextPrayerDot: {
    width: 3,
    height: 3,
    marginHorizontal: 6,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  nextPrayerValue: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '700',
  },
  searchWrap: {
    height: 58,
    marginTop: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(126,72,148,0.36)',
    backgroundColor: '#120D1F',
  },
  addMosqueButton: {
    minHeight: 66,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.72)',
    backgroundColor: '#2A1740',
    shadowColor: colors.goldLight,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  addMosqueIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.goldLight,
  },
  addMosqueCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  addMosqueTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 14.5,
    fontWeight: '700',
  },
  addMosqueSubtitle: {
    marginTop: 3,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  searchFilterButton: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(126,72,148,0.25)',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginHorizontal: 10,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 14,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  sectionTitle: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 29,
    lineHeight: 32,
  },
  sectionSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  cacheStatus: {
    marginTop: 4,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  cacheWarningCard: {
    marginTop: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.28)',
    backgroundColor: colors.backgroundSecondary,
  },
  cacheWarningText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  modeSwitch: {
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(126,72,148,0.42)',
    backgroundColor: '#171125',
  },
  modeButton: {
    minWidth: 66,
    height: 40,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 15,
  },
  modeButtonActive: {
    backgroundColor: colors.goldLight,
  },
  modeButtonText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: colors.background,
  },
  mapCard: {
    height: 520,
    overflow: 'hidden',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.34)',
    backgroundColor: colors.surfaceAlt,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,18,43,0.91)',
  },
  mapOverlayIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: 'rgba(126,72,148,0.24)',
  },
  mapOverlayTitle: {
    marginTop: 15,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 22,
    textAlign: 'center',
  },
  mapOverlayText: {
    maxWidth: 300,
    marginTop: 7,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  mapOverlayButton: {
    minHeight: 46,
    marginTop: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.goldLight,
  },
  mapOverlayButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  selectedMosqueCard: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    left: 12,
    padding: 14,
    paddingRight: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.42)',
    backgroundColor: 'rgba(35,22,49,0.97)',
  },
  selectedMosqueClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  selectedMosqueName: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
    lineHeight: 22,
  },
  selectedMosqueAddress: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  selectedMosqueMeta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedMosqueDistance: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  selectedMosqueDot: {
    width: 3,
    height: 3,
    marginHorizontal: 7,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  selectedMosqueDuration: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11.5,
  },
  routeErrorText: {
    marginTop: 7,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 15,
  },
  selectedMosqueActions: {
    marginTop: 11,
    flexDirection: 'row',
    gap: 8,
  },
  routeButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    backgroundColor: colors.goldLight,
  },
  routeButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: '700',
  },
  detailButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  detailButtonText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 11.5,
  },
  mapControls: {
    position: 'absolute',
    right: 12,
    bottom: 14,
    gap: 9,
  },
  mapControlsRaised: {
    bottom: 158,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.42)',
    backgroundColor: colors.backgroundSecondary,
  },
  mapLoading: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: colors.backgroundSecondary,
  },
  mapLoadingText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  emptyCard: {
    minHeight: 220,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
  },
  emptyTitle: {
    marginTop: 14,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 20,
    textAlign: 'center',
  },
  emptyText: {
    maxWidth: 300,
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  list: {
    gap: 11,
  },
  mosqueCard: {
    minHeight: 142,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(126,72,148,0.34)',
    backgroundColor: '#100C1B',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  mosqueImageWrap: {
    width: 112,
    height: 122,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#1B1426',
  },
  mosqueImage: {
    width: '100%',
    height: '100%',
  },
  mosqueCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },
  mosqueName: {
    color: '#FFF9F3',
    fontFamily: typography.serifMedium,
    fontSize: 20,
    lineHeight: 23,
  },
  mosqueAddress: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  mosqueMetaRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mosqueDistance: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  mosqueMeta: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11.5,
  },
  dot: {
    width: 3,
    height: 3,
    marginHorizontal: 7,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  tags: {
    marginTop: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9,
    backgroundColor: 'rgba(224,188,112,0.08)',
  },
  tagText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  availableTag: {
    backgroundColor: 'rgba(90,164,105,0.13)',
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7ACA8B',
  },
  availableTagText: {
    color: '#A9D9B1',
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  mosqueActions: {
    width: 30,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  mosqueFavoriteButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(224,188,112,0.06)',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.99 }],
  },
});
