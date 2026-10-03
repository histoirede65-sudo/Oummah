import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { BOYCOTT_CATEGORY_LABELS, type BoycottEntity } from '../../features/boycott/domain/BoycottEntity';

export default function BoycottEntityCard({ item, onPress }: { item: BoycottEntity; onPress: () => void }) {
  const name = typeof item?.name === 'string' && item.name.trim() ? item.name.trim() : 'Marque';
  const categoryLabel = BOYCOTT_CATEGORY_LABELS[item?.category] ?? 'Autres';
  const parentGroup = typeof item?.parentGroup === 'string' && item.parentGroup.trim() ? item.parentGroup.trim() : undefined;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.logo}><Text style={styles.logoText}>{name.slice(0, 1).toUpperCase()}</Text></View>
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{categoryLabel}{parentGroup ? ` · ${parentGroup}` : ''}</Text>
        <View style={styles.badge}><View style={styles.dot} /><Text style={styles.badgeText}>À BOYCOTTER</Text></View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 22, backgroundColor: 'rgba(22,16,31,0.94)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  pressed: { opacity: 0.78 },
  logo: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  logoText: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23 },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 18 },
  meta: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5 },
  badge: { alignSelf: 'flex-start', marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, height: 23, borderRadius: 12, backgroundColor: 'rgba(175,35,44,0.16)', borderWidth: 1, borderColor: 'rgba(236,79,87,0.32)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF5960' },
  badgeText: { color: '#FF8A90', fontFamily: typography.sans, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.7 },
});
