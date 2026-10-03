import { StyleSheet, View } from 'react-native';
import MapView, { Circle } from 'react-native-maps';
import type { LiveZone } from '../../features/tahajjud/tahajjudCommunity';
import { night } from './theme';

/** Google Maps night style (Android); iOS uses Apple Maps' dark mode. */
const NIGHT_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0b0820' }] },
  { elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ visibility: 'on' }, { color: '#2b2357' }, { weight: 0.6 }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#171035' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#05040e' }] },
];

/**
 * Lights of the Oummah: one glowing halo per zone (≥ 3 members, ~28 km), never a precise point.
 * The halo grows with the number of members in the zone.
 */
export function CommunityMap({ zones, height = 300 }: { zones: readonly LiveZone[]; height?: number }) {
  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: 30, longitude: 15, latitudeDelta: 110, longitudeDelta: 160 }}
        customMapStyle={NIGHT_STYLE}
        userInterfaceStyle="dark"
        showsPointsOfInterests={false}
        showsBuildings={false}
        showsTraffic={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {zones.map((zone) => {
          const radius = 40_000 + Math.sqrt(zone.count) * 22_000;
          return [
            <Circle key={`${zone.lat},${zone.lng}-glow`} center={{ latitude: zone.lat, longitude: zone.lng }} radius={radius * 2.4} fillColor="rgba(244,217,149,0.10)" strokeWidth={0} />,
            <Circle key={`${zone.lat},${zone.lng}`} center={{ latitude: zone.lat, longitude: zone.lng }} radius={radius} fillColor="rgba(244,217,149,0.55)" strokeColor={night.goldSoft} strokeWidth={1} />,
          ];
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: night.goldLine, backgroundColor: night.sky1 },
});
