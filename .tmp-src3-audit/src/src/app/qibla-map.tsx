import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  bearingToCardinal,
  calculateDistanceToKaabaKm,
  calculateQiblaBearing,
  KAABA_COORDINATES,
} from '../features/qibla/qiblaMath';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type UserPosition = {
  latitude: number;
  longitude: number;
};

export default function QiblaMapScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function load() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        if (!cancelled) setPermissionDenied(true);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (cancelled) return;

      const next = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setPosition(next);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 500,
          timeInterval: 30000,
        },
        (location) => {
          setPosition({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        },
      );
    }

    void load();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  const qiblaBearing = useMemo(
    () =>
      position
        ? calculateQiblaBearing(position.latitude, position.longitude)
        : null,
    [position],
  );

  const distance = useMemo(
    () =>
      position
        ? calculateDistanceToKaabaKm(position.latitude, position.longitude)
        : null,
    [position],
  );

  const initialRegion: Region = position
    ? {
        ...position,
        latitudeDelta: 0.018,
        longitudeDelta: 0.018,
      }
    : {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };

  const recenter = () => {
    if (!position) return;
    mapRef.current?.animateToRegion(
      {
        ...position,
        latitudeDelta: 0.018,
        longitudeDelta: 0.018,
      },
      450,
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={23} color={colors.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>QIBLA</Text>
          <Text style={styles.title}>Vue carte</Text>
        </View>
        <Pressable onPress={recenter} style={styles.iconButton}>
          <Ionicons name="locate-outline" size={22} color={colors.goldLight} />
        </Pressable>
      </View>

      {permissionDenied ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={42} color={colors.goldLight} />
          <Text style={styles.emptyTitle}>Localisation indisponible</Text>
          <Text style={styles.emptyText}>
            Autorisez la localisation pour afficher la ligne vers la Kaaba.
          </Text>
        </View>
      ) : (
        <View style={styles.mapShell}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass
            rotateEnabled
          >
            {position ? (
              <>
                <Marker coordinate={position} title="Votre position" />
                <Marker coordinate={KAABA_COORDINATES} title="La Kaaba" pinColor={colors.gold} />
                <Polyline
                  coordinates={[position, KAABA_COORDINATES]}
                  strokeColor={colors.goldLight}
                  strokeWidth={4}
                  geodesic
                />
              </>
            ) : null}
          </MapView>

          <LinearGradient
            pointerEvents="none"
            colors={['rgba(8,7,19,0.78)', 'transparent', 'rgba(8,7,19,0.5)']}
            locations={[0, 0.34, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="navigate" size={22} color="#130B1B" />
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>Direction depuis votre position</Text>
              <Text style={styles.infoValue}>
                {qiblaBearing === null
                  ? 'Calcul en cours...'
                  : `${Math.round(qiblaBearing)}° • ${bearingToCardinal(qiblaBearing)}`}
              </Text>
              <Text style={styles.infoDistance}>
                {distance === null
                  ? 'Localisation en cours'
                  : `La Mecque à environ ${Math.round(distance).toLocaleString('fr-FR')} km`}
              </Text>
            </View>
          </View>

          <View style={styles.modeRow}>
            <Pressable onPress={() => router.replace('/qibla')} style={styles.modeButton}>
              <Ionicons name="compass-outline" size={19} color={colors.textSecondary} />
              <Text style={styles.modeText}>Boussole</Text>
            </Pressable>
            <View style={[styles.modeButton, styles.modeActive]}>
              <Ionicons name="map" size={19} color="#130B1B" />
              <Text style={styles.modeActiveText}>Carte</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 70,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(28,18,42,0.84)',
  },
  headerCopy: { alignItems: 'center' },
  eyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 26,
  },
  mapShell: { flex: 1, overflow: 'hidden' },
  infoCard: {
    position: 'absolute',
    top: 16,
    right: 16,
    left: 16,
    minHeight: 92,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(227,181,90,0.35)',
    backgroundColor: 'rgba(16,10,25,0.92)',
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldLight,
  },
  infoCopy: { flex: 1 },
  infoLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 22,
    lineHeight: 25,
  },
  infoDistance: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: '700',
  },
  modeRow: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    left: 16,
    flexDirection: 'row',
    borderRadius: 19,
    backgroundColor: 'rgba(17,11,27,0.94)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    height: 44,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  modeActive: { backgroundColor: colors.goldLight },
  modeText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  modeActiveText: {
    color: '#130B1B',
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 28,
    marginTop: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },
});
