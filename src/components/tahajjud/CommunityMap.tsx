import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import type { DuaMapZone } from '../../features/tahajjud/duaWall';
import type { LiveZone } from '../../features/tahajjud/tahajjudCommunity';
import { night, nightType } from './theme';

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

/** Dua pin: praying hands in a lavender bubble, with the number of duas of the zone. */
function DuaPin({ count }: { count: number }) {
  return (
    <View style={styles.pin}>
      <View style={styles.pinBubble}>
        <Ionicons name="hand-left" size={16} color={night.sky0} />
      </View>
      {count > 1 ? <View style={styles.pinCount}><Text style={styles.pinCountText}>{count > 99 ? '99+' : count}</Text></View> : null}
      <View style={styles.pinTip} />
    </View>
  );
}

/**
 * Lights of the Oummah: one glowing halo per zone (≥ 3 members, ~28 km), never a precise point.
 * The halo grows with the number of members in the zone. Dua pins show where duas were shared.
 */
export function CommunityMap({ zones, duaZones = [], onPressDuaZone, height = 300 }: {
  zones: readonly LiveZone[];
  duaZones?: readonly DuaMapZone[];
  onPressDuaZone?: (zone: DuaMapZone) => void;
  height?: number;
}) {
  // Custom marker views must be rendered once before being frozen (Android performance).
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    setTracks(true);
    const timer = setTimeout(() => setTracks(false), 800);
    return () => clearTimeout(timer);
  }, [duaZones]);

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
        {duaZones.map((zone) => (
          <Marker
            key={`dua-${zone.lat},${zone.lng}`}
            coordinate={{ latitude: zone.lat, longitude: zone.lng }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={tracks}
            onPress={() => onPressDuaZone?.(zone)}
          >
            <DuaPin count={zone.count} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: { alignItems: 'center', paddingTop: 6, paddingRight: 8 },
  pinBubble: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: night.lavender, borderWidth: 2, borderColor: '#FFFFFF',
  },
  pinTip: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFFFFF', marginTop: -1 },
  pinCount: {
    position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center', backgroundColor: night.gold,
  },
  pinCountText: { color: night.sky0, fontSize: 10, ...nightType.bold },
  wrap: { overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: night.goldLine, backgroundColor: night.sky1 },
});
