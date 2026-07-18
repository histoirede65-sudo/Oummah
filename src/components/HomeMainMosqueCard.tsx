import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    getMainMosque,
    type StoredMosque,
} from '../features/mosques/data/mosquePreferences';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

function openMosqueDetails(mosque: StoredMosque) {
  router.push({
    pathname: '/mosque/[id]',
    params: {
      id: mosque.id,
      name: mosque.name,
      address: mosque.address,
      latitude: String(mosque.latitude),
      longitude: String(mosque.longitude),
      distance: mosque.distanceLabel ?? '',
      phone: mosque.phone ?? '',
      website: mosque.website ?? '',
      openingHours: mosque.openingHours ?? '',
    },
  } as Href);
}

async function openDirections(mosque: StoredMosque) {
  const destination = `${mosque.latitude},${mosque.longitude}`;
  const url =
    `https://www.google.com/maps/dir/?api=1&destination=` +
    encodeURIComponent(destination);

  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert(
        'Itinéraire indisponible',
        'Aucune application compatible ne peut ouvrir cet itinéraire.',
      );
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Itinéraire indisponible',
      'Impossible d’ouvrir l’itinéraire pour le moment.',
    );
  }
}

export default function HomeMainMosqueCard() {
  const [mainMosque, setMainMosque] =
    useState<StoredMosque | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMainMosque = useCallback(async () => {
    setLoading(true);

    try {
      const mosque = await getMainMosque();
      setMainMosque(mosque);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMainMosque();
    }, [loadMainMosque]),
  );

  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator
          size="small"
          color={colors.goldLight}
        />
        <Text style={styles.loadingText}>
          Chargement de votre mosquée…
        </Text>
      </View>
    );
  }

  if (!mainMosque) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choisir ma mosquée"
        onPress={() => router.push('/mosques' as Href)}
        style={({ pressed }) => [
          styles.emptyCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.emptyIcon}>
          <Ionicons
            name="business-outline"
            size={27}
            color={colors.goldLight}
          />
        </View>

        <View style={styles.emptyCopy}>
          <Text style={styles.eyebrow}>MA MOSQUÉE</Text>
          <Text style={styles.emptyTitle}>
            Choisissez votre mosquée principale
          </Text>
          <Text style={styles.emptyText}>
            Retrouvez-la directement depuis l’accueil d’OUMMAH.
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={21}
          color={colors.goldLight}
        />
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.glow} />

      <View style={styles.topRow}>
        <View style={styles.icon}>
          <Ionicons
            name="home"
            size={25}
            color={colors.background}
          />
        </View>

        <View style={styles.copy}>
          <Text style={styles.eyebrow}>MA MOSQUÉE</Text>
          <Text numberOfLines={2} style={styles.name}>
            {mainMosque.name}
          </Text>
          <View style={styles.addressRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.goldLight}
            />
            <Text numberOfLines={2} style={styles.address}>
              {mainMosque.address}
            </Text>
          </View>
        </View>
      </View>

      {mainMosque.distanceLabel ? (
        <View style={styles.distanceRow}>
          <Ionicons
            name="walk-outline"
            size={15}
            color={colors.goldLight}
          />
          <Text style={styles.distance}>
            {mainMosque.distanceLabel}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ouvrir la fiche de ma mosquée"
          onPress={() => openMosqueDetails(mainMosque)}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.background}
          />
          <Text style={styles.primaryButtonText}>
            Voir la fiche
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Itinéraire vers ma mosquée"
          onPress={() => void openDirections(mainMosque)}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="navigate-outline"
            size={18}
            color={colors.goldLight}
          />
          <Text style={styles.secondaryButtonText}>
            Itinéraire
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    minHeight: 86,
    marginBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
  },
  emptyCard: {
    minHeight: 112,
    marginBottom: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  emptyIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(126,72,148,0.20)',
  },
  emptyCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },
  eyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  emptyTitle: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
    lineHeight: 23,
  },
  emptyText: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 17,
  },
  card: {
    overflow: 'hidden',
    marginBottom: 10,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(224,188,112,0.46)',
    backgroundColor: colors.surfaceAlt,
  },
  glow: {
    position: 'absolute',
    top: -75,
    right: -45,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(126,72,148,0.25)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: colors.goldLight,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
  },
  name: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 21,
    lineHeight: 26,
  },
  addressRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  address: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  distanceRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distance: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: '700',
  },
  actions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 9,
  },
  primaryButton: {
    flex: 1,
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 15,
    backgroundColor: colors.goldLight,
  },
  primaryButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  secondaryButtonText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
});