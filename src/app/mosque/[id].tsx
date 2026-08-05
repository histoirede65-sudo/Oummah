import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    type ImageSourcePropType,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MosquePrayerCountdown from '../../components/MosquePrayerCountdown';

import {
    formatGeoapifyOpeningHours,
    getMosqueEnrichment,
    type MosqueEnrichment,
} from '../../features/mosques/data/mosqueEnrichment';
import { getMosqueImageSource } from '../../features/mosques/data/mosqueImage';

import {
    isFavoriteMosque,
    isMainMosque,
    setMosqueFavorite,
    setMainMosque,
    type StoredMosque,
} from '../../features/mosques/data/mosquePreferences';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const USER_MOSQUE_IMAGES: Record<string, ImageSourcePropType> = {
  'mosque-a-00': require('../../assets/images/mosques/mosque-a-00.jpg'),
  'mosque-a-01': require('../../assets/images/mosques/mosque-a-01.jpg'),
  'mosque-a-02': require('../../assets/images/mosques/mosque-a-02.jpg'),
  'mosque-a-03': require('../../assets/images/mosques/mosque-a-03.jpg'),
  'mosque-a-04': require('../../assets/images/mosques/mosque-a-04.jpg'),
  'mosque-a-05': require('../../assets/images/mosques/mosque-a-05.jpg'),
  'mosque-a-06': require('../../assets/images/mosques/mosque-a-06.jpg'),
  'mosque-a-07': require('../../assets/images/mosques/mosque-a-07.jpg'),
  'mosque-a-08': require('../../assets/images/mosques/mosque-a-08.jpg'),
  'mosque-a-09': require('../../assets/images/mosques/mosque-a-09.jpg'),
  'mosque-a-10': require('../../assets/images/mosques/mosque-a-10.jpg'),
  'mosque-a-11': require('../../assets/images/mosques/mosque-a-11.jpg'),
  'mosque-b-00': require('../../assets/images/mosques/mosque-b-00.jpg'),
  'mosque-b-01': require('../../assets/images/mosques/mosque-b-01.jpg'),
  'mosque-b-02': require('../../assets/images/mosques/mosque-b-02.jpg'),
  'mosque-b-03': require('../../assets/images/mosques/mosque-b-03.jpg'),
  'mosque-b-04': require('../../assets/images/mosques/mosque-b-04.jpg'),
  'mosque-b-05': require('../../assets/images/mosques/mosque-b-05.jpg'),
  'mosque-b-06': require('../../assets/images/mosques/mosque-b-06.jpg'),
  'mosque-b-07': require('../../assets/images/mosques/mosque-b-07.jpg'),
  'mosque-b-08': require('../../assets/images/mosques/mosque-b-08.jpg'),
  'mosque-b-09': require('../../assets/images/mosques/mosque-b-09.jpg'),
  'mosque-b-10': require('../../assets/images/mosques/mosque-b-10.jpg'),
  'mosque-b-11': require('../../assets/images/mosques/mosque-b-11.jpg'),
  'mosque-coastal': require('../../assets/images/mosques/mosque-coastal.jpg'),
  'mosque-neighborhood': require('../../assets/images/mosques/mosque-neighborhood.jpg'),
  'mosque-c-00': require('../../assets/images/mosques/mosque-c-00.jpg'),
  'mosque-c-01': require('../../assets/images/mosques/mosque-c-01.jpg'),
  'mosque-c-02': require('../../assets/images/mosques/mosque-c-02.jpg'),
  'mosque-c-03': require('../../assets/images/mosques/mosque-c-03.jpg'),
  'mosque-c-04': require('../../assets/images/mosques/mosque-c-04.jpg'),
  'mosque-c-05': require('../../assets/images/mosques/mosque-c-05.jpg'),
  'mosque-c-06': require('../../assets/images/mosques/mosque-c-06.jpg'),
  'mosque-c-07': require('../../assets/images/mosques/mosque-c-07.jpg'),
  'mosque-c-08': require('../../assets/images/mosques/mosque-c-08.jpg'),
  'mosque-c-09': require('../../assets/images/mosques/mosque-c-09.jpg'),
  'mosque-c-10': require('../../assets/images/mosques/mosque-c-10.jpg'),
  'mosque-c-11': require('../../assets/images/mosques/mosque-c-11.jpg'),
  'mosque-d-00': require('../../assets/images/mosques/mosque-d-00.jpg'),
  'mosque-d-01': require('../../assets/images/mosques/mosque-d-01.jpg'),
  'mosque-d-02': require('../../assets/images/mosques/mosque-d-02.jpg'),
  'mosque-d-03': require('../../assets/images/mosques/mosque-d-03.jpg'),
  'mosque-d-04': require('../../assets/images/mosques/mosque-d-04.jpg'),
  'mosque-d-05': require('../../assets/images/mosques/mosque-d-05.jpg'),
  'mosque-d-06': require('../../assets/images/mosques/mosque-d-06.jpg'),
  'mosque-d-07': require('../../assets/images/mosques/mosque-d-07.jpg'),
  'mosque-d-08': require('../../assets/images/mosques/mosque-d-08.jpg'),
  'mosque-d-09': require('../../assets/images/mosques/mosque-d-09.jpg'),
  'mosque-d-10': require('../../assets/images/mosques/mosque-d-10.jpg'),
  'mosque-d-11': require('../../assets/images/mosques/mosque-d-11.jpg'),
};

const MOSQUE_HERO_FALLBACK = require('../../assets/images/mosques/mosque-hero-premium.jpg');

const MOSQUE_CARD_IMAGES: readonly ImageSourcePropType[] = [
  require('../../assets/images/mosques/mosque-neighborhood.jpg'),
  require('../../assets/images/mosques/mosque-coastal.jpg'),
  require('../../assets/images/mosques/mosque-a-00.jpg'),
  require('../../assets/images/mosques/mosque-a-01.jpg'),
  require('../../assets/images/mosques/mosque-a-02.jpg'),
  require('../../assets/images/mosques/mosque-a-03.jpg'),
  require('../../assets/images/mosques/mosque-a-04.jpg'),
  require('../../assets/images/mosques/mosque-a-05.jpg'),
  require('../../assets/images/mosques/mosque-a-06.jpg'),
  require('../../assets/images/mosques/mosque-a-07.jpg'),
  require('../../assets/images/mosques/mosque-a-08.jpg'),
  require('../../assets/images/mosques/mosque-a-09.jpg'),
  require('../../assets/images/mosques/mosque-a-10.jpg'),
  require('../../assets/images/mosques/mosque-a-11.jpg'),
  require('../../assets/images/mosques/mosque-b-00.jpg'),
  require('../../assets/images/mosques/mosque-b-01.jpg'),
  require('../../assets/images/mosques/mosque-b-02.jpg'),
  require('../../assets/images/mosques/mosque-b-03.jpg'),
  require('../../assets/images/mosques/mosque-b-04.jpg'),
  require('../../assets/images/mosques/mosque-b-05.jpg'),
  require('../../assets/images/mosques/mosque-b-06.jpg'),
  require('../../assets/images/mosques/mosque-b-07.jpg'),
  require('../../assets/images/mosques/mosque-b-08.jpg'),
  require('../../assets/images/mosques/mosque-b-09.jpg'),
  require('../../assets/images/mosques/mosque-b-10.jpg'),
  require('../../assets/images/mosques/mosque-b-11.jpg'),
  require('../../assets/images/mosques/mosque-c-00.jpg'),
  require('../../assets/images/mosques/mosque-c-01.jpg'),
  require('../../assets/images/mosques/mosque-c-02.jpg'),
  require('../../assets/images/mosques/mosque-c-03.jpg'),
  require('../../assets/images/mosques/mosque-c-04.jpg'),
  require('../../assets/images/mosques/mosque-c-05.jpg'),
  require('../../assets/images/mosques/mosque-c-06.jpg'),
  require('../../assets/images/mosques/mosque-c-07.jpg'),
  require('../../assets/images/mosques/mosque-c-08.jpg'),
  require('../../assets/images/mosques/mosque-c-09.jpg'),
  require('../../assets/images/mosques/mosque-c-10.jpg'),
  require('../../assets/images/mosques/mosque-c-11.jpg'),
  require('../../assets/images/mosques/mosque-d-00.jpg'),
  require('../../assets/images/mosques/mosque-d-01.jpg'),
  require('../../assets/images/mosques/mosque-d-02.jpg'),
  require('../../assets/images/mosques/mosque-d-03.jpg'),
  require('../../assets/images/mosques/mosque-d-04.jpg'),
  require('../../assets/images/mosques/mosque-d-05.jpg'),
  require('../../assets/images/mosques/mosque-d-06.jpg'),
  require('../../assets/images/mosques/mosque-d-07.jpg'),
  require('../../assets/images/mosques/mosque-d-08.jpg'),
  require('../../assets/images/mosques/mosque-d-09.jpg'),
  require('../../assets/images/mosques/mosque-d-10.jpg'),
  require('../../assets/images/mosques/mosque-d-11.jpg'),
];



function getMosqueImage(mosqueId: string) {
  let hash = 2_166_136_261;

  for (const character of mosqueId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }

  return MOSQUE_CARD_IMAGES[(hash >>> 0) % MOSQUE_CARD_IMAGES.length] ?? MOSQUE_HERO_FALLBACK;
}

function getSingleParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getOptionalValue(
  value: string | string[] | undefined,
): string | undefined {
  const singleValue = getSingleParam(value);

  if (!singleValue || singleValue === 'undefined') return undefined;

  return singleValue;
}


function parseFeatureState(
  value: string | string[] | undefined,
): StoredMosque['wheelchair'] {
  const resolved = getSingleParam(value);

  if (
    resolved === 'yes' ||
    resolved === 'no' ||
    resolved === 'limited' ||
    resolved === 'unknown'
  ) {
    return resolved;
  }

  return undefined;
}

function mergeAccessibilityState(
  osmState: StoredMosque['wheelchair'],
  enrichedState: boolean | undefined,
): StoredMosque['wheelchair'] {
  if (osmState && osmState !== 'unknown') {
    return osmState;
  }

  if (typeof enrichedState !== 'boolean') {
    return osmState;
  }

  return enrichedState ? 'yes' : 'no';
}

function parseLanguages(
  value: string | string[] | undefined,
): string[] | undefined {
  const resolved = getSingleParam(value);

  if (!resolved) return undefined;

  try {
    const parsed: unknown = JSON.parse(resolved);

    if (!Array.isArray(parsed)) return undefined;

    const languages = parsed.filter(
      (item): item is string =>
        typeof item === 'string',
    );

    return languages.length > 0
      ? languages
      : undefined;
  } catch {
    const languages = resolved
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return languages.length > 0
      ? languages
      : undefined;
  }
}

function getFeaturePresentation(
  state: StoredMosque['wheelchair'],
) {
  switch (state) {
    case 'yes':
      return {
        label: 'Disponible',
        icon: 'checkmark-circle' as const,
        color: '#87D5A2',
      };

    case 'limited':
      return {
        label: 'Partiel',
        icon: 'alert-circle' as const,
        color: colors.goldLight,
      };

    case 'no':
      return {
        label: 'Non disponible',
        icon: 'close-circle' as const,
        color: '#D78484',
      };

    default:
      return {
        label: 'Non renseigné',
        icon: 'help-circle-outline' as const,
        color: colors.textMuted,
      };
  }
}

function formatCheckedDate(value?: string) {
  if (!value) return 'date inconnue';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'date inconnue';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

async function openExternalUrl(url: string, errorMessage: string) {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert('Action indisponible', errorMessage);
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert('Action indisponible', errorMessage);
  }
}

export default function MosqueDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
    distance?: string;
    phone?: string;
    website?: string;
    openingHours?: string;
    alternativeName?: string;
    arabicName?: string;
    email?: string;
    operator?: string;
    denomination?: string;
    wheelchair?: string;
    womenSpace?: string;
    ablutions?: string;
    parking?: string;
    toilets?: string;
    languages?: string;
    serviceTimes?: string;
    source?: string;
    sourceUrl?: string;
    lastCheckedAt?: string;
    imageKey?: string;
  }>();

  const [favorite, setFavorite] = useState(false);
  const [mainMosque, setIsMainMosque] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [savingMainMosque, setSavingMainMosque] = useState(false);
  const [enrichment, setEnrichment] = useState<MosqueEnrichment | null>(null);

  const mosqueId = getSingleParam(params.id);
  const mosqueName = getSingleParam(params.name);
  const mosqueAddress = getSingleParam(params.address);
  const mosqueLatitudeValue = getSingleParam(params.latitude);
  const mosqueLongitudeValue = getSingleParam(params.longitude);
  const mosqueDistance = getOptionalValue(params.distance);
  const mosquePhone = getOptionalValue(params.phone);
  const mosqueWebsite = getOptionalValue(params.website);
  const mosqueOpeningHours = getOptionalValue(params.openingHours);
  const mosqueAlternativeName = getOptionalValue(params.alternativeName);
  const mosqueArabicName = getOptionalValue(params.arabicName);
  const mosqueEmail = getOptionalValue(params.email);
  const mosqueOperator = getOptionalValue(params.operator);
  const mosqueDenomination = getOptionalValue(params.denomination);
  const mosqueWheelchair = parseFeatureState(params.wheelchair);
  const mosqueWomenSpace = parseFeatureState(params.womenSpace);
  const mosqueAblutions = parseFeatureState(params.ablutions);
  const mosqueParking = parseFeatureState(params.parking);
  const mosqueToilets = parseFeatureState(params.toilets);
  const mosqueLanguages = parseLanguages(params.languages);
  const mosqueServiceTimes = getOptionalValue(params.serviceTimes);
  const mosqueSource = getOptionalValue(params.source);
  const mosqueSourceUrl = getOptionalValue(params.sourceUrl);
  const mosqueLastCheckedAt = getOptionalValue(params.lastCheckedAt);
  const mosqueImageKey = getOptionalValue(params.imageKey);

  const mosque = useMemo<StoredMosque | null>(() => {
    const latitude = Number(mosqueLatitudeValue);
    const longitude = Number(mosqueLongitudeValue);

    if (
      !mosqueId ||
      !mosqueName ||
      !mosqueAddress ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return {
      id: mosqueId,
      name: mosqueName,
      address: mosqueAddress,
      latitude,
      longitude,
      distanceLabel: mosqueDistance,
      phone: mosquePhone,
      website: mosqueWebsite,
      openingHours: mosqueOpeningHours,
      alternativeName: mosqueAlternativeName,
      arabicName: mosqueArabicName,
      email: mosqueEmail,
      operator: mosqueOperator,
      denomination: mosqueDenomination,
      wheelchair: mosqueWheelchair,
      womenSpace: mosqueWomenSpace,
      ablutions: mosqueAblutions,
      parking: mosqueParking,
      toilets: mosqueToilets,
      languages: mosqueLanguages,
      serviceTimes: mosqueServiceTimes,
      source:
        mosqueSource === 'openstreetmap' || mosqueSource === 'user'
          ? mosqueSource
          : undefined,
      imageKey: mosqueImageKey,
      sourceUrl: mosqueSourceUrl,
      lastCheckedAt: mosqueLastCheckedAt,
    };
  }, [
    mosqueAddress,
    mosqueDistance,
    mosqueId,
    mosqueLatitudeValue,
    mosqueLongitudeValue,
    mosqueName,
    mosqueOpeningHours,
    mosquePhone,
    mosqueWebsite,
    mosqueAlternativeName,
    mosqueArabicName,
    mosqueEmail,
    mosqueOperator,
    mosqueDenomination,
    mosqueWheelchair,
    mosqueWomenSpace,
    mosqueAblutions,
    mosqueParking,
    mosqueToilets,
    mosqueLanguages,
    mosqueServiceTimes,
    mosqueSource,
    mosqueSourceUrl,
    mosqueLastCheckedAt,
    mosqueImageKey,
  ]);

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      if (!mosqueId) {
        if (active) {
          setLoadingPreferences(false);
        }
        return;
      }

      setLoadingPreferences(true);

      try {
        const [favoriteValue, mainMosqueValue] = await Promise.all([
          isFavoriteMosque(mosqueId),
          isMainMosque(mosqueId),
        ]);

        if (!active) return;

        setFavorite(favoriteValue);
        setIsMainMosque(mainMosqueValue);
      } catch {
        if (!active) return;

        setFavorite(false);
        setIsMainMosque(false);
      } finally {
        if (active) {
          setLoadingPreferences(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      active = false;
    };
  }, [mosqueId]);

  useEffect(() => {
    let active = true;

    const loadEnrichment = async () => {
      if (!mosque) return;

      try {
        const result = await getMosqueEnrichment({
          osmId: mosque.id,
          name: mosque.name,
          address: mosque.address,
          latitude: mosque.latitude,
          longitude: mosque.longitude,
        });

        if (!active) return;

        setEnrichment(result);
      } catch {
        // Les données d’enrichissement sont facultatives.
      }
    };

    void loadEnrichment();

    return () => {
      active = false;
    };
  }, [mosque]);

  const geoapifyOpeningHours =
    formatGeoapifyOpeningHours(enrichment);

  if (!mosque) {
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

          <Text style={styles.headerTitle}>Mosquée</Text>

          <View style={styles.headerButtonPlaceholder} />
        </View>

        <View style={styles.invalidState}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={colors.goldLight}
          />
          <Text style={styles.invalidTitle}>
            Fiche indisponible
          </Text>
          <Text style={styles.invalidText}>
            Les informations de cette mosquée sont incomplètes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayedMosque: StoredMosque = {
    ...mosque,
    address:
      enrichment?.formattedAddress || mosque.address,
    phone: enrichment?.phone || mosque.phone,
    website: enrichment?.website || mosque.website,
    openingHours:
      geoapifyOpeningHours || mosque.openingHours,
    wheelchair: mergeAccessibilityState(
      mosque.wheelchair,
      enrichment?.accessibility?.wheelchair,
    ),
    parking: mergeAccessibilityState(
      mosque.parking,
      enrichment?.accessibility?.parking,
    ),
    toilets: mergeAccessibilityState(
      mosque.toilets,
      enrichment?.accessibility?.toilets,
    ),
  };

  const openDirections = () => {
    const destination = `${displayedMosque.latitude},${displayedMosque.longitude}`;
    const url =
      `https://www.google.com/maps/dir/?api=1&destination=` +
      encodeURIComponent(destination);

    void openExternalUrl(
      url,
      'Aucune application compatible ne peut ouvrir cet itinéraire.',
    );
  };

  const callMosque = () => {
    if (!displayedMosque.phone) return;

    const sanitizedPhone = displayedMosque.phone.replace(/[^\d+]/g, '');

    void openExternalUrl(
      `tel:${sanitizedPhone}`,
      'Impossible de lancer cet appel.',
    );
  };

  const openWebsite = () => {
    if (!displayedMosque.website) return;

    const normalizedWebsite = /^https?:\/\//i.test(displayedMosque.website)
      ? displayedMosque.website
      : `https://${displayedMosque.website}`;

    void openExternalUrl(
      normalizedWebsite,
      'Impossible d’ouvrir ce site internet.',
    );
  };

  const openSource = async () => {
    if (!mosque?.sourceUrl) return;

    try {
      await Linking.openURL(mosque.sourceUrl);
    } catch {
      Alert.alert(
        'Source indisponible',
        'Impossible d’ouvrir la source des informations.',
      );
    }
  };

  const toggleFavorite = async () => {
    if (savingFavorite) return;

    const previousValue = favorite;
    const nextValue = !previousValue;

    setSavingFavorite(true);
    setFavorite(nextValue);

    try {
      await setMosqueFavorite(displayedMosque, nextValue);
    } catch {
      setFavorite(previousValue);
      Alert.alert(
        'Enregistrement impossible',
        previousValue
          ? 'La mosquée n’a pas pu être retirée des favoris.'
          : 'La mosquée n’a pas pu être ajoutée aux favoris.',
      );
    } finally {
      setSavingFavorite(false);
    }
  };

  const chooseMainMosque = async () => {
    if (savingMainMosque || mainMosque) return;

    setSavingMainMosque(true);

    try {
      await setMainMosque(displayedMosque);
      setIsMainMosque(true);

      Alert.alert(
        'Ma mosquée',
        `${displayedMosque.name} est maintenant votre mosquée principale.`,
      );
    } catch {
      Alert.alert(
        'Enregistrement impossible',
        'Votre mosquée principale n’a pas pu être enregistrée.',
      );
    } finally {
      setSavingMainMosque(false);
    }
  };

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

        <Text numberOfLines={1} style={styles.headerTitle}>
          Fiche mosquée
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            favorite
              ? 'Retirer des favoris'
              : 'Ajouter aux favoris'
          }
          accessibilityState={{
            disabled: loadingPreferences || savingFavorite,
            selected: favorite,
          }}
          disabled={loadingPreferences || savingFavorite}
          onPress={() => void toggleFavorite()}
          style={styles.headerButton}
        >
          {savingFavorite ? (
            <ActivityIndicator
              size="small"
              color={colors.goldLight}
            />
          ) : (
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={23}
              color={colors.goldLight}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        alwaysBounceVertical={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.content}>
        <View style={styles.hero}>
          <Image
            source={getMosqueImageSource(displayedMosque.id, displayedMosque.imageKey)}
            resizeMode="cover"
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['rgba(12,8,20,0.32)', 'rgba(12,8,20,0.88)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.mosqueName}>{displayedMosque.name}</Text>

          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={17}
              color={colors.goldLight}
            />
            <Text style={styles.address}>{displayedMosque.address}</Text>
          </View>

          {displayedMosque.distanceLabel ? (
            <View style={styles.distanceBadge}>
              <Ionicons
                name="walk-outline"
                size={15}
                color={colors.background}
              />
              <Text style={styles.distanceText}>
                {displayedMosque.distanceLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <MosquePrayerCountdown
          latitude={displayedMosque.latitude}
          longitude={displayedMosque.longitude}
        />

        <View style={styles.actionsGrid}>
          <Pressable
            onPress={openDirections}
            style={({ pressed }) => [
              styles.primaryAction,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="navigate"
                size={22}
                color={colors.background}
              />
            </View>
            <Text style={styles.primaryActionLabel}>
              Itinéraire
            </Text>
          </Pressable>

          <Pressable
            disabled={!displayedMosque.phone}
            onPress={callMosque}
            style={({ pressed }) => [
              styles.secondaryAction,
              !displayedMosque.phone && styles.disabledAction,
              pressed && displayedMosque.phone && styles.pressed,
            ]}
          >
            <Ionicons
              name="call-outline"
              size={22}
              color={colors.goldLight}
            />
            <Text style={styles.secondaryActionLabel}>
              Téléphone
            </Text>
          </Pressable>

          <Pressable
            disabled={!displayedMosque.website}
            onPress={openWebsite}
            style={({ pressed }) => [
              styles.secondaryAction,
              !displayedMosque.website && styles.disabledAction,
              pressed && displayedMosque.website && styles.pressed,
            ]}
          >
            <Ionicons
              name="globe-outline"
              size={22}
              color={colors.goldLight}
            />
            <Text style={styles.secondaryActionLabel}>Site</Text>
          </Pressable>
        </View>

        <Pressable
          disabled={mainMosque || savingMainMosque}
          onPress={() => void chooseMainMosque()}
          style={({ pressed }) => [
            styles.mainMosqueCard,
            mainMosque && styles.mainMosqueCardActive,
            pressed && !mainMosque && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.mainMosqueIcon,
              mainMosque && styles.mainMosqueIconActive,
            ]}
          >
            {savingMainMosque ? (
              <ActivityIndicator
                size="small"
                color={colors.goldLight}
              />
            ) : (
              <Ionicons
                name={mainMosque ? 'checkmark' : 'home-outline'}
                size={23}
                color={
                  mainMosque
                    ? colors.background
                    : colors.goldLight
                }
              />
            )}
          </View>

          <View style={styles.mainMosqueCopy}>
            <Text style={styles.sectionEyebrow}>MA MOSQUÉE</Text>
            <Text style={styles.mainMosqueTitle}>
              {mainMosque
                ? 'Votre mosquée principale'
                : 'Définir comme ma mosquée'}
            </Text>
            <Text style={styles.mainMosqueText}>
              {mainMosque
                ? 'OUMMAH utilisera cette mosquée pour vos informations personnalisées.'
                : 'Retrouvez plus tard ses horaires et ses événements directement sur l’accueil.'}
            </Text>
          </View>

          {!mainMosque ? (
            <Ionicons
              name="chevron-forward"
              size={21}
              color={colors.goldLight}
            />
          ) : null}
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>Adresse</Text>
                <Text style={styles.infoValue}>
                  {displayedMosque.address}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>
                  Horaires d’ouverture
                </Text>
                <Text style={styles.infoValue}>
                  {displayedMosque.openingHours ||
                    'Non renseignés pour le moment'}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>
                  {displayedMosque.phone || 'Non renseigné'}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.infoCopy}>
                <Text style={styles.infoLabel}>Site internet</Text>
                <Text numberOfLines={2} style={styles.infoValue}>
                  {displayedMosque.website || 'Non renseigné'}
                </Text>
              </View>
            </View>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>

          <View style={styles.servicesCard}>
            <Text style={styles.servicesTitle}>
              Informations communautaires à venir
            </Text>
            <Text style={styles.servicesText}>
              Salle pour les femmes, accès PMR, ablutions,
              parking, cours et accueil des enfants seront ajoutés
              lorsque ces informations pourront être vérifiées.
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoSectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                INFORMATIONS
              </Text>
              <Text style={styles.infoSectionTitle}>
                Services et accueil
              </Text>
            </View>

            <View style={styles.sourceBadge}>
              <Ionicons
                name="map-outline"
                size={13}
                color={colors.goldLight}
              />
              <Text style={styles.sourceBadgeText}>
                OpenStreetMap
              </Text>
            </View>
          </View>

          {mosque.alternativeName ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="text-outline"
                  size={19}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>
                  Autre nom
                </Text>
                <Text style={styles.detailValue}>
                  {mosque.alternativeName}
                </Text>
              </View>
            </View>
          ) : null}

          {mosque.arabicName ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="language-outline"
                  size={19}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>
                  Nom en arabe
                </Text>
                <Text style={styles.detailValueArabic}>
                  {mosque.arabicName}
                </Text>
              </View>
            </View>
          ) : null}

          {mosque.operator ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="people-outline"
                  size={19}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>
                  Association ou gestionnaire
                </Text>
                <Text style={styles.detailValue}>
                  {mosque.operator}
                </Text>
              </View>
            </View>
          ) : null}

          {mosque.denomination ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>
                  Courant renseigné
                </Text>
                <Text style={styles.detailValue}>
                  {mosque.denomination}
                </Text>
              </View>
            </View>
          ) : null}

          {mosque.email ? (
            <Pressable
              onPress={() =>
                void Linking.openURL(`mailto:${mosque.email}`)
              }
              style={({ pressed }) => [
                styles.detailRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.detailIcon}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>
                  Email
                </Text>
                <Text style={styles.detailLink}>
                  {mosque.email}
                </Text>
              </View>

              <Ionicons
                name="open-outline"
                size={18}
                color={colors.goldLight}
              />
            </Pressable>
          ) : null}

          {mosque.languages &&
          mosque.languages.length > 0 ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={19}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>
                  Langues renseignées
                </Text>
                <View style={styles.languageList}>
                  {mosque.languages.map((language) => (
                    <View
                      key={language}
                      style={styles.languageChip}
                    >
                      <Text style={styles.languageChipText}>
                        {language}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {mosque.serviceTimes ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="time-outline"
                  size={19}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.detailCopy}>
                <Text style={styles.detailLabel}>
                  Horaires de services renseignés
                </Text>
                <Text style={styles.detailValue}>
                  {mosque.serviceTimes}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.featureGrid}>
            {[
              {
                label: 'Accès PMR',
                icon: 'accessibility-outline' as const,
                state: displayedMosque.wheelchair,
              },
              {
                label: 'Espace femmes',
                icon: 'female-outline' as const,
                state: mosque.womenSpace,
              },
              {
                label: 'Ablutions',
                icon: 'water-outline' as const,
                state: mosque.ablutions,
              },
              {
                label: 'Parking',
                icon: 'car-outline' as const,
                state: displayedMosque.parking,
              },
              {
                label: 'Toilettes',
                icon: 'male-female-outline' as const,
                state: displayedMosque.toilets,
              },
            ].map((feature) => {
              const presentation =
                getFeaturePresentation(feature.state);

              return (
                <View
                  key={feature.label}
                  style={styles.featureCard}
                >
                  <Ionicons
                    name={feature.icon}
                    size={21}
                    color={colors.goldLight}
                  />
                  <Text style={styles.featureLabel}>
                    {feature.label}
                  </Text>
                  <View style={styles.featureStateRow}>
                    <Ionicons
                      name={presentation.icon}
                      size={14}
                      color={presentation.color}
                    />
                    <Text
                      style={[
                        styles.featureState,
                        { color: presentation.color },
                      ]}
                    >
                      {presentation.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Signaler un problème sur cette mosquée"
            onPress={() =>
              router.push({
                pathname: "/mosque/report",
                params: {
                  mosqueId: displayedMosque.id,
                  mosqueName: displayedMosque.name,
                  mosqueAddress: displayedMosque.address,
                  latitude: String(displayedMosque.latitude),
                  longitude: String(displayedMosque.longitude),
                },
              })
            }
            style={({ pressed }) => [
              styles.reportCard,
              pressed && styles.reportCardPressed,
            ]}
          >
            <View style={styles.reportIcon}>
              <Ionicons name="flag-outline" size={21} color="#F28B82" />
            </View>
            <View style={styles.reportCopy}>
              <Text style={styles.reportTitle}>Signaler un problème</Text>
              <Text style={styles.reportText}>
                Adresse, horaires, fermeture, doublon ou autre erreur
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            disabled={!mosque.sourceUrl}
            onPress={() => void openSource()}
            style={({ pressed }) => [
              styles.sourceCard,
              !mosque.sourceUrl &&
                styles.sourceCardDisabled,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.sourceIcon}>
              <Ionicons
                name="document-text-outline"
                size={21}
                color={colors.goldLight}
              />
            </View>

            <View style={styles.sourceCopy}>
              <Text style={styles.sourceTitle}>
                Source des informations
              </Text>
              <Text style={styles.sourceText}>
                OpenStreetMap · vérifié le{' '}
                {formatCheckedDate(
                  mosque.lastCheckedAt,
                )}
              </Text>
            </View>

            {mosque.sourceUrl ? (
              <Ionicons
                name="open-outline"
                size={18}
                color={colors.goldLight}
              />
            ) : null}
          </Pressable>
        </View>

        <View style={styles.dataNotice}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={colors.goldLight}
          />
          <Text style={styles.dataNoticeText}>
            Les informations disponibles proviennent des données
            publiques de la mosquée et peuvent être incomplètes.
          </Text>
        </View>
        </View>
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
  headerButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 23,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 55,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    paddingHorizontal: 14,
    paddingTop: 18,
    alignSelf: 'center',
  },
  hero: {
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 27,
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.34)',
    backgroundColor: colors.surfaceAlt,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  mosqueName: {
    marginTop: 0,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 27,
    lineHeight: 33,
    textAlign: 'center',
  },
  locationRow: {
    maxWidth: 350,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  address: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  distanceBadge: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 13,
    backgroundColor: colors.goldLight,
  },
  distanceText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  actionsGrid: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 9,
  },
  primaryAction: {
    flex: 1.25,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.goldLight,
  },
  actionIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(38,24,50,0.11)',
  },
  primaryActionLabel: {
    marginTop: 7,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryAction: {
    flex: 1,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  secondaryActionLabel: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
  },
  disabledAction: {
    opacity: 0.38,
  },
  mainMosqueCard: {
    minHeight: 118,
    marginTop: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  mainMosqueCardActive: {
    borderColor: 'rgba(224,188,112,0.48)',
  },
  mainMosqueIcon: {
    width: 51,
    height: 51,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: 'rgba(126,72,148,0.20)',
  },
  mainMosqueIconActive: {
    backgroundColor: colors.goldLight,
  },
  mainMosqueCopy: {
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
  mainMosqueTitle: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 19,
    lineHeight: 24,
  },
  mainMosqueText: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 11,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 24,
  },
  infoCard: {
    overflow: 'hidden',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  infoRow: {
    minHeight: 80,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(126,72,148,0.19)',
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  infoLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  infoValue: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 69,
    backgroundColor: colors.borderSoft,
  },
  servicesCard: {
    padding: 18,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
  },
  servicesTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  servicesText: {
    marginTop: 7,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 20,
  },
  infoSection: {
    marginTop: 16,
  },
  infoSectionHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoSectionTitle: {
    marginTop: 3,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 23,
  },
  sourceBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 11,
    backgroundColor: 'rgba(224,188,112,0.08)',
  },
  sourceBadgeText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '600',
  },
  detailRow: {
    minHeight: 72,
    marginBottom: 9,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  detailIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(126,72,148,0.18)',
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },
  detailLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  detailValue: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  detailValueArabic: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 17,
    textAlign: 'left',
  },
  detailLink: {
    marginTop: 4,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 13,
  },
  languageList: {
    marginTop: 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  languageChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(224,188,112,0.08)',
  },
  languageChipText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '600',
  },
  featureGrid: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureCard: {
    width: '48.5%',
    minHeight: 104,
    padding: 12,
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  featureLabel: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: '600',
  },
  featureStateRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featureState: {
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: '600',
  },
  reportCard: {
    minHeight: 78,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(242,139,130,0.26)",
    backgroundColor: "rgba(242,139,130,0.05)",
    flexDirection: "row",
    alignItems: "center",
  },
  reportCardPressed: { opacity: 0.76 },
  reportIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(242,139,130,0.10)",
  },
  reportCopy: { flex: 1, marginHorizontal: 12 },
  reportTitle: { color: "#F28B82", fontSize: 13, fontWeight: "800" },
  reportText: { marginTop: 4, color: colors.textMuted, fontSize: 10.5, lineHeight: 15 },
  sourceCard: {
    minHeight: 76,
    marginTop: 10,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.30)',
    backgroundColor: 'rgba(224,188,112,0.05)',
  },
  sourceCardDisabled: {
    opacity: 0.72,
  },
  sourceIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(126,72,148,0.18)',
  },
  sourceCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },
  sourceTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12.5,
    fontWeight: '700',
  },
  sourceText: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 15,
  },
  dataNotice: {
    marginTop: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderRadius: 17,
    backgroundColor: 'rgba(224,188,112,0.06)',
  },
  dataNoticeText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 17,
  },
  invalidState: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invalidTitle: {
    marginTop: 15,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 23,
  },
  invalidText: {
    marginTop: 7,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 13,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
