import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createUserMosque,
  type UserMosqueFeatureState,
} from '../../features/mosques/data/userMosques';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type FormValues = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  alternativeName: string;
  arabicName: string;
  phone: string;
  email: string;
  website: string;
  openingHours: string;
  operator: string;
  denomination: string;
  wheelchair: UserMosqueFeatureState;
  womenSpace: UserMosqueFeatureState;
  ablutions: UserMosqueFeatureState;
  parking: UserMosqueFeatureState;
  toilets: UserMosqueFeatureState;
  languages: string;
  serviceTimes: string;
};

type FormErrors = Partial<Record<keyof FormValues | 'form', string>>;

const INITIAL_VALUES: FormValues = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  alternativeName: '',
  arabicName: '',
  phone: '',
  email: '',
  website: '',
  openingHours: '',
  operator: '',
  denomination: '',
  wheelchair: 'unknown',
  womenSpace: 'unknown',
  ablutions: 'unknown',
  parking: 'unknown',
  toilets: 'unknown',
  languages: '',
  serviceTimes: '',
};

const FEATURE_FIELDS: Array<{
  key: keyof Pick<
    FormValues,
    'wheelchair' | 'womenSpace' | 'ablutions' | 'parking' | 'toilets'
  >;
  label: string;
}> = [
  { key: 'wheelchair', label: 'Accessibilité fauteuil roulant' },
  { key: 'womenSpace', label: 'Espace femmes' },
  { key: 'ablutions', label: 'Ablutions' },
  { key: 'parking', label: 'Parking' },
  { key: 'toilets', label: 'Toilettes' },
];

const FEATURE_OPTIONS: Array<{
  value: UserMosqueFeatureState;
  label: string;
}> = [
  { value: 'yes', label: 'Oui' },
  { value: 'no', label: 'Non' },
  { value: 'limited', label: 'Limité' },
  { value: 'unknown', label: 'Inconnu' },
];

function clean(value: string) {
  return value.trim();
}

function parseCoordinate(value: string) {
  const cleaned = clean(value).replace(',', '.');
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AddMosqueScreen() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const updateValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const latitude = parseCoordinate(values.latitude);
    const longitude = parseCoordinate(values.longitude);
    const email = clean(values.email);
    const website = clean(values.website);

    if (!clean(values.name)) nextErrors.name = 'Le nom est obligatoire.';
    if (!clean(values.address)) nextErrors.address = "L'adresse est obligatoire.";
    if (latitude === null || latitude < -90 || latitude > 90) {
      nextErrors.latitude = 'Latitude invalide : entre -90 et 90.';
    }
    if (longitude === null || longitude < -180 || longitude > 180) {
      nextErrors.longitude = 'Longitude invalide : entre -180 et 180.';
    }
    if (email && !isValidEmail(email)) nextErrors.email = 'E-mail invalide.';
    if (website && !isValidUrl(website)) {
      nextErrors.website = 'URL invalide. Utilisez http:// ou https://.';
    }

    return nextErrors;
  };

  const useCurrentLocation = async () => {
    if (locating) return;

    setLocating(true);
    setLocationMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationMessage('Permission de localisation refusée. Vous pouvez saisir les coordonnées manuellement.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      updateValue('latitude', String(position.coords.latitude));
      updateValue('longitude', String(position.coords.longitude));
      setLocationMessage('Position actuelle récupérée. Vérifiez-la avant l’enregistrement.');
    } catch {
      setLocationMessage('Position indisponible. Vous pouvez saisir les coordonnées manuellement.');
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    if (saving) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const latitude = parseCoordinate(values.latitude);
    const longitude = parseCoordinate(values.longitude);
    if (latitude === null || longitude === null) return;

    setSaving(true);
    try {
      await createUserMosque({
        name: clean(values.name),
        address: clean(values.address),
        latitude,
        longitude,
        alternativeName: clean(values.alternativeName),
        arabicName: clean(values.arabicName),
        phone: clean(values.phone),
        email: clean(values.email),
        website: clean(values.website),
        openingHours: clean(values.openingHours),
        operator: clean(values.operator),
        denomination: clean(values.denomination),
        wheelchair: values.wheelchair,
        womenSpace: values.womenSpace,
        ablutions: values.ablutions,
        parking: values.parking,
        toilets: values.toilets,
        languages: splitList(values.languages),
        serviceTimes: splitList(values.serviceTimes),
      });
      Alert.alert('Mosquée enregistrée', 'La mosquée a été enregistrée sur cet appareil.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      setErrors({ form: "La mosquée n'a pas pu être enregistrée. Vérifiez les informations puis réessayez." });
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    key: keyof FormValues,
    label: string,
    options: { required?: boolean; keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'; multiline?: boolean; placeholder?: string } = {},
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{options.required ? ' *' : ''}
      </Text>
      <TextInput
        value={String(values[key])}
        onChangeText={(text) => updateValue(key, text as FormValues[typeof key])}
        placeholder={options.placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={options.keyboardType ?? 'default'}
        multiline={options.multiline}
        textAlignVertical={options.multiline ? 'top' : 'center'}
        style={[styles.input, options.multiline && styles.multilineInput]}
      />
      {errors[key] ? <Text style={styles.error}>{errors[key]}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Retour" onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={23} color={colors.goldLight} />
        </Pressable>
        <Text style={styles.title}>Ajouter une mosquée</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Ajoutez une mosquée enregistrée uniquement sur cet appareil.</Text>

        <Text style={styles.sectionTitle}>Informations principales</Text>
        {renderInput('name', 'Nom de la mosquée', { required: true })}
        {renderInput('address', 'Adresse complète', { required: true, multiline: true })}

        <Text style={styles.sectionTitle}>Position</Text>
        <View style={styles.locationButtonWrap}>
          <Pressable onPress={() => void useCurrentLocation()} disabled={locating} style={({ pressed }) => [styles.locationButton, pressed && styles.pressed, locating && styles.disabled]}>
            {locating ? <ActivityIndicator color={colors.background} /> : <Ionicons name="locate-outline" size={19} color={colors.background} />}
            <Text style={styles.locationButtonText}>{locating ? 'Recherche en cours…' : 'Utiliser ma position actuelle'}</Text>
          </Pressable>
          {locationMessage ? <Text style={styles.helper}>{locationMessage}</Text> : null}
        </View>
        {renderInput('latitude', 'Latitude', { required: true, keyboardType: 'numeric', placeholder: 'Ex. 43.2965' })}
        {renderInput('longitude', 'Longitude', { required: true, keyboardType: 'numeric', placeholder: 'Ex. 5.3698' })}

        <Text style={styles.sectionTitle}>Informations complémentaires</Text>
        {renderInput('alternativeName', 'Nom alternatif')}
        {renderInput('arabicName', 'Nom arabe')}
        {renderInput('phone', 'Téléphone', { keyboardType: 'phone-pad' })}
        {renderInput('email', 'E-mail', { keyboardType: 'email-address' })}
        {renderInput('website', 'Site internet', { placeholder: 'https://…' })}
        {renderInput('openingHours', "Horaires d'ouverture", { multiline: true })}
        {renderInput('operator', 'Responsable ou opérateur')}
        {renderInput('denomination', 'Courant ou dénomination')}

        <Text style={styles.sectionTitle}>Équipements et accessibilité</Text>
        {FEATURE_FIELDS.map(({ key, label }) => (
          <View key={key} style={styles.choiceField}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.choiceRow}>
              {FEATURE_OPTIONS.map((option) => (
                <Pressable key={option.value} onPress={() => updateValue(key, option.value)} style={[styles.choice, values[key] === option.value && styles.choiceSelected]}>
                  <Text style={[styles.choiceText, values[key] === option.value && styles.choiceTextSelected]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Langues et services</Text>
        {renderInput('languages', 'Langues', { placeholder: 'Français, arabe, anglais' })}
        {renderInput('serviceTimes', 'Horaires ou informations de services', { multiline: true, placeholder: 'Joumou’a, cours, conférences…' })}

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
        <Pressable onPress={() => void save()} disabled={saving} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, saving && styles.disabled]}>
          {saving ? <ActivityIndicator color={colors.background} /> : null}
          <Text style={styles.saveButtonText}>{saving ? 'Enregistrement…' : 'Enregistrer la mosquée'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 64, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  headerButtonPlaceholder: { width: 42 },
  title: { fontFamily: typography.sans, color: colors.text, fontSize: 21, fontWeight: typography.sansBold },
  content: { padding: 20, paddingBottom: 44 },
  intro: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 22 },
  sectionTitle: { fontFamily: typography.sans, color: colors.goldLight, fontSize: 18, fontWeight: typography.sansBold, marginTop: 18, marginBottom: 13 },
  field: { marginBottom: 14 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 7 },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.text, paddingHorizontal: 14, fontSize: 15 },
  multilineInput: { minHeight: 82, paddingTop: 13 },
  error: { color: '#F28B82', fontSize: 12, marginTop: 5 },
  formError: { color: '#F28B82', fontSize: 13, lineHeight: 19, marginTop: 12 },
  locationButtonWrap: { marginBottom: 14 },
  locationButton: { minHeight: 46, borderRadius: 12, backgroundColor: colors.goldLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  locationButtonText: { color: colors.background, fontWeight: '700', fontSize: 14 },
  helper: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  choiceField: { marginBottom: 14 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { borderRadius: 9, borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: colors.card },
  choiceSelected: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  choiceText: { color: colors.textMuted, fontSize: 12 },
  choiceTextSelected: { color: colors.background, fontWeight: '700' },
  saveButton: { minHeight: 52, borderRadius: 14, marginTop: 22, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  saveButtonText: { color: colors.background, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.55 },
});
