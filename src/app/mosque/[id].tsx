import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MosquePrayerCountdown from '../../components/MosquePrayerCountdown';
import MosqueTimesProposalSheet from '../../components/mosques/MosqueTimesProposalSheet';
import MosqueTimesSection from '../../components/mosques/MosqueTimesSection';
import MosquePostsSection from '../../components/mosques/MosquePostsSection';
import MosqueRemindersSection from '../../components/mosques/MosqueRemindersSection';

import {
    formatGeoapifyOpeningHours,
    getMosqueEnrichment,
    type MosqueEnrichment,
} from '../../features/mosques/data/mosqueEnrichment';
import { getMosqueImageSource } from '../../features/mosques/data/mosqueImage';

import {
    clearMainMosque,
    isFavoriteMosque,
    isMainMosque,
    setMosqueFavorite,
    setMainMosque,
    type StoredMosque,
} from '../../features/mosques/data/mosquePreferences';
import { resolveMosqueId } from '../../features/mosques/data/mosqueIdentity';
import {
  getApprovedMosquePrayerTimes,
  applyApprovedMosquePrayerTimes,
  getMosqueSpecialTimes,
  type MosquePrayerTimes,
  type MosqueSpecialTimes,
} from '../../features/mosques/data/mosquePrayerUpdates';
import {
  getMosquePrayerSchedule,
  loadPrayerCalculationSettings,
  type MosquePrayerSchedule,
} from '../../features/mosques/data/mosquePrayerTimes';
import { useI18n, type LanguageCode, type TranslationKey } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

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

type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

function getFeaturePresentation(
  state: StoredMosque['wheelchair'],
  t: Translate,
) {
  switch (state) {
    case 'yes':
      return {
        label: t('mosque.featureYes'),
        icon: 'checkmark-circle' as const,
        color: '#87D5A2',
      };

    case 'limited':
      return {
        label: t('mosque.featurePartial'),
        icon: 'alert-circle' as const,
        color: colors.goldLight,
      };

    case 'no':
      return {
        label: t('mosque.featureNo'),
        icon: 'close-circle' as const,
        color: '#D78484',
      };

    default:
      return {
        label: t('mosque.featureUnknown'),
        icon: 'help-circle-outline' as const,
        color: colors.textMuted,
      };
  }
}

function formatCheckedDate(value: string | undefined, language: LanguageCode) {
  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

async function openExternalUrl(url: string, title: string, errorMessage: string) {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert(title, errorMessage);
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert(title, errorMessage);
  }
}


export default function MosqueDetailScreen() {
  const { language, t } = useI18n();
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
  const [prayerTimes, setPrayerTimes] = useState<MosquePrayerTimes | null>(null);
  const [prayerSchedule, setPrayerSchedule] = useState<MosquePrayerSchedule | null>(null);
  const [specialTimes, setSpecialTimes] = useState<MosqueSpecialTimes[]>([]);
  const [prayerModalVisible, setPrayerModalVisible] = useState(false);

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

  // Registers this source id under the mosque's single OUMMAH identity, so times proposed or
  // approved from any source (OSM, Google, user) apply to the same mosque.
  useEffect(() => {
    if (mosque) void resolveMosqueId(mosque);
  }, [mosque]);

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
    const loadSchedule = async () => {
      if (!mosque) return;
      const [settings, approved] = await Promise.all([
        loadPrayerCalculationSettings(),
        getApprovedMosquePrayerTimes(mosque.id).catch(() => null),
      ]);
      const schedule = await getMosquePrayerSchedule(mosque.latitude, mosque.longitude, undefined, settings).catch(() => null);
      if (active && schedule) {
        setPrayerSchedule(
          settings.scheduleSource === 'mosque'
            ? applyApprovedMosquePrayerTimes(schedule, approved)
            : schedule,
        );
      }
    };
    void loadSchedule();
    return () => { active = false; };
  }, [mosque]);

  useEffect(() => {
    let active = true;
    if (!mosqueId) return () => { active = false; };
    void getApprovedMosquePrayerTimes(mosqueId)
      .then((value) => { if (active) setPrayerTimes(value); })
      .catch(() => undefined);
    void getMosqueSpecialTimes(mosqueId).then((value) => { if (active) setSpecialTimes(value); });
    return () => { active = false; };
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
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={colors.goldLight}
            />
          </Pressable>

          <Text style={styles.headerTitle}>{t('mosque.headerShort')}</Text>

          <View style={styles.headerButtonPlaceholder} />
        </View>

        <View style={styles.invalidState}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={colors.goldLight}
          />
          <Text style={styles.invalidTitle}>{t('mosque.unavailableTitle')}</Text>
          <Text style={styles.invalidText}>{t('mosque.unavailableText')}</Text>
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

  const sourceName =
    mosque.source === 'user'
      ? t('mosque.sourceCommunity')
      : mosque.source === 'openstreetmap'
        ? 'OpenStreetMap'
        : t('mosque.sourcePublic');
  const checkedDate = formatCheckedDate(mosque.lastCheckedAt, language);

  const openDirections = () => {
    const destination = `${displayedMosque.latitude},${displayedMosque.longitude}`;
    const url =
      `https://www.google.com/maps/dir/?api=1&destination=` +
      encodeURIComponent(destination);

    void openExternalUrl(url, t('mosque.actionUnavailable'), t('mosque.directionsError'));
  };

  const callMosque = () => {
    if (!displayedMosque.phone) return;

    const sanitizedPhone = displayedMosque.phone.replace(/[^\d+]/g, '');

    void openExternalUrl(`tel:${sanitizedPhone}`, t('mosque.actionUnavailable'), t('mosque.callError'));
  };

  const openWebsite = () => {
    if (!displayedMosque.website) return;

    const normalizedWebsite = /^https?:\/\//i.test(displayedMosque.website)
      ? displayedMosque.website
      : `https://${displayedMosque.website}`;

    void openExternalUrl(normalizedWebsite, t('mosque.actionUnavailable'), t('mosque.websiteError'));
  };

  const openSource = async () => {
    if (!mosque?.sourceUrl) return;

    try {
      await Linking.openURL(mosque.sourceUrl);
    } catch {
      Alert.alert(t('mosque.sourceUnavailableTitle'), t('mosque.sourceUnavailableMessage'));
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
        t('mosque.saveFailedTitle'),
        previousValue ? t('mosque.favoriteRemoveError') : t('mosque.favoriteAddError'),
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
        t('mosques.myMosque'),
        t('mosque.mainSaved', { name: displayedMosque.name }),
      );
    } catch {
      Alert.alert(t('mosque.saveFailedTitle'), t('mosque.mainSaveError'));
    } finally {
      setSavingMainMosque(false);
    }
  };

  const removeMainMosque = () => {
    if (savingMainMosque || !mainMosque) return;

    Alert.alert(
      t('mosques.removeMainTitle'),
      t('mosques.removeMainMessage', { name: displayedMosque.name }),
      [
        { text: t('mosques.cancel'), style: 'cancel' },
        {
          text: t('mosques.remove'),
          style: 'destructive',
          onPress: () => {
            setSavingMainMosque(true);
            void clearMainMosque()
              .then(() => setIsMainMosque(false))
              .catch(() =>
                Alert.alert(t('mosques.removeMainErrorTitle'), t('mosques.removeMainErrorMessage')),
              )
              .finally(() => setSavingMainMosque(false));
          },
        },
      ],
    );
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
          {t('mosque.headerTitle')}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            favorite
              ? t('mosques.removeFavorite')
              : t('mosques.addFavorite')
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
          <Text style={styles.illustrationLabel}>{t('mosques.illustration')}</Text>
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
          mosqueId={displayedMosque.id}
        />

        <MosqueTimesSection
          schedule={prayerSchedule}
          approved={prayerTimes}
          special={specialTimes}
          onPropose={() => setPrayerModalVisible(true)}
        />

        <MosquePostsSection mosque={{ id: displayedMosque.id, name: displayedMosque.name }} />

        <MosqueRemindersSection
          mosque={{
            id: displayedMosque.id,
            name: displayedMosque.name,
            address: displayedMosque.address,
            latitude: displayedMosque.latitude,
            longitude: displayedMosque.longitude,
          }}
          hasJumuahTime={Boolean(prayerTimes?.jumuahTimes?.length)}
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
            <Text style={styles.primaryActionLabel}>{t('mosque.directions')}</Text>
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
            <Text style={styles.secondaryActionLabel}>{t('mosque.phone')}</Text>
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
            <Text style={styles.secondaryActionLabel}>{t('mosque.site')}</Text>
          </Pressable>
        </View>

        <Pressable
          disabled={savingMainMosque}
          onPress={() => (mainMosque ? removeMainMosque() : void chooseMainMosque())}
          style={({ pressed }) => [
            styles.mainMosqueCard,
            !mainMosque && styles.mainMosqueCardCta,
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
            <Text style={styles.sectionEyebrow}>{t('mosques.myMosqueEyebrow')}</Text>
            <Text style={styles.mainMosqueTitle}>
              {mainMosque ? t('mosque.mainActiveTitle') : t('mosque.mainChooseTitle')}
            </Text>
            <Text style={styles.mainMosqueText}>
              {mainMosque ? t('mosque.mainActiveText') : t('mosque.mainChooseText')}
            </Text>
          </View>

          {!mainMosque ? (
            <Ionicons
              name="chevron-forward"
              size={21}
              color={colors.goldLight}
            />
          ) : (
            <Ionicons name="close-circle-outline" size={21} color={colors.textMuted} />
          )}
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('mosque.information')}</Text>

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
                <Text style={styles.infoLabel}>{t('mosque.address')}</Text>
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
                <Text style={styles.infoLabel}>{t('mosque.openingHours')}</Text>
                <Text style={styles.infoValue}>
                  {displayedMosque.openingHours || t('mosque.notProvidedPlural')}
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
                <Text style={styles.infoLabel}>{t('mosque.phone')}</Text>
                <Text style={styles.infoValue}>
                  {displayedMosque.phone || t('mosque.notProvided')}
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
                <Text style={styles.infoLabel}>{t('mosque.website')}</Text>
                <Text numberOfLines={2} style={styles.infoValue}>
                  {displayedMosque.website || t('mosque.notProvided')}
                </Text>
              </View>
            </View>
          </View>
        </View>


        <View style={styles.infoSection}>
          <View style={styles.infoSectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>{t('mosque.informationEyebrow')}</Text>
              <Text style={styles.infoSectionTitle}>{t('mosque.servicesTitle')}</Text>
            </View>

            <View style={styles.sourceBadge}>
              <Ionicons
                name={mosque.source === 'user' ? 'people-outline' : 'map-outline'}
                size={13}
                color={colors.goldLight}
              />
              <Text style={styles.sourceBadgeText}>{sourceName}</Text>
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
                  {t('mosque.otherName')}
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
                  {t('mosque.arabicName')}
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
                  {t('mosque.operator')}
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
                  {t('mosque.denomination')}
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
                  {t('mosque.email')}
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
                  {t('mosque.languages')}
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
                  {t('mosque.serviceTimes')}
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
                id: 'wheelchair',
                label: t('mosque.wheelchair'),
                icon: 'accessibility-outline' as const,
                state: displayedMosque.wheelchair,
              },
              {
                id: 'women',
                label: t('mosque.womenSpace'),
                icon: 'female-outline' as const,
                state: mosque.womenSpace,
              },
              {
                id: 'ablutions',
                label: t('mosque.ablutions'),
                icon: 'water-outline' as const,
                state: mosque.ablutions,
              },
              {
                id: 'parking',
                label: t('mosque.parking'),
                icon: 'car-outline' as const,
                state: displayedMosque.parking,
              },
              {
                id: 'toilets',
                label: t('mosque.toilets'),
                icon: 'male-female-outline' as const,
                state: displayedMosque.toilets,
              },
            ].map((feature) => {
              const presentation =
                getFeaturePresentation(feature.state, t);

              return (
                <View
                  key={feature.id}
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
            accessibilityLabel={t('mosque.reportAccessibility')}
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
              <Text style={styles.reportTitle}>{t('mosque.reportTitle')}</Text>
              <Text style={styles.reportText}>{t('mosque.reportText')}</Text>
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
              <Text style={styles.sourceTitle}>{t('mosque.sourceTitle')}</Text>
              <Text style={styles.sourceText}>
                {checkedDate
                  ? t('mosque.sourceChecked', { source: sourceName, date: checkedDate })
                  : sourceName}
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
          <Text style={styles.dataNoticeText}>{t('mosque.dataNotice')}</Text>
        </View>
        </View>
      </ScrollView>
      <MosqueTimesProposalSheet
        visible={prayerModalVisible}
        onClose={() => setPrayerModalVisible(false)}
        mosque={{ id: displayedMosque.id, name: displayedMosque.name, address: displayedMosque.address }}
        schedule={prayerSchedule}
        approved={prayerTimes}
        special={specialTimes}
      />
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
    backgroundColor: '#151022',
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
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
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
  mainMosqueCardCta: {
    borderColor: 'rgba(224,188,112,0.62)',
    backgroundColor: 'rgba(224,188,112,0.10)',
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
    backgroundColor: 'rgba(227,181,90,0.12)',
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
    fontFamily: typography.serifSemibold,
    fontSize: 20.5,
    lineHeight: 25,
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
    backgroundColor: 'rgba(227,181,90,0.12)',
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
    backgroundColor: 'rgba(227,181,90,0.12)',
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
    backgroundColor: 'rgba(227,181,90,0.12)',
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
  illustrationLabel: {
    position: 'absolute',
    top: 10,
    right: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
    borderRadius: 7,
    backgroundColor: 'rgba(8,7,19,0.72)',
    color: 'rgba(248,244,238,0.78)',
    fontFamily: typography.sans,
    fontSize: 10,
  },
});
