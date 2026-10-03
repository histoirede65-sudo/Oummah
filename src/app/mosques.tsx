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
  type LayoutChangeEvent,
  Linking,
  type GestureResponderEvent,
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
  clearMainMosque,
  getFavoriteMosques,
  getMainMosque,
  setMosqueFavorite,
  syncMosqueFavorites,
  type StoredMosque,
} from '../features/mosques/data/mosquePreferences';
import {
  getApprovedMosquePrayerTimes,
  getIqamaTime,
  getMosqueScheduleWithApprovedTimes,
} from '../features/mosques/data/mosquePrayerUpdates';
import { getMosquePosts, type MosquePost } from '../features/mosques/data/mosquePosts';
import {
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
import MyMosqueSection from '../components/mosques/MyMosqueSection';
import { styles } from '../components/mosques/mosquesScreenStyles';
import {
  distanceBetween,
  formatDistance,
  formatWalkingTime,
  getLocationErrorMessage,
  INITIAL_REGION,
  MOSQUE_HERO_IMAGE,
  MOSQUE_RENDER_BATCH_SIZE,
  namesLookSimilar,
  openMosqueDetails,
  SAME_ZONE_MAX_DISTANCE_METERS,
  userMosqueToDisplay,
  type DisplayMosque,
  type UserCoordinates,
} from '../features/mosques/mosquesScreenData';
import { colors } from '../theme/colors';

type ExploreMode = 'list' | 'map';

type LocationState = 'idle' | 'loading' | 'ready' | 'denied' | 'error';

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
  const [mainMosqueIqama, setMainMosqueIqama] = useState<string | null>(null);
  const [mainMosqueNextEvent, setMainMosqueNextEvent] = useState<MosquePost | null>(null);
  const [favoriteMosques, setFavoriteMosques] = useState<StoredMosque[]>([]);
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
  const scrollViewRef = useRef<ScrollView | null>(null);
  const resultsSectionY = useRef(0);

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

  const scrollToResults = () => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, resultsSectionY.current - 16),
        animated: true,
      });
    });
  };

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

  const removeMainMosque = () => {
    if (!mainMosque) return;

    Alert.alert(
      'Retirer ma mosquée',
      `Voulez-vous retirer ${mainMosque.name} comme votre mosquée principale ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            void clearMainMosque()
              .then(() => {
                setMainMosqueState(null);
                setMainMosqueNextPrayer(null);
              })
              .catch(() => {
                Alert.alert(
                  'Suppression impossible',
                  'Impossible de retirer votre mosquée principale pour le moment.',
                );
              });
          },
        },
      ],
    );
  };

  const searchFromCoordinates = async (
    coordinates: UserCoordinates,
    controller: AbortController,
  ) => {
    setUserCoordinates(coordinates);

    const cache = await readMosqueSearchCache().catch(() => null);
    const cachedMosques = cache && distanceBetween(coordinates, {
      latitude: cache.latitude,
      longitude: cache.longitude,
    }) <= SAME_ZONE_MAX_DISTANCE_METERS
      ? cache.mosques
      : [];

    if (cachedMosques.length > 0) {
      setMosques(cachedMosques);
      setUsingCachedResults(true);
      setLocationState('ready');
    }

    const nearbyMosques = await getNearbyMosques(
      coordinates.latitude,
      coordinates.longitude,
      controller.signal,
      (progressMosques) => {
        if (controller.signal.aborted) return;
        setMosques(progressMosques);
        setUsingCachedResults(false);
        setLocationState('ready');
      },
      cachedMosques,
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

    // The automatic search on arrival leaves the screen where it is.
    if (!silent) scrollToResults();

    requestController.current?.abort();

    const controller = new AbortController();
    requestController.current = controller;

    setLocationState('loading');
    setErrorMessage('');
    setSelectedMosque(null);
    setRoute(null);
    setRouteError('');
    let attemptedCoordinates: UserCoordinates | null = null;

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
      attemptedCoordinates = coordinates;

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

      if (
        cache
        && attemptedCoordinates
        && distanceBetween(attemptedCoordinates, {
          latitude: cache.latitude,
          longitude: cache.longitude,
        }) <= SAME_ZONE_MAX_DISTANCE_METERS
      ) {
        setUserCoordinates({
          latitude: attemptedCoordinates.latitude,
          longitude: attemptedCoordinates.longitude,
        });
        setMosques(cache.mosques);
        setUsingCachedResults(true);
        setLocationState('ready');
        setErrorMessage(
          'Connexion instable : les derniers résultats enregistrés sont affichés.',
        );
        return;
      }

      // Automatic search on arrival: keep the last results rather than an empty list.
      if (silent && cache && cache.mosques.length > 0) {
        setMosques(cache.mosques);
        setUserCoordinates({ latitude: cache.latitude, longitude: cache.longitude });
        setUsingCachedResults(true);
        setLocationState('ready');
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

      const loadMosquePreferences = async (afterSync = false): Promise<void> => {
        const [storedMainMosque, storedFavorites, storedUserMosques] = await Promise.all([
          getMainMosque().catch(() => null),
          getFavoriteMosques().catch(() => []),
          getUserMosques().catch(() => []),
        ]);

        if (active) {
          setMainMosqueState(storedMainMosque);
          setFavoriteMosqueIds(
            new Set(storedFavorites.flatMap((mosque) => mosque.mosqueId ? [mosque.id, mosque.mosqueId] : [mosque.id])),
          );
          setFavoriteMosques(storedFavorites);
          setUserMosques(storedUserMosques);
          if (!storedMainMosque) {
            setMainMosqueNextPrayer(null);
            setMainMosqueIqama(null);
            setMainMosqueNextEvent(null);
          }
        }

        if (!afterSync) {
          // Favorites and main mosque saved on the account (another phone) are merged in, then reloaded.
          void syncMosqueFavorites().then((changed) => {
            if (changed && active) void loadMosquePreferences(true);
          });
        }

        if (!storedMainMosque) return;

        const [schedule, approved, posts] = await Promise.all([
          getMosqueScheduleWithApprovedTimes(storedMainMosque, prayerController.signal).catch(() => null),
          getApprovedMosquePrayerTimes(storedMainMosque.id).catch(() => null),
          getMosquePosts(storedMainMosque.id),
        ]);

        if (!active) return;
        const nextPrayer = schedule ? getNextPrayer(schedule) : null;
        setMainMosqueNextPrayer(nextPrayer);
        setMainMosqueIqama(nextPrayer && schedule
          ? getIqamaTime(
              approved?.iqama?.[nextPrayer.key.toLowerCase() as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'],
              nextPrayer,
              schedule.timezone,
            )
          : null);
        setMainMosqueNextEvent(posts.find((post) => post.kind === 'event') ?? null);
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

    // On arrival: last results shown at once, then a fresh search when the location is already allowed
    // (no permission prompt here: the button asks).
    const initializeMosques = async () => {
      const cache = await readMosqueSearchCache().catch(() => null);
      if (!active) return;

      if (cache && cache.mosques.length > 0) {
        setMosques(cache.mosques);
        setUserCoordinates({ latitude: cache.latitude, longitude: cache.longitude });
        setUsingCachedResults(true);
        setLocationState('ready');
      }

      const permission = await Location.getForegroundPermissionsAsync().catch(() => null);
      if (!active) return;
      setInitializing(false);
      if (permission?.granted) void locateMosques(true);
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
        : 'Appuyer pour rechercher';

  const myMosqueSectionElement = (
    <MyMosqueSection
      mainMosque={mainMosque}
      nextPrayer={mainMosqueNextPrayer}
      iqama={mainMosqueIqama}
      nextEvent={mainMosqueNextEvent}
      favorites={favoriteMosques}
      onRemoveMainMosque={removeMainMosque}
    />
  );

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
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={handleContentScroll}
        scrollEventThrottle={100}
      >
        {mainMosque ? myMosqueSectionElement : null}

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

        {!mainMosque ? myMosqueSectionElement : null}

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

        <View
          onLayout={(event: LayoutChangeEvent) => {
            resultsSectionY.current = event.nativeEvent.layout.y;
          }}
          style={styles.sectionHeader}
        >
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>
              {locationState === 'ready' ? 'Mosquées proches' : 'Explorer'}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {locationState === 'ready'
                ? `${mosques.length} résultat${mosques.length > 1 ? 's' : ''} autour de vous`
                : initializing
                  ? 'Préparation de la recherche…'
                  : 'Appuyez sur le bouton pour chercher les mosquées proches'}
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
