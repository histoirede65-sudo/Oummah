import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import MapView, {
    Marker,
    Polyline,
    type Region,
} from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    getMainMosque,
    type StoredMosque,
} from '../features/mosques/data/mosquePreferences';
import {
    getWalkingRoute,
    type MosqueRoute,
} from '../features/mosques/data/mosqueRoute';
import {
    isMosqueSearchCacheFresh,
    readMosqueSearchCache,
    writeMosqueSearchCache,
} from '../features/mosques/data/mosqueSearchCache';
import {
    getNearbyMosques,
    type NearbyMosque,
} from '../features/mosques/data/nearbyMosques';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type ExploreMode = 'list' | 'map';

type LocationState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'denied'
  | 'error';

type UserCoordinates = {
  latitude: number;
  longitude: number;
};

const INITIAL_REGION: Region = {
  latitude: 46.603354,
  longitude: 1.888334,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

function getLocationErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message.startsWith('OVERPASS_')
  ) {
    return 'Le service de recherche des mosquées est momentanément indisponible.';
  }

  return 'Impossible de récupérer les mosquées autour de vous pour le moment.';
}

function openMosqueDetails(mosque: NearbyMosque) {
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
    },
  } as Href);
}

export default function MosquesScreen() {
  const [mode, setMode] = useState<ExploreMode>('list');
  const [query, setQuery] = useState('');
  const [locationState, setLocationState] =
    useState<LocationState>('idle');
  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [userCoordinates, setUserCoordinates] =
    useState<UserCoordinates | null>(null);
  const [selectedMosque, setSelectedMosque] =
    useState<NearbyMosque | null>(null);
  const [route, setRoute] = useState<MosqueRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [usingCachedResults, setUsingCachedResults] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [mainMosque, setMainMosqueState] =
    useState<StoredMosque | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const requestController =
    useRef<AbortController | null>(null);
  const routeController =
    useRef<AbortController | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const filteredMosques = useMemo(() => {
    const normalized = query
      .trim()
      .toLocaleLowerCase('fr');

    if (!normalized) return mosques;

    return mosques.filter((mosque) =>
      `${mosque.name} ${mosque.address}`
        .toLocaleLowerCase('fr')
        .includes(normalized),
    );
  }, [mosques, query]);

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

  const selectMosqueOnMap = (mosque: NearbyMosque) => {
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
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
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
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setLocationState('denied');
        setMosques([]);
        setUserCoordinates(null);
        return;
      }

      const lastKnownPosition =
        await Location.getLastKnownPositionAsync();

      if (lastKnownPosition) {
        setUserCoordinates({
          latitude: lastKnownPosition.coords.latitude,
          longitude: lastKnownPosition.coords.longitude,
        });
      }

      const position =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

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
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
        return;
      }

      const cache = await readMosqueSearchCache();

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
        Alert.alert(
          'Recherche impossible',
          getLocationErrorMessage(error),
        );
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

    if (
      nextMode === 'map' &&
      userCoordinates &&
      mosques.length > 0
    ) {
      setTimeout(fitAllMarkers, 300);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadMainMosque = async () => {
        const storedMainMosque = await getMainMosque();

        if (active) {
          setMainMosqueState(storedMainMosque);
        }
      };

      void loadMainMosque();

      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    let active = true;

    const initializeMosques = async () => {
      const cache = await readMosqueSearchCache();

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

      const permission =
        await Location.getForegroundPermissionsAsync();

      if (!active) return;

      setInitializing(false);

      if (permission.granted) {
        if (!cache || !isMosqueSearchCacheFresh(cache)) {
          void locateMosques(true);
        }
      }
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
          <Ionicons
            name="arrow-back"
            size={23}
            color={colors.goldLight}
          />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>AUTOUR DE VOUS</Text>
          <Text style={styles.title}>Mosquées</Text>
        </View>

        <Pressable
          accessibilityLabel="Mes mosquées favorites"
          onPress={() =>
            router.push('/mosque/favorites' as Href)
          }
          style={styles.headerButton}
        >
          <Ionicons
            name="heart-outline"
            size={23}
            color={colors.goldLight}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />

          <View style={styles.heroIcon}>
            <Ionicons
              name="location-outline"
              size={29}
              color={colors.goldLight}
            />
          </View>

          <Text style={styles.heroTitle}>
            Trouver une mosquée près de vous
          </Text>

          <Text style={styles.heroText}>
            OUMMAH utilise votre position pour afficher les
            mosquées proches et calculer leur distance.
          </Text>

          <Pressable
            accessibilityRole="button"
            disabled={locationState === 'loading'}
            onPress={() => void locateMosques(false)}
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.pressed,
              locationState === 'loading' &&
                styles.disabledButton,
            ]}
          >
            {locationState === 'loading' ? (
              <ActivityIndicator
                size="small"
                color={colors.background}
              />
            ) : (
              <Ionicons
                name="navigate-outline"
                size={20}
                color={colors.background}
              />
            )}

            <Text style={styles.locationButtonText}>
              {locationButtonLabel}
            </Text>
          </Pressable>

          <Text style={styles.privacyText}>
            Votre position n’est ni publiée ni enregistrée.
          </Text>
        </View>

        {locationState === 'denied' ? (
          <View style={styles.messageCard}>
            <Ionicons
              name="location-outline"
              size={26}
              color={colors.goldLight}
            />

            <View style={styles.messageCopy}>
              <Text style={styles.messageTitle}>
                Localisation refusée
              </Text>
              <Text style={styles.messageText}>
                Autorisez la localisation dans les réglages pour
                découvrir les mosquées autour de vous.
              </Text>
            </View>

            <Pressable
              onPress={() => void openAppSettings()}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsButtonText}>
                Réglages
              </Text>
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
            <Text style={styles.cacheWarningText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {locationState === 'error' ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={23}
              color={colors.goldLight}
            />
            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
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
          <View
            style={[
              styles.myMosqueIcon,
              mainMosque && styles.myMosqueIconActive,
            ]}
          >
            <Ionicons
              name={mainMosque ? 'home' : 'home-outline'}
              size={24}
              color={
                mainMosque
                  ? colors.background
                  : colors.goldLight
              }
            />
          </View>

          <View style={styles.myMosqueCopy}>
            <Text style={styles.sectionEyebrow}>
              MA MOSQUÉE
            </Text>
            <Text
              numberOfLines={2}
              style={styles.myMosqueTitle}
            >
              {mainMosque
                ? mainMosque.name
                : 'Choisissez votre mosquée principale'}
            </Text>
            <Text
              numberOfLines={2}
              style={styles.myMosqueText}
            >
              {mainMosque
                ? mainMosque.address
                : 'Retrouvez ses horaires et ses événements en un geste.'}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color={colors.goldLight}
          />
        </Pressable>

        <View style={styles.searchWrap}>
          <Ionicons
            name="search-outline"
            size={21}
            color={colors.textMuted}
          />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher dans les résultats"
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
              {locationState === 'ready'
                ? 'Mosquées proches'
                : 'Explorer'}
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
                color={
                  mode === 'list'
                    ? colors.background
                    : colors.goldLight
                }
              />

              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'list' &&
                    styles.modeButtonTextActive,
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
                color={
                  mode === 'map'
                    ? colors.background
                    : colors.goldLight
                }
              />

              <Text
                style={[
                  styles.modeButtonText,
                  mode === 'map' &&
                    styles.modeButtonTextActive,
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
                    selectedMosque?.id === mosque.id
                      ? '#d9b45f'
                      : '#8a5aa4'
                  }
                  onPress={() => selectMosqueOnMap(mosque)}
                  onCalloutPress={() =>
                    openMosqueDetails(mosque)
                  }
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
                  La carte affichera votre position et les
                  mosquées autour de vous.
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
                  <Ionicons
                    name="close"
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>

                <Text
                  numberOfLines={2}
                  style={styles.selectedMosqueName}
                >
                  {selectedMosque.name}
                </Text>

                <Text
                  numberOfLines={1}
                  style={styles.selectedMosqueAddress}
                >
                  {selectedMosque.address}
                </Text>

                <View style={styles.selectedMosqueMeta}>
                  <Text style={styles.selectedMosqueDistance}>
                    {route?.distanceLabel ??
                      selectedMosque.distanceLabel}
                  </Text>

                  <View style={styles.selectedMosqueDot} />

                  <Text style={styles.selectedMosqueDuration}>
                    {route?.durationLabel ??
                      selectedMosque.walkingTimeLabel}
                  </Text>
                </View>

                {routeError ? (
                  <Text style={styles.routeErrorText}>
                    {routeError}
                  </Text>
                ) : null}

                <View style={styles.selectedMosqueActions}>
                  <Pressable
                    disabled={routeLoading}
                    onPress={() =>
                      void drawRouteToSelectedMosque()
                    }
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
                      {route
                        ? 'Recalculer'
                        : 'Afficher le trajet'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      openMosqueDetails(selectedMosque)
                    }
                    style={({ pressed }) => [
                      styles.detailButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.detailButtonText}>
                      Voir la fiche
                    </Text>
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
                  <Ionicons
                    name="locate"
                    size={21}
                    color={colors.goldLight}
                  />
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
                <ActivityIndicator
                  size="small"
                  color={colors.goldLight}
                />
                <Text style={styles.mapLoadingText}>
                  Recherche des mosquées…
                </Text>
              </View>
            ) : null}
          </View>
        ) : locationState === 'loading' ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator
              size="large"
              color={colors.goldLight}
            />

            <Text style={styles.emptyTitle}>
              Recherche autour de vous
            </Text>

            <Text style={styles.emptyText}>
              La première recherche peut prendre quelques
              secondes.
            </Text>
          </View>
        ) : locationState === 'ready' &&
          filteredMosques.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="business-outline"
              size={34}
              color={colors.goldLight}
            />

            <Text style={styles.emptyTitle}>
              Aucune mosquée trouvée
            </Text>

            <Text style={styles.emptyText}>
              Effacez la recherche ou actualisez votre position.
            </Text>
          </View>
        ) : filteredMosques.length > 0 ? (
          <View style={styles.list}>
            {filteredMosques.map((mosque) => (
              <Pressable
                key={mosque.id}
                onPress={() => openMosqueDetails(mosque)}
                style={({ pressed }) => [
                  styles.mosqueCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.mosqueIcon}>
                  <Ionicons
                    name="business-outline"
                    size={25}
                    color={colors.goldLight}
                  />
                </View>

                <View style={styles.mosqueCopy}>
                  <Text
                    numberOfLines={2}
                    style={styles.mosqueName}
                  >
                    {mosque.name}
                  </Text>

                  <Text
                    numberOfLines={2}
                    style={styles.mosqueAddress}
                  >
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
                    <View style={styles.tag}>
                      <Ionicons
                        name="information-circle-outline"
                        size={12}
                        color={colors.goldLight}
                      />
                      <Text style={styles.tagText}>
                        Voir la fiche
                      </Text>
                    </View>

                    {mosque.openingHours ? (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>
                          Horaires renseignés
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.goldLight}
                />
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
              Appuyez sur « Utiliser ma position » pour
              commencer.
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
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 78,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.purpleDeep,
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
    fontSize: 31,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 56,
    alignSelf: 'center',
  },
  heroCard: {
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 25,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.34)',
    backgroundColor: colors.surfaceAlt,
  },
  heroGlow: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(126,72,148,0.24)',
  },
  heroIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: 'rgba(126,72,148,0.23)',
  },
  heroTitle: {
    marginTop: 16,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 25,
    lineHeight: 31,
    textAlign: 'center',
  },
  heroText: {
    maxWidth: 340,
    marginTop: 9,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  locationButton: {
    minHeight: 50,
    marginTop: 19,
    paddingHorizontal: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 18,
    backgroundColor: colors.goldLight,
  },
  disabledButton: {
    opacity: 0.72,
  },
  locationButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: '700',
  },
  privacyText: {
    marginTop: 11,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
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
    minHeight: 108,
    marginTop: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  myMosqueCardActive: {
    borderColor: 'rgba(224,188,112,0.55)',
  },
  myMosqueIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(126,72,148,0.19)',
  },
  myMosqueIconActive: {
    backgroundColor: colors.goldLight,
  },
  myMosqueCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 13,
  },
  sectionEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  myMosqueTitle: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 19,
    lineHeight: 24,
  },
  myMosqueText: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },
  searchWrap: {
    height: 54,
    marginTop: 16,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
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
    marginTop: 23,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 25,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  modeButton: {
    minWidth: 78,
    height: 38,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 13,
  },
  modeButtonActive: {
    backgroundColor: colors.goldLight,
  },
  modeButtonText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
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
    gap: 12,
  },
  mosqueCard: {
    minHeight: 150,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  mosqueIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(126,72,148,0.20)',
  },
  mosqueCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },
  mosqueName: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 20,
    lineHeight: 25,
  },
  mosqueAddress: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  mosqueMetaRow: {
    marginTop: 11,
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
    marginTop: 11,
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
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.99 }],
  },
});