import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createHalalPlaceSubmission } from '../../features/halal/data/HalalPlacesRepository';
import { halalCategoryLabel, type HalalPlaceCategory } from '../../features/halal/domain/HalalPlace';
import { translate, useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const CATEGORIES: HalalPlaceCategory[] = ['restaurant', 'fast_food', 'butcher', 'grocery', 'bakery', 'other'];

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'url';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'url' ? 'none' : 'sentences'}
        autoCorrect={keyboardType !== 'url'}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

export default function AddHalalPlaceScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const initialCoordinates = useMemo(() => {
    const latitude = Number(params.lat);
    const longitude = Number(params.lng);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  }, [params.lat, params.lng]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HalalPlaceCategory>('restaurant');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [note, setNote] = useState('');
  const [contributorType, setContributorType] = useState<'community' | 'owner'>('community');
  const [coordinates, setCoordinates] = useState(initialCoordinates);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requestMyLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(translate('halal.locationDeniedTitle'), translate('halal.locationDeniedText'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoordinates(next);
      if (!address.trim()) {
        const result = await Location.reverseGeocodeAsync(next).catch(() => []);
        const item = result[0];
        if (item) setAddress([item.streetNumber, item.street, item.postalCode, item.city].filter(Boolean).join(' '));
      }
    } finally {
      setLocating(false);
    }
  };

  const resolveCoordinates = async () => {
    if (address.trim()) {
      const results = await Location.geocodeAsync(address.trim()).catch(() => []);
      if (results[0]) return { latitude: results[0].latitude, longitude: results[0].longitude };
    }
    return coordinates;
  };

  const submit = async () => {
    if (name.trim().length < 2 || address.trim().length < 3) {
      Alert.alert(translate('halal.missingTitle'), translate('halal.missingText'));
      return;
    }
    setSubmitting(true);
    try {
      const resolved = await resolveCoordinates();
      if (!resolved) {
        Alert.alert(translate('halal.positionNotFoundTitle'), translate('halal.positionNotFoundText'));
        return;
      }
      const { place, submittedForReview } = await createHalalPlaceSubmission({
        name,
        category,
        address,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        phone,
        website,
        openingHours,
        note,
        verificationStatus: contributorType === 'owner' ? 'declared' : 'community',
      });
      Alert.alert(
        translate('halal.addedTitle'),
        translate(submittedForReview ? 'halal.addedReview' : 'halal.addedRetry'),
        [{ text: translate('halal.viewPlace'), onPress: () => router.replace(`/halal/${encodeURIComponent(place.id)}` as Href) }],
      );
    } catch {
      Alert.alert(translate('halal.addErrorTitle'), translate('halal.addErrorText'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[colors.background, '#100C19', colors.background]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('halal.close')} onPress={() => router.back()} style={styles.roundButton}><Ionicons name="close" size={23} color={colors.goldLight} /></Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>{t('halal.addEyebrow')}</Text><Text style={styles.title}>{t('halal.addPlace')}</Text></View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}>
            <View style={styles.introIcon}><Ionicons name="people-outline" size={22} color={colors.goldLight} /></View>
            <View style={styles.introCopy}>
              <Text style={styles.introTitle}>{t('halal.addIntroTitle')}</Text>
              <Text style={styles.introBody}>{t('halal.addIntroText')}</Text>
            </View>
          </View>

          <Field label={t('halal.fieldName')} value={name} onChangeText={setName} placeholder={t('halal.fieldNamePlaceholder')} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('halal.fieldType')}</Text>
            <View style={styles.categories}>
              {CATEGORIES.map((item) => (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, category === item && styles.categoryChipActive]}>
                  <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{halalCategoryLabel(item, t)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Field label={t('halal.fieldAddress')} value={address} onChangeText={setAddress} placeholder={t('halal.fieldAddressPlaceholder')} />
          <Pressable disabled={locating} onPress={() => void requestMyLocation()} style={styles.locationButton}>
            {locating ? <ActivityIndicator color={colors.goldLight} /> : <Ionicons name="locate-outline" size={18} color={colors.goldLight} />}
            <View style={styles.locationCopy}>
              <Text style={styles.locationTitle}>{t(coordinates ? 'halal.positionSaved' : 'halal.useMyPosition')}</Text>
              <Text style={styles.locationBody}>{t(coordinates ? 'halal.positionRefresh' : 'halal.positionHint')}</Text>
            </View>
            {coordinates ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
          </Pressable>

          <Text style={styles.sectionTitle}>{t('halal.optionalInfo')}</Text>
          <Field label={t('halal.fieldPhone')} value={phone} onChangeText={setPhone} placeholder={t('halal.fieldPhonePlaceholder')} keyboardType="phone-pad" />
          <Field label={t('halal.fieldWebsite')} value={website} onChangeText={setWebsite} placeholder={t('halal.fieldWebsitePlaceholder')} keyboardType="url" />
          <Field label={t('halal.fieldHours')} value={openingHours} onChangeText={setOpeningHours} placeholder={t('halal.fieldHoursPlaceholder')} />
          <Field label={t('halal.fieldWhy')} value={note} onChangeText={setNote} placeholder={t('halal.fieldWhyPlaceholder')} multiline />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('halal.fieldWho')}</Text>
            <View style={styles.contributorChoices}>
              <Pressable
                onPress={() => setContributorType('community')}
                style={[styles.contributorCard, contributorType === 'community' && styles.contributorCardActive]}
              >
                <Ionicons name="people-outline" size={18} color={contributorType === 'community' ? colors.goldLight : colors.textSecondary} />
                <Text style={[styles.contributorTitle, contributorType === 'community' && styles.contributorTitleActive]}>{t('halal.whoCommunity')}</Text>
                <Text style={styles.contributorBody}>{t('halal.whoCommunityText')}</Text>
              </Pressable>
              <Pressable
                onPress={() => setContributorType('owner')}
                style={[styles.contributorCard, contributorType === 'owner' && styles.contributorCardActive]}
              >
                <Ionicons name="storefront-outline" size={18} color={contributorType === 'owner' ? colors.goldLight : colors.textSecondary} />
                <Text style={[styles.contributorTitle, contributorType === 'owner' && styles.contributorTitleActive]}>{t('halal.whoOwner')}</Text>
                <Text style={styles.contributorBody}>{t('halal.whoOwnerText')}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable disabled={submitting} onPress={() => void submit()} style={[styles.submitButton, submitting && styles.disabled]}>
            <LinearGradient colors={[colors.goldLight, colors.gold, colors.goldDark]} style={styles.submitGradient}>
              {submitting ? <ActivityIndicator color={colors.background} /> : <><Ionicons name="add-circle-outline" size={19} color={colors.background} /><Text style={styles.submitText}>{t('halal.addSubmit')}</Text></>}
            </LinearGradient>
          </Pressable>
          <Text style={styles.privacy}>{t('halal.addPrivacy')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  roundButton: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(227,181,90,0.28)', backgroundColor: 'rgba(21,16,34,0.88)' },
  headerSpacer: { width: 43 },
  headerCopy: { flex: 1, alignItems: 'center' },
  eyebrow: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 8, fontWeight: '800', letterSpacing: 1.8 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingBottom: 45 },
  introCard: { flexDirection: 'row', marginTop: 5, marginBottom: 18, padding: 15, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(227,181,90,0.30)', backgroundColor: 'rgba(200,148,58,0.08)' },
  introIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(227,181,90,0.12)' },
  introCopy: { flex: 1, marginLeft: 11 },
  introTitle: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: '900' },
  introBody: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9.5, lineHeight: 14 },
  field: { marginBottom: 13 },
  fieldLabel: { marginLeft: 3, marginBottom: 6, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10, fontWeight: '800' },
  input: { minHeight: 50, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, color: colors.text, backgroundColor: 'rgba(21,16,34,0.90)', fontFamily: typography.sans, fontSize: 12 },
  multiline: { minHeight: 88, paddingTop: 13, paddingBottom: 13, textAlignVertical: 'top' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  categoryChip: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  categoryChipActive: { borderColor: colors.goldLight, backgroundColor: colors.goldLight },
  categoryText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '700' },
  categoryTextActive: { color: colors.background },
  locationButton: { minHeight: 60, marginTop: -3, marginBottom: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(227,181,90,0.28)', backgroundColor: 'rgba(200,148,58,0.07)' },
  locationCopy: { flex: 1, marginLeft: 10 },
  locationTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '800' },
  locationBody: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 8.5 },
  sectionTitle: { marginBottom: 12, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21, fontWeight: '700' },
  contributorChoices: { flexDirection: 'row', gap: 8 },
  contributorCard: { flex: 1, minHeight: 82, padding: 12, borderRadius: 17, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  contributorCardActive: { borderColor: colors.gold, backgroundColor: 'rgba(200,148,58,0.10)' },
  contributorTitle: { marginTop: 7, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10, fontWeight: '900' },
  contributorTitleActive: { color: colors.goldLight },
  contributorBody: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 8.2, lineHeight: 11 },
  submitButton: { height: 52, overflow: 'hidden', marginTop: 18, borderRadius: 18 },
  submitGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  submitText: { color: colors.background, fontFamily: typography.sans, fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.50 },
  privacy: { marginTop: 9, color: colors.textMuted, textAlign: 'center', fontFamily: typography.sans, fontSize: 8.5 },
});
