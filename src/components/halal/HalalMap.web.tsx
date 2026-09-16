import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { HalalCoordinates, HalalPlace } from '../../features/halal/domain/HalalPlace';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type HalalMapProps = {
  origin: HalalCoordinates;
  places: HalalPlace[];
  selectedId?: string;
  onSelect: (place: HalalPlace) => void;
};

export default function HalalMap({ places }: HalalMapProps) {
  return (
    <View style={styles.empty}>
      <Ionicons name="map-outline" size={42} color={colors.goldLight} />
      <Text style={styles.title}>Carte disponible sur mobile</Text>
      <Text style={styles.text}>{places.length} établissement{places.length > 1 ? 's' : ''} dans cette zone. Utilisez la vue Liste sur le web.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, backgroundColor: colors.backgroundSecondary },
  title: { marginTop: 13, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  text: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
