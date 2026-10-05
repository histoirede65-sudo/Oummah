import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HalalMap from '../components/halal/HalalMap';
import HalalPlaceCard from '../components/halal/HalalPlaceCard';
import {
  getHalalFavoriteIds,
  isHalalPlaceOpenNow,
  searchNearbyHalalPlaces,
  rememberResolvedHalalAddress,
  toggleHalalFavorite,
} from '../features/halal/data/HalalPlacesRepository';
import {
  DEFAULT_HALAL_FILTERS,
  type HalalCoordinates,
  type HalalPlace,
  type HalalPlaceCategory,
} from '../features/halal/domain/HalalPlace';
import { translate, useI18n, type TranslationKey } from '../i18n';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type ExploreMode = 'list' | 'map';
type LocationState = 'idle' | 'loading' | 'ready' | 'denied' | 'error';

const CATEGORIES: Array<{ key: HalalPlaceCategory | 'all'; labelKey: TranslationKey; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'all', labelKey: 'halal.catAll', icon: 'apps-outline' },
  { key: 'restaurant', labelKey: 'halal.catRestaurants', icon: 'restaurant-outline' },
  { key: 'fast_food', labelKey: 'halal.catFastFood', icon: 'fast-food-outline' },
  { key: 'butcher', labelKey: 'halal.catButchers', icon: 'storefront-outline' },
  { key: 'grocery', labelKey: 'halal.catGroceries', icon: 'basket-outline' },
  { key: 'bakery', labelKey: 'halal.catBakeries', icon: 'cafe-outline' },
];
const RADIUS_OPTIONS = [3_000, 5_000, 10_000, 20_000, 40_000];

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr').trim();
}

function formatArea(place?: Location.LocationGeocodedAddress) {
  return place?.city ?? place?.district ?? place?.subregion ?? place?.region ?? translate('halal.aroundMe');
}

function formatResolvedAddress(place?: Location.LocationGeocodedAddress) {
  if (!place) return '';
  const street = [place.streetNumber, place.street ?? place.name].filter(Boolean).join(' ');
  const city = place.city ?? place.district ?? place.subregion ?? place.region;
  return [street, [place.postalCode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

async function completeMissingAddresses(places: HalalPlace[]) {
  const completed = [...places];
  const missingIndexes = completed
    .map((place, index) => place.address === 'Adresse non renseignée' ? index : -1)
    .filter((index) => index >= 0);
  for (let offset = 0; offset < missingIndexes.length; offset += 4) {
    const indexes = missingIndexes.slice(offset, offset + 4);
    await Promise.all(indexes.map(async (index) => {
      const place = completed[index];
      const results = await Location.reverseGeocodeAsync({ latitude: place.latitude, longitude: place.longitude }).catch(() => []);
      const address = formatResolvedAddress(results[0]);
      if (address) completed[index] = rememberResolvedHalalAddress(place, address);
    }));
  }
  return completed.filter((place) => place.address !== 'Adresse non renseignée');
}

export default function HalalAroundMeScreen() {
  const { t } = useI18n();
  const [origin, setOrigin] = useState<HalalCoordinates | null>(null);
  const [areaLabel, setAreaLabel] = useState(() => translate('halal.aroundMe'));
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [places, setPlaces] = useState<HalalPlace[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [mode, setMode] = useState<ExploreMode>('list');
  const [category, setCategory] = useState<HalalPlaceCategory | 'all'>('all');
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_HALAL_FILTERS.radiusMeters);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HalalPlace | null>(null);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [citySearching, setCitySearching] = useState(false);
  const firstLoad = useRef(true);
  const originRef = useRef<HalalCoordinates | null>(null);
  const radiusRef = useRef(DEFAULT_HALAL_FILTERS.radiusMeters);
  const radiusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSequenceRef = useRef(0);

  useEffect(() => () => {
    if (radiusTimerRef.current) clearTimeout(radiusTimerRef.current);
  }, []);

  const loadPlaces = useCallback(async (coordinates: HalalCoordinates, radius: number, refresh = false) => {
    const searchSequence = ++searchSequenceRef.current;
    refresh ? setRefreshing(true) : setSearching(true);
    try {
      const result = await searchNearbyHalalPlaces(coordinates, radius, undefined, (progressResult) => {
        if (searchSequence !== searchSequenceRef.current) return;
        setPlaces(progressResult.places);
        setFromCache(progressResult.fromCache);
        setLocationState('ready');
      });
      if (searchSequence !== searchSequenceRef.current) return;
      const completedPlaces = await completeMissingAddresses(result.places);
      if (searchSequence !== searchSequenceRef.current) return;
      setPlaces(completedPlaces);
      setFromCache(result.fromCache);
      setLocationState('ready');
    } catch {
      if (searchSequence !== searchSequenceRef.current) return;
      setLocationState('error');
      Alert.alert(translate('halal.loadErrorTitle'), translate('halal.loadErrorText'));
    } finally {
      if (searchSequence === searchSequenceRef.current) {
        setSearching(false);
        setRefreshing(false);
      }
    }
  }, []);

  const locate = useCallback(async () => {
    setLocationState('loading');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationState('denied');
        return;
      }
      const last = await Location.getLastKnownPositionAsync({ maxAge: 120_000, requiredAccuracy: 2_000 });
      const position = last ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      originRef.current = coordinates;
      setOrigin(coordinates);
      const placesPromise = loadPlaces(coordinates, radiusRef.current);
      void Location.reverseGeocodeAsync(coordinates)
        .then((addresses) => setAreaLabel(formatArea(addresses[0])))
        .catch(() => undefined);
      await placesPromise;
    } catch {
      setLocationState('error');
    }
  }, [loadPlaces]);

  useFocusEffect(useCallback(() => {
    let active = true;
    getHalalFavoriteIds().then((ids) => active && setFavoriteIds(ids));
    if (firstLoad.current || !originRef.current) {
      firstLoad.current = false;
      void locate();
    }
    return () => { active = false; };
  }, [loadPlaces, locate]));

  const filteredPlaces = useMemo(() => {
    const needle = normalize(query);
    return places.filter((place) => {
      if (category !== 'all' && place.category !== category) return false;
      if (verifiedOnly && !['verified_certificate', 'declared'].includes(place.verificationStatus)) return false;
      if (favoritesOnly && !favoriteIds.includes(place.id)) return false;
      if (openNow && (place.openNow ?? isHalalPlaceOpenNow(place.openingHours)) !== true) return false;
      if (!needle) return true;
      return normalize(`${place.name} ${place.address} ${place.cuisine ?? ''}`).includes(needle);
    });
  }, [category, favoriteIds, favoritesOnly, openNow, places, query, verifiedOnly]);

  const toggleFavorite = useCallback(async (id: string) => {
    const favorite = await toggleHalalFavorite(id);
    setFavoriteIds((current) => favorite ? [id, ...current.filter((item) => item !== id)] : current.filter((item) => item !== id));
  }, []);

  const chooseCity = useCallback(async () => {
    const value = cityQuery.trim();
    if (!value) return;
    setCitySearching(true);
    try {
      const results = await Location.geocodeAsync(value);
      const result = results[0];
      if (!result) {
        Alert.alert(translate('halal.cityNotFoundTitle'), translate('halal.cityNotFoundText'));
        return;
      }
      const coordinates = { latitude: result.latitude, longitude: result.longitude };
      originRef.current = coordinates;
      setOrigin(coordinates);
      setAreaLabel(value);
      setCityModalOpen(false);
      setCityQuery('');
      await loadPlaces(coordinates, radiusMeters);
    } catch {
      Alert.alert(translate('halal.cityErrorTitle'), translate('halal.cityErrorText'));
    } finally {
      setCitySearching(false);
    }
  }, [cityQuery, loadPlaces, radiusMeters]);

  const changeRadius = useCallback((radius: number) => {
    setRadiusMeters(radius);
    radiusRef.current = radius;
    if (radiusTimerRef.current) clearTimeout(radiusTimerRef.current);
    if (origin) {
      radiusTimerRef.current = setTimeout(() => void loadPlaces(origin, radius), 450);
    }
  }, [loadPlaces, origin]);

  const openPlace = useCallback((place: HalalPlace) => {
    router.push(`/halal/${encodeURIComponent(place.id)}` as Href);
  }, []);

  const addPlaceRoute = origin
    ? `/halal/add?lat=${origin.latitude}&lng=${origin.longitude}`
    : '/halal/add';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[colors.background, '#100C19', colors.background]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.headerButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{t('halal.eyebrow')}</Text>
          <Text style={styles.title}>{t('halal.title')}</Text>
        </View>
        <Pressable accessibilityLabel={t('halal.favoritesFilter')} accessibilityState={{ selected: favoritesOnly }} onPress={() => setFavoritesOnly((value) => !value)} style={[styles.headerButton, favoritesOnly && styles.headerButtonActive]}>
          <Ionicons name={favoritesOnly ? 'heart' : 'heart-outline'} size={21} color={colors.goldLight} />
        </Pressable>
      </View>

      <View style={styles.locationRow}>
        <Pressable accessibilityLabel={t('halal.changeZone')} onPress={() => setCityModalOpen(true)} style={styles.locationButton}>
          <Ionicons name="location" size={17} color={colors.goldLight} />
          <View style={styles.locationCopy}>
            <Text style={styles.locationCaption}>{t('halal.zone')}</Text>
            <Text numberOfLines={1} style={styles.locationName}>{areaLabel}</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </Pressable>
        <Pressable accessibilityLabel={t('halal.locateMe')} onPress={() => void locate()} style={styles.locateButton}>
          <Ionicons name="navigate" size={19} color={colors.background} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('halal.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            style={styles.searchInput}
          />
          {query ? <Pressable accessibilityLabel={t('halal.clearSearch')} hitSlop={8} onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color={colors.textMuted} /></Pressable> : null}
        </View>
        <View style={styles.modeSwitch}>
          {(['list', 'map'] as const).map((item) => (
            <Pressable key={item} accessibilityLabel={t(item === 'list' ? 'halal.listMode' : 'halal.mapMode')} accessibilityState={{ selected: mode === item }} onPress={() => setMode(item)} style={[styles.modeButton, mode === item && styles.modeButtonActive]}>
              <Ionicons name={item === 'list' ? 'list' : 'map-outline'} size={18} color={mode === item ? colors.background : colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroller}
        contentContainerStyle={styles.categoryRail}
      >
        {CATEGORIES.map((item) => {
          const active = category === item.key;
          return (
            <Pressable key={item.key} onPress={() => setCategory(item.key)} style={[styles.categoryChip, active && styles.chipActive]}>
              <Ionicons name={item.icon} size={14} color={active ? colors.background : colors.goldLight} />
              <Text style={[styles.categoryText, active && styles.chipTextActive]}>{t(item.labelKey)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroller}
        contentContainerStyle={styles.filterRail}
      >
        <View style={styles.radiusGroup}>
          {RADIUS_OPTIONS.map((radius) => (
            <Pressable key={radius} onPress={() => changeRadius(radius)} style={[styles.radiusButton, radiusMeters === radius && styles.radiusButtonActive]}>
              <Text style={[styles.radiusText, radiusMeters === radius && styles.radiusTextActive]}>{radius / 1_000} km</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => setOpenNow((value) => !value)} style={[styles.filterChip, openNow && styles.filterChipActive]}>
          <Ionicons name="time-outline" size={14} color={openNow ? colors.goldLight : colors.textSecondary} />
          <Text style={[styles.filterText, openNow && styles.filterTextActive]}>{t('halal.openNow')}</Text>
        </Pressable>
        <Pressable onPress={() => setVerifiedOnly((value) => !value)} style={[styles.filterChip, verifiedOnly && styles.filterChipActive]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={verifiedOnly ? colors.goldLight : colors.textSecondary} />
          <Text style={[styles.filterText, verifiedOnly && styles.filterTextActive]}>{t('halal.declaredFilter')}</Text>
        </Pressable>
      </ScrollView>

      {fromCache ? (
        <View style={styles.trustBar}>
          <Ionicons name="cloud-offline-outline" size={13} color={colors.goldMuted} />
          <Text style={styles.cacheText}>{t('halal.offline')}</Text>
        </View>
      ) : null}

      <View style={styles.content}>
        {searching && places.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.loaderHalo}><ActivityIndicator color={colors.goldLight} /></View>
            <Text style={styles.stateTitle}>{t('halal.searchingTitle')}</Text>
            <Text style={styles.stateBody}>{t('halal.searchingText', { km: radiusMeters / 1_000 })}</Text>
          </View>
        ) : locationState === 'denied' ? (
          <View style={styles.centerState}>
            <Ionicons name="location-outline" size={42} color={colors.goldLight} />
            <Text style={styles.stateTitle}>{t('halal.deniedTitle')}</Text>
            <Text style={styles.stateBody}>{t('halal.deniedText')}</Text>
            <Pressable onPress={() => setCityModalOpen(true)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{t('halal.searchCity')}</Text></Pressable>
          </View>
        ) : locationState === 'error' ? (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={42} color={colors.goldLight} />
            <Text style={styles.stateTitle}>{t('halal.errorTitle')}</Text>
            <Text style={styles.stateBody}>{t('halal.errorText')}</Text>
            <Pressable onPress={() => void locate()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{t('halal.retry')}</Text></Pressable>
            <Pressable onPress={() => setCityModalOpen(true)} style={styles.secondaryButton}>
              <Ionicons name="search-outline" size={16} color={colors.goldLight} />
              <Text style={styles.secondaryButtonText}>{t('halal.chooseCity')}</Text>
            </Pressable>
          </View>
        ) : mode === 'map' && origin ? (
          <View style={styles.mapShell}>
            <HalalMap origin={origin} places={filteredPlaces} selectedId={selected?.id} onSelect={setSelected} />
            <View style={styles.mapCount}><Text style={styles.mapCountText}>{t(filteredPlaces.length > 1 ? 'halal.countMany' : 'halal.countOne', { count: filteredPlaces.length })}</Text></View>
            {filteredPlaces.some((place) => place.source === 'google') ? <View style={styles.mapAttribution}><Text style={styles.mapAttributionText}>Google Maps</Text></View> : null}
            {selected ? (
              <View style={styles.selectedCard}>
                <HalalPlaceCard
                  compact
                  place={selected}
                  favorite={favoriteIds.includes(selected.id)}
                  onFavorite={() => void toggleFavorite(selected.id)}
                  onPress={() => openPlace(selected)}
                />
              </View>
            ) : null}
          </View>
        ) : (
            <FlatList
              data={filteredPlaces}
              keyExtractor={(item) => item.id}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={7}
              contentContainerStyle={[styles.list, filteredPlaces.length === 0 && styles.emptyList]}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshing={refreshing}
            onRefresh={() => origin && void loadPlaces(origin, radiusMeters, true)}
            renderItem={({ item }) => (
              <HalalPlaceCard
                place={item}
                favorite={favoriteIds.includes(item.id)}
                onFavorite={() => void toggleFavorite(item.id)}
                onPress={() => openPlace(item)}
              />
            )}
            ListHeaderComponent={filteredPlaces.length > 0 ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>{t(filteredPlaces.length > 1 ? 'halal.countMany' : 'halal.countOne', { count: filteredPlaces.length })}</Text>
                <Text style={styles.resultsHint}>{t('halal.closestFirst')}</Text>
              </View>
            ) : null}
            ListEmptyComponent={(
              <View style={styles.centerState}>
                <Ionicons name="restaurant-outline" size={40} color={colors.goldLight} />
                <Text style={styles.stateTitle}>{t(favoritesOnly ? 'halal.noFavorites' : 'halal.noResults')}</Text>
                <Text style={styles.stateBody}>{t('halal.noResultsText')}</Text>
              </View>
            )}
          />
        )}
      </View>

      <Pressable accessibilityLabel={t('halal.addPlace')} onPress={() => router.push(addPlaceRoute as Href)} style={[styles.addButton, mode === 'map' && selected && styles.addButtonRaised]}>
        <LinearGradient colors={[colors.goldLight, colors.gold, colors.goldDark]} style={styles.addGradient}>
          <Ionicons name="add" size={20} color={colors.background} />
          <Text style={styles.addButtonText}>{t('halal.add')}</Text>
        </LinearGradient>
      </Pressable>

      <Modal visible={cityModalOpen} transparent animationType="fade" onRequestClose={() => setCityModalOpen(false)}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityLabel={t('halal.close')} style={styles.modalBackdrop} onPress={() => setCityModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('halal.cityTitle')}</Text>
            <Text style={styles.modalBody}>{t('halal.cityText')}</Text>
            <View style={styles.cityInputBox}>
              <Ionicons name="search" size={18} color={colors.goldLight} />
              <TextInput
                autoFocus
                value={cityQuery}
                onChangeText={setCityQuery}
                onSubmitEditing={() => void chooseCity()}
                placeholder={t('halal.cityPlaceholder')}
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                autoCorrect={false}
                style={styles.cityInput}
              />
            </View>
            <Pressable disabled={citySearching || !cityQuery.trim()} onPress={() => void chooseCity()} style={[styles.primaryButton, (!cityQuery.trim() || citySearching) && styles.disabled]}>
              {citySearching ? <ActivityIndicator color={colors.background} /> : <Text style={styles.primaryButtonText}>{t('halal.exploreCity')}</Text>}
            </Pressable>
            {Platform.OS !== 'web' ? (
              <Pressable onPress={() => { setCityModalOpen(false); void locate(); }} style={styles.secondaryButton}>
                <Ionicons name="navigate-outline" size={16} color={colors.goldLight} />
                <Text style={styles.secondaryButtonText}>{t('halal.backToMyLocation')}</Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 5, paddingBottom: 10 },
  headerButton: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(227,181,90,0.25)', backgroundColor: 'rgba(21,16,34,0.86)' },
  headerButtonActive: { backgroundColor: 'rgba(200,148,58,0.18)', borderColor: colors.gold },
  headerCopy: { flex: 1, alignItems: 'center' },
  eyebrow: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 8, fontWeight: '800', letterSpacing: 2 },
  title: { marginTop: 1, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 25, fontWeight: '700' },
  locationRow: { flexDirection: 'row', paddingHorizontal: 18, gap: 9 },
  locationButton: { flex: 1, minWidth: 0, height: 54, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: 'rgba(30,23,48,0.86)' },
  locationCopy: { flex: 1, minWidth: 0 },
  locationCaption: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9, fontWeight: '600' },
  locationName: { marginTop: 1, color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: '800' },
  locateButton: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldLight },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginTop: 10, gap: 9 },
  searchBox: { flex: 1, height: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 13, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(43,34,56,0.32)', backgroundColor: 'rgba(21,16,34,0.94)' },
  searchInput: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 12.5, paddingVertical: 0 },
  modeSwitch: { flexDirection: 'row', padding: 3, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  modeButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeButtonActive: { backgroundColor: colors.goldLight },
  categoryScroller: { flexGrow: 0, flexShrink: 0, height: 51 },
  categoryRail: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6, gap: 7 },
  categoryChip: { height: 35, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: 'rgba(21,16,34,0.88)' },
  chipActive: { borderColor: colors.goldLight, backgroundColor: colors.goldLight },
  categoryText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '700' },
  chipTextActive: { color: colors.background },
  filterScroller: { flexGrow: 0, flexShrink: 0, height: 43 },
  filterRail: { paddingHorizontal: 18, paddingVertical: 6, gap: 7 },
  radiusGroup: { height: 31, flexDirection: 'row', padding: 2, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  radiusButton: { minWidth: 38, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  radiusButtonActive: { backgroundColor: 'rgba(227,181,90,0.18)' },
  radiusText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9, fontWeight: '700', fontVariant: ['lining-nums', 'tabular-nums'] },
  radiusTextActive: { color: colors.goldLight },
  filterChip: { height: 31, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  filterChipActive: { borderColor: 'rgba(227,181,90,0.50)', backgroundColor: 'rgba(200,148,58,0.12)' },
  filterText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '700' },
  filterTextActive: { color: colors.goldLight },
  trustBar: { marginHorizontal: 18, marginTop: 0, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cacheText: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 8, fontWeight: '800' },
  content: { flex: 1, minHeight: 0 },
  list: { paddingHorizontal: 18, paddingTop: 3, paddingBottom: 105 },
  emptyList: { flexGrow: 1 },
  separator: { height: 10 },
  resultsHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 9 },
  resultsTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19, fontWeight: '700' },
  resultsHint: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5 },
  centerState: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 42 },
  loaderHalo: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  stateTitle: { marginTop: 14, color: colors.text, textAlign: 'center', fontFamily: typography.serifSemibold, fontSize: 23, fontWeight: '700' },
  stateBody: { marginTop: 6, color: colors.textSecondary, textAlign: 'center', fontFamily: typography.sans, fontSize: 11.5, lineHeight: 17 },
  primaryButton: { minHeight: 47, marginTop: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, borderRadius: 16, backgroundColor: colors.goldLight },
  primaryButtonText: { color: colors.background, fontFamily: typography.sans, fontSize: 12, fontWeight: '900' },
  mapShell: { flex: 1, overflow: 'hidden', marginHorizontal: 18, marginBottom: 18, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(227,181,90,0.30)', backgroundColor: colors.surface },
  mapCount: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 13, backgroundColor: 'rgba(8,7,19,0.88)' },
  mapCountText: { color: colors.text, fontFamily: typography.sans, fontSize: 10, fontWeight: '800' },
  mapAttribution: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(8,7,19,0.88)' },
  mapAttributionText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, fontWeight: '400' },
  selectedCard: { position: 'absolute', left: 10, right: 10, bottom: 10 },
  addButton: { position: 'absolute', right: 22, bottom: 25, width: 108, height: 50, borderRadius: 25, padding: 3, backgroundColor: 'rgba(227,181,90,0.22)', shadowColor: '#000', shadowOpacity: 0.38, shadowRadius: 10, shadowOffset: { width: 0, height: 7 }, elevation: 9 },
  addButtonRaised: { bottom: 147 },
  addGradient: { flex: 1, flexDirection: 'row', gap: 6, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: colors.background, fontFamily: typography.sans, fontSize: 11, fontWeight: '900' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 14, backgroundColor: 'rgba(0,0,0,0.66)' },
  modalCard: { padding: 20, paddingBottom: 26, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(227,181,90,0.34)', backgroundColor: colors.backgroundSecondary },
  modalHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 18 },
  modalTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 27, fontWeight: '700' },
  modalBody: { marginTop: 3, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5 },
  cityInputBox: { height: 52, marginTop: 17, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cityInput: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 13 },
  disabled: { opacity: 0.42 },
  secondaryButton: { height: 43, marginTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryButtonText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: '800' },
  modalKeyboard: { flex: 1 },
});
