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
import { HALAL_CATEGORY_LABELS, type HalalPlaceCategory } from '../../features/halal/domain/HalalPlace';
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
        Alert.alert('Localisation refusée', 'Autorise la localisation pour placer précisément cette adresse.');
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
      Alert.alert('Informations manquantes', 'Indique au minimum le nom et l’adresse de l’établissement.');
      return;
    }
    setSubmitting(true);
    try {
      const resolved = await resolveCoordinates();
      if (!resolved) {
        Alert.alert('Position introuvable', 'Ajoute une adresse plus précise ou utilise ta position actuelle.');
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
        'Adresse ajoutée',
        submittedForReview
          ? 'Elle est visible sur cet appareil et envoyée pour validation avant d’être proposée à toute la communauté.'
          : 'Elle est visible sur cet appareil. L’envoi pour validation sera retenté lorsque le service sera disponible.',
        [{ text: 'Voir la fiche', onPress: () => router.replace(`/halal/${encodeURIComponent(place.id)}` as Href) }],
      );
    } catch {
      Alert.alert('Ajout impossible', 'Une erreur est survenue. Réessaie dans quelques instants.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LinearGradient colors={[colors.background, '#160D24', colors.background]} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.roundButton}><Ionicons name="close" size={23} color={colors.goldLight} /></Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>CONTRIBUTION</Text><Text style={styles.title}>Ajouter une adresse</Text></View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}>
            <View style={styles.introIcon}><Ionicons name="people-outline" size={22} color={colors.goldLight} /></View>
            <View style={styles.introCopy}>
              <Text style={styles.introTitle}>Une information utile, jamais une fausse garantie</Text>
              <Text style={styles.introBody}>L’adresse sera affichée comme contribution communautaire, sauf si tu représentes l’établissement. Une certification ne sera indiquée qu’après contrôle réel.</Text>
            </View>
          </View>

          <Field label="Nom de l’établissement *" value={name} onChangeText={setName} placeholder="Ex. Le Comptoir des Saveurs" />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Type d’adresse *</Text>
            <View style={styles.categories}>
              {CATEGORIES.map((item) => (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, category === item && styles.categoryChipActive]}>
                  <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{HALAL_CATEGORY_LABELS[item]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Field label="Adresse complète *" value={address} onChangeText={setAddress} placeholder="Numéro, rue, ville et code postal" />
          <Pressable disabled={locating} onPress={() => void requestMyLocation()} style={styles.locationButton}>
            {locating ? <ActivityIndicator color={colors.goldLight} /> : <Ionicons name="locate-outline" size={18} color={colors.goldLight} />}
            <View style={styles.locationCopy}>
              <Text style={styles.locationTitle}>{coordinates ? 'Position enregistrée' : 'Utiliser ma position actuelle'}</Text>
              <Text style={styles.locationBody}>{coordinates ? 'Appuie pour actualiser les coordonnées' : 'Améliore la précision de l’adresse sur la carte'}</Text>
            </View>
            {coordinates ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
          </Pressable>

          <Text style={styles.sectionTitle}>Informations facultatives</Text>
          <Field label="Téléphone" value={phone} onChangeText={setPhone} placeholder="Ex. 04 00 00 00 00" keyboardType="phone-pad" />
          <Field label="Site internet" value={website} onChangeText={setWebsite} placeholder="www.exemple.fr" keyboardType="url" />
          <Field label="Horaires" value={openingHours} onChangeText={setOpeningHours} placeholder="Ex. Lun–Sam 11h30–23h" />
          <Field label="Pourquoi cette adresse est-elle halal ?" value={note} onChangeText={setNote} placeholder="Certification vue, déclaration du gérant, produits proposés…" multiline />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Qui ajoute cette adresse ? *</Text>
            <View style={styles.contributorChoices}>
              <Pressable
                onPress={() => setContributorType('community')}
                style={[styles.contributorCard, contributorType === 'community' && styles.contributorCardActive]}
              >
                <Ionicons name="people-outline" size={18} color={contributorType === 'community' ? colors.goldLight : colors.textSecondary} />
                <Text style={[styles.contributorTitle, contributorType === 'community' && styles.contributorTitleActive]}>Je recommande</Text>
                <Text style={styles.contributorBody}>Signalement communautaire</Text>
              </Pressable>
              <Pressable
                onPress={() => setContributorType('owner')}
                style={[styles.contributorCard, contributorType === 'owner' && styles.contributorCardActive]}
              >
                <Ionicons name="storefront-outline" size={18} color={contributorType === 'owner' ? colors.goldLight : colors.textSecondary} />
                <Text style={[styles.contributorTitle, contributorType === 'owner' && styles.contributorTitleActive]}>Je suis le gérant</Text>
                <Text style={styles.contributorBody}>Mention « Déclaré halal »</Text>
              </Pressable>
            </View>
          </View>

          <Pressable disabled={submitting} onPress={() => void submit()} style={[styles.submitButton, submitting && styles.disabled]}>
            <LinearGradient colors={[colors.goldLight, colors.gold, colors.goldDark]} style={styles.submitGradient}>
              {submitting ? <ActivityIndicator color={colors.background} /> : <><Ionicons name="add-circle-outline" size={19} color={colors.background} /><Text style={styles.submitText}>Ajouter cette adresse</Text></>}
            </LinearGradient>
          </Pressable>
          <Text style={styles.privacy}>Chaque contribution est visible immédiatement sur cet appareil, puis publiée pour tous uniquement après validation.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  roundButton: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(227,181,90,0.28)', backgroundColor: 'rgba(25,15,39,0.88)' },
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
  input: { minHeight: 50, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, color: colors.text, backgroundColor: 'rgba(23,16,38,0.90)', fontFamily: typography.sans, fontSize: 12 },
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
