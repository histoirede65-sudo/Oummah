import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
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

import {
  enrichHalalPlaceFromGoogle,
  getHalalFavoriteIds,
  getHalalPlaceById,
  hasPendingHalalPhotoSubmission,
  reportHalalPlace,
  submitHalalPlacePhoto,
  toggleHalalFavorite,
} from '../../features/halal/data/HalalPlacesRepository';
import {
  halalCategoryLabel,
  halalDisplayAddress,
  halalDistanceLabel,
  halalVerificationText,
  type HalalPlace,
} from '../../features/halal/domain/HalalPlace';
import { translate, useI18n, type TranslationKey } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getGoogleHalalPhotoSource } from '../../features/halal/data/googleHalalPlaces';

const REPORT_REASONS: TranslationKey[] = [
  'halal.reason.halal',
  'halal.reason.closed',
  'halal.reason.contact',
  'halal.reason.duplicate',
  'halal.reason.other',
];

function normalizeWebsite(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function mapsUrl(place: HalalPlace) {
  const label = encodeURIComponent(place.name);
  if (Platform.OS === 'ios') return `maps:0,0?q=${label}@${place.latitude},${place.longitude}`;
  if (Platform.OS === 'android') return `geo:${place.latitude},${place.longitude}?q=${place.latitude},${place.longitude}(${label})`;
  return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
}

/** Google renvoie « lundi: 11:00–14:30 » : majuscule au jour, et pas d'espace avant les deux-points. */
function formatHours(hours: string) {
  return hours
    .split('\n')
    .map((line) => line.charAt(0).toLocaleUpperCase('fr') + line.slice(1))
    .join('\n');
}

function FeaturePill({ icon, label, enabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; enabled?: boolean }) {
  return (
    <View style={[styles.featurePill, enabled === false && styles.featurePillMuted]}>
      <Ionicons name={icon} size={15} color={enabled === false ? colors.textMuted : colors.goldLight} />
      <Text style={[styles.featureText, enabled === false && styles.featureTextMuted]}>{label}</Text>
    </View>
  );
}

export default function HalalPlaceDetailScreen() {
  const { language, t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = decodeURIComponent(Array.isArray(id) ? id[0] : id ?? '');
  const [place, setPlace] = useState<HalalPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorite, setFavorite] = useState(false);
  const [detailsRefreshing, setDetailsRefreshing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportNote, setReportNote] = useState('');
  const [reporting, setReporting] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoSubmitting, setPhotoSubmitting] = useState(false);
  const [photoPendingReview, setPhotoPendingReview] = useState(false);

  useEffect(() => setPhotoFailed(false), [place?.photoName, place?.communityPhotoUrl]);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      try {
        const [result, favorites] = await Promise.all([getHalalPlaceById(placeId), getHalalFavoriteIds()]);
        if (!active) return;
        setPlace(result);
        setFavorite(favorites.includes(placeId));
        if (result) {
          const pendingPhoto = await hasPendingHalalPhotoSubmission(result).catch(() => false);
          if (active) setPhotoPendingReview(pendingPhoto);
        }
        setLoading(false);
        if (result?.googlePlaceId && !result.googleDetailsLoaded) {
          setDetailsRefreshing(true);
          const enriched = await enrichHalalPlaceFromGoogle(result).catch(() => result);
          if (active) setPlace(enriched);
        }
      } finally {
        if (active) {
          setLoading(false);
          setDetailsRefreshing(false);
        }
      }
    };
    void load();
    return () => { active = false; };
  }, [placeId]));

  const openLink = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(translate('halal.linkErrorTitle'), translate('halal.linkErrorText'));
    }
  }, []);

  const addPhoto = useCallback(async () => {
    if (!place || place.photoName || place.communityPhotoUrl || photoPendingReview || photoSubmitting) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(translate('halal.photoPermissionTitle'), translate('halal.photoPermissionText'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.72,
      selectionLimit: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPhotoSubmitting(true);
    try {
      await submitHalalPlacePhoto(place, {
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      setPhotoPendingReview(true);
      Alert.alert(translate('halal.photoSentTitle'), translate('halal.photoSentText'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'HALAL_PHOTO_SIZE_INVALID') {
        Alert.alert(translate('halal.photoTooBigTitle'), translate('halal.photoTooBigText'));
      } else if (message === 'HALAL_PHOTO_TYPE_INVALID') {
        Alert.alert(translate('halal.photoTypeTitle'), translate('halal.photoTypeText'));
      } else {
        Alert.alert(translate('halal.photoErrorTitle'), translate('halal.photoErrorText'));
      }
    } finally {
      setPhotoSubmitting(false);
    }
  }, [photoPendingReview, photoSubmitting, place]);

  const submitReport = useCallback(async () => {
    if (!place) return;
    setReporting(true);
    try {
      await reportHalalPlace(place.id, translate(reportReason), reportNote);
      setReportOpen(false);
      setReportNote('');
      Alert.alert(translate('halal.reportSavedTitle'), translate('halal.reportSavedText'));
    } finally {
      setReporting(false);
    }
  }, [place, reportNote, reportReason]);

  if (loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.loading}><ActivityIndicator color={colors.goldLight} /></View></SafeAreaView>;
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}><Pressable accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.roundButton}><Ionicons name="chevron-back" size={24} color={colors.goldLight} /></Pressable></View>
        <View style={styles.loading}>
          <Ionicons name="storefront-outline" size={43} color={colors.goldLight} />
          <Text style={styles.emptyTitle}>{t('halal.notFoundTitle')}</Text>
          <Text style={styles.emptyBody}>{t('halal.notFoundText')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const certificateVerified = place.verificationStatus === 'verified_certificate';
  const verificationText = halalVerificationText(place, t);
  const sourceKey: TranslationKey = place.source === 'google'
    ? 'halal.sourceGoogle'
    : place.source === 'openstreetmap'
      ? place.googlePlaceId ? 'halal.sourceOsmGoogle' : 'halal.sourceOsm'
      : 'halal.sourceCommunity';
  const photoSource = place.communityPhotoUrl
    ? { uri: place.communityPhotoUrl }
    : getGoogleHalalPhotoSource(place.photoName);
  const displayPhoto = Boolean(photoSource && !photoFailed);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[colors.background, '#100C19', colors.background]} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.roundButton}><Ionicons name="chevron-back" size={24} color={colors.goldLight} /></Pressable>
        <Text style={styles.topTitle}>{t('halal.placeTitle')}</Text>
        <Pressable accessibilityLabel={t(favorite ? 'halal.removeFavorite' : 'halal.addFavorite')} onPress={async () => { const next = await toggleHalalFavorite(place.id); setFavorite(next); }} style={styles.roundButton}>
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={21} color={colors.goldLight} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['rgba(30,23,48,0.96)', 'rgba(30,23,48,0.98)', 'rgba(10,9,21,1)']} style={styles.hero}>
          {displayPhoto ? <Image source={photoSource} contentFit="cover" transition={220} onError={() => setPhotoFailed(true)} style={StyleSheet.absoluteFill} /> : null}
          {displayPhoto ? <LinearGradient colors={['rgba(8,7,19,0.20)', 'rgba(8,7,19,0.78)', 'rgba(8,7,19,0.96)']} style={StyleSheet.absoluteFill} /> : null}
          <View style={styles.heroGlow} />
          {!displayPhoto ? <View style={styles.heroIcon}><Ionicons name="restaurant" size={36} color={colors.goldLight} /></View> : null}
          <Text style={styles.category}>{halalCategoryLabel(place.category, t).toUpperCase()}</Text>
          <Text style={styles.name}>{place.name}</Text>
          {displayPhoto && place.communityPhotoUrl ? <Text style={styles.photoCredit}>{t('halal.communityPhoto')}</Text> : null}
          {displayPhoto && !place.communityPhotoUrl && place.photoAttribution ? <Text style={styles.photoCredit}>{t('halal.photoGoogle', { author: place.photoAttribution })}</Text> : null}
          <View style={styles.distanceRow}>
            <Ionicons name="navigate-outline" size={14} color={colors.goldLight} />
            <Text style={styles.distance}>{halalDistanceLabel(place, language, t)}</Text>
            {place.cuisine ? <><View style={styles.dot} /><Text numberOfLines={1} style={styles.cuisine}>{place.cuisine}</Text></> : null}
            {place.openNow !== undefined ? <><View style={styles.dot} /><Text style={[styles.openStatus, !place.openNow && styles.closedStatus]}>{t(place.openNow ? 'halal.openNow' : 'halal.closed')}</Text></> : null}
          </View>
        </LinearGradient>

        {!displayPhoto ? (
          <View style={styles.photoContributionCard}>
            <View style={styles.photoContributionIcon}>
              <Ionicons name={photoPendingReview ? 'time-outline' : 'camera-outline'} size={21} color={colors.goldLight} />
            </View>
            <View style={styles.photoContributionCopy}>
              <Text style={styles.photoContributionTitle}>
                {t(photoPendingReview ? 'halal.photoPendingTitle' : 'halal.noPhotoTitle')}
              </Text>
              <Text style={styles.photoContributionBody}>
                {t(photoPendingReview ? 'halal.photoPendingText' : 'halal.noPhotoText')}
              </Text>
            </View>
            {!photoPendingReview ? (
              <Pressable
                accessibilityLabel={t('halal.addPhoto')}
                disabled={photoSubmitting}
                onPress={() => void addPhoto()}
                style={({ pressed }) => [styles.photoContributionButton, pressed && !photoSubmitting && styles.photoContributionButtonPressed]}
              >
                {photoSubmitting
                  ? <ActivityIndicator size="small" color={colors.background} />
                  : <Ionicons name="add" size={22} color={colors.background} />}
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.verificationCard, certificateVerified && styles.verificationCardStrong]}>
          <View style={[styles.shield, certificateVerified && styles.shieldStrong]}>
            <Ionicons name={certificateVerified ? 'shield-checkmark' : 'information-circle-outline'} size={25} color={certificateVerified ? colors.success : colors.goldLight} />
          </View>
          <View style={styles.verificationCopy}>
            <Text style={[styles.verificationTitle, certificateVerified && styles.verificationTitleStrong]}>{verificationText.label}</Text>
            <Text style={styles.verificationBody}>{verificationText.detail}</Text>
            {place.certificateBody ? <Text style={styles.certificate}>{t('halal.certificateBody', { name: place.certificateBody })}</Text> : null}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => void openLink(mapsUrl(place))} style={styles.primaryAction}>
            <Ionicons name="navigate" size={19} color={colors.background} />
            <Text style={styles.primaryActionText}>{t('halal.directions')}</Text>
          </Pressable>
          {place.phone ? <Pressable onPress={() => void openLink(`tel:${place.phone}`)} style={styles.actionButton}><Ionicons name="call-outline" size={20} color={colors.goldLight} /><Text style={styles.actionText}>{t('halal.call')}</Text></Pressable> : null}
          {place.website ? <Pressable onPress={() => void openLink(normalizeWebsite(place.website!))} style={styles.actionButton}><Ionicons name="globe-outline" size={20} color={colors.goldLight} /><Text style={styles.actionText}>{t('halal.website')}</Text></Pressable> : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{t('halal.practicalInfo')}</Text>
            {detailsRefreshing ? <View style={styles.refreshing}><ActivityIndicator size="small" color={colors.goldLight} /><Text style={styles.refreshingText}>{t('halal.googleUpdating')}</Text></View> : null}
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}><Ionicons name="location-outline" size={19} color={colors.goldLight} /><View style={styles.infoCopy}><Text style={styles.infoLabel}>{t('halal.address')}</Text><Text style={styles.infoValue}>{halalDisplayAddress(place.address)}</Text></View></View>
            <View style={styles.divider} />
            <View style={styles.infoRow}><Ionicons name="time-outline" size={19} color={colors.goldLight} /><View style={styles.infoCopy}><Text style={styles.infoLabel}>{t('halal.hours')}</Text><Text style={styles.infoValue}>{place.openingHours ? formatHours(place.openingHours) : t('halal.hoursUnknown')}</Text></View></View>
          </View>
        </View>

        <View style={styles.features}>
          {place.takeaway !== undefined ? <FeaturePill icon="bag-handle-outline" label={t(place.takeaway ? 'halal.takeaway' : 'halal.noTakeaway')} enabled={place.takeaway} /> : null}
          {place.delivery !== undefined ? <FeaturePill icon="bicycle-outline" label={t(place.delivery ? 'halal.delivery' : 'halal.noDelivery')} enabled={place.delivery} /> : null}
          {place.wheelchair !== undefined ? <FeaturePill icon="accessibility-outline" label={t(place.wheelchair ? 'halal.wheelchair' : 'halal.noWheelchair')} enabled={place.wheelchair} /> : null}
          {place.alcohol === 'no' ? <FeaturePill icon="wine-outline" label={t('halal.alcoholFree')} enabled /> : null}
          {place.alcohol === 'yes' ? <FeaturePill icon="alert-circle-outline" label={t('halal.alcohol')} enabled={false} /> : null}
        </View>

        <View style={styles.transparencyCard}>
          <Ionicons name="eye-outline" size={20} color={colors.goldLight} />
          <View style={styles.transparencyCopy}>
            <Text style={styles.transparencyTitle}>{t('halal.trustTitle')}</Text>
            <Text style={styles.transparencyBody}>{t('halal.trustText')}</Text>
          </View>
        </View>

        <Pressable onPress={() => setReportOpen(true)} style={styles.reportButton}>
          <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.reportText}>{t('halal.reportWrong')}</Text>
        </Pressable>
        {place.googleMapsUri ? (
          <Pressable onPress={() => void openLink(place.googleMapsUri!)} style={styles.googleSourceButton}>
            <Ionicons name="map-outline" size={14} color={colors.goldLight} />
            <Text style={styles.googleSourceText}>Google Maps</Text>
          </Pressable>
        ) : null}
        <Text style={styles.source}>{t(sourceKey)}</Text>
      </ScrollView>

      <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={() => setReportOpen(false)}>
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityLabel={t('halal.close')} style={styles.modalBackdrop} onPress={() => setReportOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('halal.reportTitle')}</Text>
            <Text style={styles.modalSubtitle}>{place.name}</Text>
            <View style={styles.reasonList}>
              {REPORT_REASONS.map((reason) => (
                <Pressable key={reason} onPress={() => setReportReason(reason)} style={[styles.reasonButton, reportReason === reason && styles.reasonButtonActive]}>
                  <View style={[styles.radio, reportReason === reason && styles.radioActive]}>{reportReason === reason ? <View style={styles.radioDot} /> : null}</View>
                  <Text style={styles.reasonText}>{t(reason)}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={reportNote} onChangeText={setReportNote} multiline placeholder={t('halal.reportNote')} placeholderTextColor={colors.textMuted} style={styles.noteInput} />
            <Pressable disabled={reporting} onPress={() => void submitReport()} style={styles.sendButton}>
              {reporting ? <ActivityIndicator color={colors.background} /> : <Text style={styles.sendText}>{t('halal.reportSend')}</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 35 },
  topBar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  roundButton: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(227,181,90,0.28)', backgroundColor: 'rgba(21,16,34,0.88)' },
  topTitle: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  emptyTitle: { marginTop: 15, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 26, fontWeight: '700' },
  emptyBody: { marginTop: 5, color: colors.textSecondary, textAlign: 'center', fontFamily: typography.sans, fontSize: 12 },
  scroll: { paddingHorizontal: 18, paddingBottom: 46 },
  hero: { minHeight: 224, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 22, borderRadius: 29, borderWidth: 1, borderColor: 'rgba(227,181,90,0.33)' },
  heroGlow: { position: 'absolute', top: -80, width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(200,148,58,0.13)' },
  heroIcon: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', borderRadius: 23, borderWidth: 1, borderColor: 'rgba(227,181,90,0.50)', backgroundColor: 'rgba(200,148,58,0.12)' },
  category: { marginTop: 14, color: colors.goldMuted, fontFamily: typography.sans, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  name: { marginTop: 3, color: colors.text, textAlign: 'center', fontFamily: typography.serifSemibold, fontSize: 33, lineHeight: 37, fontWeight: '700' },
  photoCredit: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 8.5 },
  photoContributionCard: { marginTop: 10, flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(227,181,90,0.28)', backgroundColor: 'rgba(200,148,58,0.07)' },
  photoContributionIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(227,181,90,0.11)' },
  photoContributionCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  photoContributionTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '900' },
  photoContributionBody: { marginTop: 3, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9, lineHeight: 13 },
  photoContributionButton: { width: 40, height: 40, marginLeft: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.goldLight },
  photoContributionButtonPressed: { opacity: 0.72 },
  distanceRow: { maxWidth: '100%', marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  distance: { marginLeft: 5, color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: '800', fontVariant: ['lining-nums', 'tabular-nums'] },
  dot: { width: 3, height: 3, marginHorizontal: 8, borderRadius: 2, backgroundColor: colors.textMuted },
  cuisine: { flexShrink: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11 },
  openStatus: { color: colors.success, fontFamily: typography.sans, fontSize: 10, fontWeight: '800' },
  closedStatus: { color: colors.danger },
  verificationCard: { marginTop: 12, flexDirection: 'row', padding: 15, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(227,181,90,0.34)', backgroundColor: 'rgba(200,148,58,0.09)' },
  verificationCardStrong: { borderColor: 'rgba(98,197,139,0.40)', backgroundColor: 'rgba(98,197,139,0.08)' },
  shield: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(227,181,90,0.12)' },
  shieldStrong: { backgroundColor: 'rgba(98,197,139,0.12)' },
  verificationCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  verificationTitle: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: '900' },
  verificationTitleStrong: { color: colors.success },
  verificationBody: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10.5, lineHeight: 15 },
  certificate: { marginTop: 5, color: colors.text, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '700' },
  actions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  primaryAction: { flex: 1.3, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 18, backgroundColor: colors.goldLight },
  primaryActionText: { color: colors.background, fontFamily: typography.sans, fontSize: 12, fontWeight: '900' },
  actionButton: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  actionText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '700' },
  section: { marginTop: 22 },
  sectionHeading: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { marginBottom: 9, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21, fontWeight: '700' },
  refreshing: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 },
  refreshingText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 8.5 },
  infoCard: { paddingHorizontal: 15, borderRadius: 22, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: 'rgba(21,16,34,0.84)' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14 },
  infoCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  infoLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9, fontWeight: '700' },
  infoValue: { marginTop: 2, color: colors.text, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 18, fontVariant: ['lining-nums', 'tabular-nums'] },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 30, backgroundColor: colors.borderSoft },
  features: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 7 },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(227,181,90,0.30)', backgroundColor: 'rgba(200,148,58,0.08)' },
  featurePillMuted: { borderColor: colors.borderSoft, backgroundColor: colors.surface },
  featureText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '700' },
  featureTextMuted: { color: colors.textMuted },
  transparencyCard: { marginTop: 22, flexDirection: 'row', padding: 15, borderRadius: 20, backgroundColor: 'rgba(30,23,48,0.72)' },
  transparencyCopy: { flex: 1, marginLeft: 11 },
  transparencyTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 11, fontWeight: '900' },
  transparencyBody: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9.5, lineHeight: 14 },
  reportButton: { height: 46, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  reportText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '700' },
  googleSourceButton: { alignSelf: 'center', height: 34, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 13, backgroundColor: 'rgba(200,148,58,0.09)' },
  googleSourceText: { color: colors.text, fontFamily: typography.sans, fontSize: 12, fontWeight: '400' },
  source: { color: colors.textMuted, textAlign: 'center', fontFamily: typography.sans, fontSize: 8.5 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 14, backgroundColor: 'rgba(0,0,0,0.68)' },
  modalCard: { padding: 20, paddingBottom: 25, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(227,181,90,0.30)', backgroundColor: colors.backgroundSecondary },
  modalHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 15 },
  modalTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 26, fontWeight: '700' },
  modalSubtitle: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '700' },
  reasonList: { marginTop: 14, gap: 6 },
  reasonButton: { minHeight: 41, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  reasonButtonActive: { borderColor: colors.gold, backgroundColor: 'rgba(200,148,58,0.09)' },
  radio: { width: 17, height: 17, alignItems: 'center', justifyContent: 'center', marginRight: 9, borderRadius: 9, borderWidth: 1, borderColor: colors.textMuted },
  radioActive: { borderColor: colors.goldLight },
  radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.goldLight },
  reasonText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '600' },
  noteInput: { minHeight: 68, marginTop: 10, padding: 12, borderRadius: 15, borderWidth: 1, borderColor: colors.borderSoft, color: colors.text, backgroundColor: colors.surface, textAlignVertical: 'top', fontFamily: typography.sans, fontSize: 11 },
  sendButton: { height: 48, marginTop: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.goldLight },
  sendText: { color: colors.background, fontFamily: typography.sans, fontSize: 11.5, fontWeight: '900' },
  modalKeyboard: { flex: 1 },
});
