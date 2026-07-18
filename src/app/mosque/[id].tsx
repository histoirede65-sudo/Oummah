import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    isFavoriteMosque,
    isMainMosque,
    setMainMosque,
    toggleFavoriteMosque,
    type StoredMosque,
} from '../../features/mosques/data/mosquePreferences';
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
  }>();

  const [favorite, setFavorite] = useState(false);
  const [mainMosque, setIsMainMosque] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [savingMainMosque, setSavingMainMosque] = useState(false);

  const mosque = useMemo<StoredMosque | null>(() => {
    const id = getSingleParam(params.id);
    const name = getSingleParam(params.name);
    const address = getSingleParam(params.address);
    const latitude = Number(getSingleParam(params.latitude));
    const longitude = Number(getSingleParam(params.longitude));

    if (
      !id ||
      !name ||
      !address ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return {
      id,
      name,
      address,
      latitude,
      longitude,
      distanceLabel: getOptionalValue(params.distance),
      phone: getOptionalValue(params.phone),
      website: getOptionalValue(params.website),
      openingHours: getOptionalValue(params.openingHours),
    };
  }, [params]);

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      if (!mosque) {
        setLoadingPreferences(false);
        return;
      }

      const [favoriteValue, mainMosqueValue] = await Promise.all([
        isFavoriteMosque(mosque.id),
        isMainMosque(mosque.id),
      ]);

      if (!active) return;

      setFavorite(favoriteValue);
      setIsMainMosque(mainMosqueValue);
      setLoadingPreferences(false);
    };

    void loadPreferences();

    return () => {
      active = false;
    };
  }, [mosque]);

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

  const openDirections = () => {
    const destination = `${mosque.latitude},${mosque.longitude}`;
    const url =
      `https://www.google.com/maps/dir/?api=1&destination=` +
      encodeURIComponent(destination);

    void openExternalUrl(
      url,
      'Aucune application compatible ne peut ouvrir cet itinéraire.',
    );
  };

  const callMosque = () => {
    if (!mosque.phone) return;

    const sanitizedPhone = mosque.phone.replace(/[^\d+]/g, '');

    void openExternalUrl(
      `tel:${sanitizedPhone}`,
      'Impossible de lancer cet appel.',
    );
  };

  const openWebsite = () => {
    if (!mosque.website) return;

    const normalizedWebsite = /^https?:\/\//i.test(mosque.website)
      ? mosque.website
      : `https://${mosque.website}`;

    void openExternalUrl(
      normalizedWebsite,
      'Impossible d’ouvrir ce site internet.',
    );
  };

  const toggleFavorite = async () => {
    if (savingFavorite) return;

    setSavingFavorite(true);

    try {
      const nextValue = await toggleFavoriteMosque(mosque);
      setFavorite(nextValue);
    } catch {
      Alert.alert(
        'Enregistrement impossible',
        'La mosquée n’a pas pu être ajoutée aux favoris.',
      );
    } finally {
      setSavingFavorite(false);
    }
  };

  const chooseMainMosque = async () => {
    if (savingMainMosque || mainMosque) return;

    setSavingMainMosque(true);

    try {
      await setMainMosque(mosque);
      setIsMainMosque(true);

      Alert.alert(
        'Ma mosquée',
        `${mosque.name} est maintenant votre mosquée principale.`,
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
          accessibilityLabel={
            favorite
              ? 'Retirer des favoris'
              : 'Ajouter aux favoris'
          }
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlow} />

          <View style={styles.mosqueArtwork}>
            <Ionicons
              name="business"
              size={42}
              color={colors.goldLight}
            />
          </View>

          <Text style={styles.mosqueName}>{mosque.name}</Text>

          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={17}
              color={colors.goldLight}
            />
            <Text style={styles.address}>{mosque.address}</Text>
          </View>

          {mosque.distanceLabel ? (
            <View style={styles.distanceBadge}>
              <Ionicons
                name="walk-outline"
                size={15}
                color={colors.background}
              />
              <Text style={styles.distanceText}>
                {mosque.distanceLabel}
              </Text>
            </View>
          ) : null}
        </View>

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
            disabled={!mosque.phone}
            onPress={callMosque}
            style={({ pressed }) => [
              styles.secondaryAction,
              !mosque.phone && styles.disabledAction,
              pressed && mosque.phone && styles.pressed,
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
            disabled={!mosque.website}
            onPress={openWebsite}
            style={({ pressed }) => [
              styles.secondaryAction,
              !mosque.website && styles.disabledAction,
              pressed && mosque.website && styles.pressed,
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
                  {mosque.address}
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
                  {mosque.openingHours ||
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
                  {mosque.phone || 'Non renseigné'}
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
                  {mosque.website || 'Non renseigné'}
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
  content: {
    width: '100%',
    maxWidth: 760,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 55,
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
  heroGlow: {
    position: 'absolute',
    top: -100,
    right: -45,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(126,72,148,0.26)',
  },
  mosqueArtwork: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 39,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: 'rgba(126,72,148,0.22)',
  },
  mosqueName: {
    marginTop: 17,
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
    transform: [{ scale: 0.99 }],
  },
});