import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import type { HalalCoordinates, HalalPlace } from '../../features/halal/domain/HalalPlace';
import { colors } from '../../theme/colors';

type HalalMapProps = {
  origin: HalalCoordinates;
  places: HalalPlace[];
  selectedId?: string;
  onSelect: (place: HalalPlace) => void;
};

export default function HalalMap({ origin, places, selectedId, onSelect }: HalalMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const region: Region = { ...origin, latitudeDelta: 0.085, longitudeDelta: 0.085 };

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 420);
  }, [origin.latitude, origin.longitude]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
    >
      {places.map((place) => {
        const selected = place.id === selectedId;
        return (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            title={place.name}
            description={place.verificationLabel}
            onPress={() => onSelect(place)}
          >
            <View style={[styles.marker, selected && styles.markerSelected]}>
              <Ionicons name="restaurant" size={selected ? 18 : 15} color={selected ? colors.background : colors.goldLight} />
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.goldLight,
    backgroundColor: 'rgba(21,12,36,0.96)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  markerSelected: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.goldLight },
});
