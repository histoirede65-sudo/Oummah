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
  walkingMinutes,
  getLocationErrorMessage,
  INITIAL_REGION,
  MOSQUE_RENDER_BATCH_SIZE,
  namesLookSimilar,
  openMosqueDetails,
  SAME_ZONE_MAX_DISTANCE_METERS,
  userMosqueToDisplay,
  type DisplayMosque,
  type UserCoordinates,
} from '../features/mosques/mosquesScreenData';
import { useI18n } from '../i18n';
import { colors } from '../theme/colors';

type ExploreMode = 'list' | 'map';

type LocationState = 'idle' | 'loading' | 'ready' | 'denied' | 'error';

export default function MosquesScreen() {
  const { language, t } = useI18n();
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
      userMosqueToDisplay(mosque, userCoordinates, language, t),
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
          distanceLabel: formatDistance(distanceMeters, language),
          walkingTimeLabel: t('mosques.walkMinutes', { count: walkingMinutes(distanceMeters) }),
        };
      })
      .sort((first, second) => first.distanceMeters - second.distanceMeters);
  }, [language, mosques, t, userMosques, userCoordinates]);

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
      setRouteError(t('mosques.routeError'));
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

      Alert.alert(t('mosques.favoriteErrorTitle'), t('mosques.favoriteErrorMessage'));
    } finally {
      setSavingFavoriteId(null);
    }
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
        setErrorMessage(t('mosques.unstableConnection'));
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
      setErrorMessage(getLocationErrorMessage(error, t));
      setLocationState('error');

      if (!silent) {
        Alert.alert(t('mosques.searchFailed'), getLocationErrorMessage(error, t));
      }
    }
  };

  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(t('mosques.settingsUnavailableTitle'), t('mosques.settingsUnavailableMessage'));
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
      ? t('mosques.searching')
      : locationState === 'ready'
        ? t('mosques.refreshLocation')
        : t('mosques.useLocation');

  const myMosqueSectionElement = (
    <MyMosqueSection
      mainMosque={mainMosque}
      nextPrayer={mainMosqueNextPrayer}
      iqama={mainMosqueIqama}
      nextEvent={mainMosqueNextEvent}
      favorites={favoriteMosques}
    />
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={23} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{t('mosques.eyebrow')}</Text>
          <Text style={styles.title}>{t('mosques.title')}</Text>
        </View>

        <Pressable
          accessibilityLabel={t('mosques.favoritesAccessibility')}
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

        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={21} color={colors.textMuted} />

            <TextInput
              accessibilityLabel={t('mosques.searchPlaceholder')}
              value={query}
              onChangeText={setQuery}
              placeholder={t('mosques.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
            />

            {query ? (
              <Pressable
                accessibilityLabel={t('mosques.clearSearch')}
                hitSlop={8}
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={locationButtonLabel}
            disabled={locationState === 'loading'}
            onPress={() => void locateMosques(false)}
            style={({ pressed }) => [
              styles.locateButton,
              pressed && styles.pressed,
              locationState === 'loading' && styles.disabledButton,
            ]}
          >
            {locationState === 'loading' ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons name="navigate" size={20} color={colors.background} />
            )}
          </Pressable>
        </View>

        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed" size={11} color={colors.textMuted} />
          <Text style={styles.privacyText}>{t('mosques.privacy')}</Text>
        </View>

        {locationState !== 'ready' && locationState !== 'loading' && !initializing && displayMosques.length === 0 ? (
          <View style={styles.locatePrompt}>
            <View style={styles.locatePromptIcon}>
              <Ionicons name="location-outline" size={22} color={colors.goldLight} />
            </View>
            <View style={styles.locatePromptCopy}>
              <Text style={styles.locatePromptTitle}>{t('mosques.promptTitle')}</Text>
              <Text style={styles.locatePromptText}>{t('mosques.promptText')}</Text>
            </View>
            <Pressable
              onPress={() => void locateMosques(false)}
              style={({ pressed }) => [styles.locatePromptButton, pressed && styles.pressed]}
            >
              <Text style={styles.locatePromptButtonText}>{t('mosques.useLocation')}</Text>
            </Pressable>
          </View>
        ) : null}

        {locationState === 'denied' ? (
          <View style={styles.messageCard}>
            <Ionicons
              name="location-outline"
              size={26}
              color={colors.goldLight}
            />

            <View style={styles.messageCopy}>
              <Text style={styles.messageTitle}>{t('mosques.deniedTitle')}</Text>
              <Text style={styles.messageText}>{t('mosques.deniedText')}</Text>
            </View>

            <Pressable
              onPress={() => void openAppSettings()}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsButtonText}>{t('mosques.settings')}</Text>
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

        <View
          onLayout={(event: LayoutChangeEvent) => {
            resultsSectionY.current = event.nativeEvent.layout.y;
          }}
          style={styles.sectionHeader}
        >
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>
              {locationState === 'ready' ? t('mosques.nearbyTitle') : t('mosques.exploreTitle')}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {locationState === 'ready' || filteredMosques.length > 0
                ? t(filteredMosques.length > 1 ? 'mosques.resultsMany' : 'mosques.resultsOne', {
                    count: filteredMosques.length,
                  })
                : initializing
                  ? t('mosques.preparing')
                  : t('mosques.pressToSearch')}
              {usingCachedResults ? ` · ${t('mosques.cachedResults')}` : ''}
            </Text>
          </View>

          <View style={styles.modeSwitch}>
            <Pressable
              accessibilityLabel={t('mosques.showList')}
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
                {t('mosques.list')}
              </Text>
            </Pressable>

            <Pressable
              accessibilityLabel={t('mosques.showMap')}
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
                {t('mosques.map')}
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
                  strokeColor={colors.goldLight}
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
                    selectedMosque?.id === mosque.id ? '#E3B55A' : '#8C6A2E'
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

                <Text style={styles.mapOverlayTitle}>{t('mosques.mapOverlayTitle')}</Text>

                <Text style={styles.mapOverlayText}>{t('mosques.mapOverlayText')}</Text>

                <Pressable
                  onPress={() => void locateMosques(false)}
                  style={styles.mapOverlayButton}
                >
                  <Text style={styles.mapOverlayButtonText}>{t('mosques.useLocation')}</Text>
                </Pressable>
              </View>
            ) : null}

            {selectedMosque ? (
              <View style={styles.selectedMosqueCard}>
                <Pressable
                  accessibilityLabel={t('mosques.closeSelection')}
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
                      {route ? t('mosques.recalculate') : t('mosques.showRoute')}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openMosqueDetails(selectedMosque)}
                    style={({ pressed }) => [
                      styles.detailButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.detailButtonText}>{t('mosques.openSheet')}</Text>
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
                  accessibilityLabel={t('mosques.centerOnMe')}
                  onPress={centerMapOnUser}
                  style={styles.mapControlButton}
                >
                  <Ionicons name="locate" size={21} color={colors.goldLight} />
                </Pressable>

                <Pressable
                  accessibilityLabel={t('mosques.showAll')}
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
                <Text style={styles.mapLoadingText}>{t('mosques.searchingMosques')}</Text>
              </View>
            ) : null}
          </View>
        ) : locationState === 'loading' ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="large" color={colors.goldLight} />

            <Text style={styles.emptyTitle}>{t('mosques.searchingTitle')}</Text>

            <Text style={styles.emptyText}>{t('mosques.searchingText')}</Text>
          </View>
        ) : locationState === 'ready' && filteredMosques.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="business-outline"
              size={34}
              color={colors.goldLight}
            />

            <Text style={styles.emptyTitle}>{t('mosques.noneTitle')}</Text>

            <Text style={styles.emptyText}>{t('mosques.noneText')}</Text>
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
                  <Text style={styles.illustrationLabel}>{t('mosques.illustration')}</Text>
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

                  {mosque.source === 'user' || mosque.openingHours ? (
                    <View style={styles.tags}>
                      {mosque.source === 'user' ? (
                        <View style={[styles.tag, styles.availableTag]}>
                          <View style={styles.availableDot} />
                          <Text style={styles.availableTagText}>{t('mosques.communityAdded')}</Text>
                        </View>
                      ) : null}

                      {mosque.openingHours ? (
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>{t('mosques.hoursProvided')}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                <View style={styles.mosqueActions}>
                  <Pressable
                    accessibilityLabel={
                      favoriteMosqueIds.has(mosque.id)
                        ? t('mosques.removeFavorite')
                        : t('mosques.addFavorite')
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

            <Text style={styles.emptyTitle}>{t('mosques.discoverTitle')}</Text>

            <Text style={styles.emptyText}>{t('mosques.discoverText')}</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
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
            <Text style={styles.addMosqueTitle}>{t('mosques.addTitle')}</Text>
            <Text style={styles.addMosqueSubtitle}>{t('mosques.addSubtitle')}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.goldLight}
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
