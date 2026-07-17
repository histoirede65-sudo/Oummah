import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Polygon } from 'react-native-svg';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useI18n } from '../i18n';

type DalilCardProps = { onPress?: () => void };

function IslamicPattern() {
  return (
    <Svg width={142} height={142} viewBox="0 0 142 142">
      <G fill="none" stroke={colors.border} strokeWidth={0.8} opacity={0.42}>
        <Circle cx={71} cy={71} r={53} />
        <Circle cx={71} cy={71} r={37} />
        <Polygon points="71,8 84,42 118,24 100,58 134,71 100,84 118,118 84,100 71,134 58,100 24,118 42,84 8,71 42,58 24,24 58,42" />
        <Polygon points="71,19 87,50 123,45 92,66 111,97 78,83 57,114 62,78 26,71 62,64 51,29 71,56 94,30 80,63" />
        <Path d="M71 31c8 17 22 25 40 24-14 12-19 27-13 44-16-8-32-5-45 7 3-18-4-32-20-41 18-3 30-13 38-34Z" />
        <Path d="M71 18 82 54l34-15-21 31 31 21-36-8-7 36-12-34-34 15 20-31-31-20 36 8 9-39Z" />
      </G>
    </Svg>
  );
}

export default function DalilCard({ onPress }: DalilCardProps) {
  const { t } = useI18n();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <LinearGradient colors={[colors.surfaceAlt, colors.surface]} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.pattern}>
        <IslamicPattern />
      </View>
      <View style={styles.iconCircle}>
        <Ionicons name="book-outline" size={28} color={colors.primaryLight} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('home.dalilToday')}</Text>
        <Text numberOfLines={2} style={styles.quote}>{t('home.dalilQuote')}</Text>
        <Text style={styles.reference}>{t('home.dalilReference')}</Text>
      </View>
      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={18} color={colors.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 112,
    marginBottom: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(43,21,63,0.72)',
  },
  content: { flex: 1, minWidth: 0, marginLeft: 11 },
  title: {
    color: colors.primaryLight,
    fontFamily: typography.serifMedium,
    fontSize: 18,
    fontWeight: '400',
  },
  quote: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 18,
  },
  reference: { marginTop: 3, color: colors.primary, fontFamily: typography.sans, fontSize: 10.5 },
  arrow: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(21,12,36,0.72)',
  },
  pattern: {
    position: 'absolute',
    top: -15,
    right: 16,
  },
  pressed: { opacity: 0.7 },
});
