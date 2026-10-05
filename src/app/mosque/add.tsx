import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
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
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';

import {
  createUserMosque,
  type UserMosqueFeatureState,
} from '../../features/mosques/data/userMosques';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getNearbyMosques, type NearbyMosque } from '../../features/mosques/data/nearbyMosques';

type FormValues = {
  name: string;
  address: string;
  postalCode: string;
  city: string;
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

type Coordinates = {
  latitude: number;
  longitude: number;
};

const INITIAL_VALUES: FormValues = {
  name: '',
  address: '',
  postalCode: '',
  city: '',
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
  labelKey: 'mosque.wheelchair' | 'mosque.womenSpace' | 'mosque.ablutions' | 'mosque.parking' | 'mosque.toilets';
}> = [
  { key: 'wheelchair', labelKey: 'mosque.wheelchair' },
  { key: 'womenSpace', labelKey: 'mosque.womenSpace' },
  { key: 'ablutions', labelKey: 'mosque.ablutions' },
  { key: 'parking', labelKey: 'mosque.parking' },
  { key: 'toilets', labelKey: 'mosque.toilets' },
];

const FEATURE_OPTIONS: Array<{
  value: UserMosqueFeatureState;
  labelKey: 'mosque.optionYes' | 'mosque.optionNo' | 'mosque.optionLimited' | 'mosque.optionUnknown';
}> = [
  { value: 'yes', labelKey: 'mosque.optionYes' },
  { value: 'no', labelKey: 'mosque.optionNo' },
  { value: 'limited', labelKey: 'mosque.optionLimited' },
  { value: 'unknown', labelKey: 'mosque.optionUnknown' },
];

function clean(value: string) {
  return value.trim();
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

function formatAddress(address: Location.LocationGeocodedAddress) {
  return [
    address.name,
    address.street,
    address.postalCode,
    address.city,
    address.region,
  ]
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .join(', ');
}

export default function AddMosqueScreen() {
  const { t } = useI18n();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapQuery, setMapQuery] = useState('');
  const [searchingMap, setSearchingMap] = useState(false);
  const [nearbyMapMosques, setNearbyMapMosques] = useState<NearbyMosque[]>([]);
  const mapRef = useRef<MapView>(null);

  const openMapPicker = async () => {
    setMapVisible((visible) => !visible);
    try {
      const position = selectedCoordinates ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })).coords;
      const mosques = await getNearbyMosques(position.latitude, position.longitude);
      setNearbyMapMosques(mosques);
    } catch {
      setNearbyMapMosques([]);
    }
  };

  const selectMapLocation = async (event: MapPressEvent) => {
    const coordinates = event.nativeEvent.coordinate;
    setSelectedCoordinates(coordinates);
    setLocationMessage(t('mosque.addMapSelected'));
    try {
      const addresses = await Location.reverseGeocodeAsync(coordinates);
      const address = addresses[0];
      if (!address) return;
      setValues((current) => ({
        ...current,
        address: [address.name, address.street]
          .filter(Boolean)
          .filter((item, index, items) => items.indexOf(item) === index)
          .join(', '),
        postalCode: address.postalCode ?? current.postalCode,
        city: address.city ?? address.district ?? current.city,
      }));
    } catch {
      // L'emplacement reste utilisable même si l'adresse ne peut pas être lue.
    }
  };

  const searchMapLocation = async () => {
    const query = clean(mapQuery);
    if (!query) return;
    setSearchingMap(true);
    try {
      const results = await Location.geocodeAsync(query);
      const first = results[0];
      if (!first) {
        setLocationMessage(t('mosque.addMapNotFound'));
        return;
      }
      await selectMapLocation({
        nativeEvent: {
          coordinate: { latitude: first.latitude, longitude: first.longitude },
        },
      } as MapPressEvent);
      mapRef.current?.animateToRegion({
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 500);
    } catch {
      setLocationMessage(t('mosque.addMapSearchError'));
    } finally {
      setSearchingMap(false);
    }
  };

  const updateValue = <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }));

    if (key === 'address') {
      setSelectedCoordinates(null);
      setLocationMessage(null);
    }
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const email = clean(values.email);
    const website = clean(values.website);

    if (!clean(values.name)) nextErrors.name = t('mosque.addErrorName');
    if (!clean(values.address) || !clean(values.postalCode) || !clean(values.city)) {
      nextErrors.address = t('mosque.addErrorAddress');
    }
    if (email && !isValidEmail(email)) nextErrors.email = t('mosque.addErrorEmail');
    if (website && !isValidUrl(website)) {
      nextErrors.website = t('mosque.addErrorWebsite');
    }

    return nextErrors;
  };

  const requestCurrentLocation = async () => {
    if (locating) return;

    setLocating(true);
    setLocationMessage(null);

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationMessage(t('mosque.addLocationDenied'));
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setSelectedCoordinates(coordinates);

      try {
        const addresses = await Location.reverseGeocodeAsync(coordinates);
        const formattedAddress = addresses[0]
          ? formatAddress(addresses[0])
          : '';

        if (formattedAddress) {
          setValues((current) => ({
            ...current,
            address: formattedAddress,
          }));
          setErrors((current) => ({
            ...current,
            address: undefined,
            form: undefined,
          }));
        }
      } catch {
        // Les coordonnées restent utilisables même si l'adresse ne remonte pas.
      }

      setLocationMessage(t('mosque.addLocationFound'));
    } catch {
      setLocationMessage(t('mosque.addLocationUnavailable'));
    } finally {
      setLocating(false);
    }
  };

  const resolveCoordinates = async (): Promise<Coordinates> => {
    if (selectedCoordinates) return selectedCoordinates;

    const address = [values.address, values.postalCode, values.city]
      .map(clean)
      .filter(Boolean)
      .join(', ');
    const results = await Location.geocodeAsync(address);
    const result = results[0];

    if (!result) {
      throw new Error('MOSQUE_ADDRESS_NOT_FOUND');
    }

    return {
      latitude: result.latitude,
      longitude: result.longitude,
    };
  };

  const save = async () => {
    if (saving) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);

    try {
      const coordinates = await resolveCoordinates();

      const createdMosque = await createUserMosque({
        name: clean(values.name),
        address: [values.address, values.postalCode, values.city]
          .map(clean)
          .filter(Boolean)
          .join(', '),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
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

      const publishedImmediately =
        createdMosque.validationStatus === 'approved';

      Alert.alert(
        publishedImmediately ? t('mosque.addPublishedTitle') : t('mosque.addSentTitle'),
        publishedImmediately ? t('mosque.addPublishedText') : t('mosque.addSentText'),
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'MOSQUE_ADDRESS_NOT_FOUND'
      ) {
        setErrors({
          address: t('mosque.addErrorAddressNotFound'),
        });
      } else if (
        error instanceof Error &&
        error.message === 'USER_MOSQUE_AUTH_REQUIRED'
      ) {
        setErrors({
          form: t('mosque.addErrorAuth'),
        });
      } else {
        setErrors({
          form: t('mosque.addErrorSend'),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    key: keyof FormValues,
    label: string,
    options: {
      required?: boolean;
      keyboardType?:
        | 'default'
        | 'email-address'
        | 'phone-pad';
      multiline?: boolean;
      placeholder?: string;
    } = {},
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {options.required ? ' *' : ''}
      </Text>

      <TextInput
        value={String(values[key])}
        onChangeText={(text) =>
          updateValue(key, text as FormValues[typeof key])
        }
        onEndEditing={
          key === 'postalCode'
            ? () => void lookupCityFromPostalCode()
            : undefined
        }
        placeholder={options.placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={options.keyboardType ?? 'default'}
        multiline={options.multiline}
        textAlignVertical={options.multiline ? 'top' : 'center'}
        style={[
          styles.input,
          options.multiline && styles.multilineInput,
        ]}
      />

      {errors[key] ? (
        <Text style={styles.error}>{errors[key]}</Text>
      ) : null}
    </View>
  );

  const lookupCityFromPostalCode = async () => {
    const postalCode = clean(values.postalCode);
    if (postalCode.length < 4) return;

    try {
      const results = await Location.geocodeAsync(postalCode);
      const first = results[0];
      if (!first) return;

      const addresses = await Location.reverseGeocodeAsync({
        latitude: first.latitude,
        longitude: first.longitude,
      });
      const city = addresses[0]?.city || addresses[0]?.district;
      if (city) updateValue('city', city);
    } catch {
      // La ville reste saisissable manuellement si le service est indisponible.
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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

        <Text style={styles.title}>{t('mosque.addTitle')}</Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.intro}>
          {t('mosque.addIntro')}
        </Text>

        <Text style={styles.sectionTitle}>
          {t('mosque.addMainInfo')}
        </Text>

        {renderInput('name', t('mosque.addName'), {
          required: true,
        })}

        {renderInput('address', t('mosque.addAddress'), {
          required: true,
          placeholder: t('mosque.addAddressPlaceholder'),
        })}

        <View style={styles.addressRow}>
          <View style={styles.addressPostalField}>
            {renderInput('postalCode', t('mosque.addPostalCode'), {
              required: true,
              keyboardType: 'phone-pad',
            })}
          </View>
          <View style={styles.addressCityField}>
            {renderInput('city', t('mosque.addCity'), { required: true })}
          </View>
        </View>

        <View style={styles.locationButtonWrap}>
          <Pressable
            onPress={() => void requestCurrentLocation()}
            disabled={locating}
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.pressed,
              locating && styles.disabled,
            ]}
          >
            {locating ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Ionicons
                name="locate-outline"
                size={19}
                color={colors.background}
              />
            )}

            <Text style={styles.locationButtonText}>
              {locating
                ? t('mosques.searching')
                : t('mosque.addUseCurrentLocation')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void openMapPicker()}
            style={({ pressed }) => [
              styles.mapButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="map-outline" size={19} color={colors.goldLight} />
            <Text style={styles.mapButtonText}>{t('mosque.addChooseOnMap')}</Text>
          </Pressable>

          {mapVisible ? (
            <View style={styles.mapPickerWrap}>
              <View style={styles.mapSearchRow}>
                <TextInput
                  value={mapQuery}
                  onChangeText={setMapQuery}
                  onSubmitEditing={() => void searchMapLocation()}
                  placeholder={t('mosque.addMapSearchPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="search"
                  style={styles.mapSearchInput}
                />
                <Pressable
                  onPress={() => void searchMapLocation()}
                  disabled={searchingMap}
                  style={styles.mapSearchButton}
                >
                  {searchingMap ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Ionicons name="search" size={18} color={colors.background} />
                  )}
                </Pressable>
              </View>
              <MapView
                ref={mapRef}
                style={styles.mapPicker}
                initialRegion={{
                  latitude: selectedCoordinates?.latitude ?? 46.603354,
                  longitude: selectedCoordinates?.longitude ?? 1.888334,
                  latitudeDelta: selectedCoordinates ? 0.03 : 10,
                  longitudeDelta: selectedCoordinates ? 0.03 : 10,
                }}
                onPress={(event) => void selectMapLocation(event)}
              >
                {nearbyMapMosques.map((mosque) => (
                  <Marker
                    key={`nearby-${mosque.id}`}
                    coordinate={{ latitude: mosque.latitude, longitude: mosque.longitude }}
                    title={mosque.name}
                    description={mosque.address}
                    onCalloutPress={() => router.push({ pathname: '/mosque/[id]', params: { id: mosque.id, name: mosque.name, address: mosque.address, latitude: String(mosque.latitude), longitude: String(mosque.longitude), distance: mosque.distanceLabel, source: mosque.source, sourceUrl: mosque.sourceUrl ?? '' } })}
                  />
                ))}
                {selectedCoordinates ? <Marker coordinate={selectedCoordinates} /> : null}
              </MapView>
              <Text style={styles.mapHint}>{t('mosque.addMapHint')}</Text>
            </View>
          ) : null}

          {locationMessage ? (
            <Text style={styles.helper}>{locationMessage}</Text>
          ) : (
            <Text style={styles.helper}>
              {t('mosque.addCoordinatesHelp')}
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>
          {t('mosque.addMoreInfo')}
        </Text>

        {renderInput('alternativeName', t('mosque.addAlternativeName'))}
        {renderInput('arabicName', t('mosque.arabicName'))}
        {renderInput('phone', t('mosque.phone'), {
          keyboardType: 'phone-pad',
        })}
        {renderInput('email', t('mosque.email'), {
          keyboardType: 'email-address',
        })}
        {renderInput('website', t('mosque.website'), {
          placeholder: 'https://…',
        })}
        {renderInput('openingHours', t('mosque.openingHours'), {
          multiline: true,
        })}
        {renderInput('operator', t('mosque.operator'))}
        {renderInput('denomination', t('mosque.addDenomination'))}

        <Text style={styles.sectionTitle}>
          {t('mosque.addFacilities')}
        </Text>

        {FEATURE_FIELDS.map(({ key, labelKey }) => (
          <View key={key} style={styles.choiceField}>
            <Text style={styles.label}>{t(labelKey)}</Text>

            <View style={styles.choiceRow}>
              {FEATURE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => updateValue(key, option.value)}
                  style={[
                    styles.choice,
                    values[key] === option.value &&
                      styles.choiceSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      values[key] === option.value &&
                        styles.choiceTextSelected,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>
          {t('mosque.addLanguagesServices')}
        </Text>

        {renderInput('languages', t('mosque.addLanguages'), {
          placeholder: t('mosque.addLanguagesPlaceholder'),
        })}

        {renderInput(
          'serviceTimes',
          t('mosque.addServiceTimes'),
          {
            multiline: true,
            placeholder: t('mosque.addServiceTimesPlaceholder'),
          },
        )}

        {errors.form ? (
          <Text style={styles.formError}>{errors.form}</Text>
        ) : null}

        <Pressable
          onPress={() => void save()}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.pressed,
            saving && styles.disabled,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.background} />
          ) : null}

          <Text style={styles.saveButtonText}>
            {saving
              ? t('mosque.sending')
              : t('mosque.addSubmit')}
          </Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  headerButtonPlaceholder: {
    width: 42,
  },
  title: {
    fontFamily: typography.sans,
    color: colors.text,
    fontSize: 21,
    fontWeight: typography.sansBold,
  },
  content: {
    padding: 20,
    paddingBottom: 44,
  },
  intro: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
  },
  sectionTitle: {
    fontFamily: typography.sans,
    color: colors.goldLight,
    fontSize: 18,
    fontWeight: typography.sansBold,
    marginTop: 18,
    marginBottom: 13,
  },
  field: {
    marginBottom: 14,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addressPostalField: {
    flex: 0.8,
  },
  addressCityField: {
    flex: 1.2,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 7,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 82,
    paddingTop: 13,
  },
  error: {
    color: '#F28B82',
    fontSize: 12,
    marginTop: 5,
  },
  formError: {
    color: '#F28B82',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  locationButtonWrap: {
    marginBottom: 14,
  },
  mapButton: {
    minHeight: 48,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.goldLight,
    backgroundColor: colors.card,
  },
  mapButtonText: {
    color: colors.goldLight,
    fontSize: 14,
    fontWeight: '700',
  },
  mapPickerWrap: {
    marginTop: 12,
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  mapSearchRow: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapSearchInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  mapSearchButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.goldLight,
  },
  mapPicker: {
    width: '100%',
    height: 230,
  },
  mapHint: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  locationButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: colors.goldLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  locationButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
  helper: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  choiceField: {
    marginBottom: 14,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  choice: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
  },
  choiceSelected: {
    backgroundColor: colors.goldLight,
    borderColor: colors.goldLight,
  },
  choiceText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  choiceTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 14,
    marginTop: 22,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.55,
  },
});
