import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { useI18n, type TranslationKey } from '../i18n';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const curve = {
  start: { x: 7, y: 112 },
  control: { x: 200, y: 56 },
  end: { x: 393, y: 112 },
};

function pointOnCurve(t: number) {
  const u = 1 - t;

  return {
    x: u ** 2 * curve.start.x + 2 * u * t * curve.control.x + t ** 2 * curve.end.x,
    y: u ** 2 * curve.start.y + 2 * u * t * curve.control.y + t ** 2 * curve.end.y,
  };
}

const prayerPositions = [0.08, 0.29, 0.5, 0.67, 0.84, 0.96];

const prayers = [
  { nameKey: 'prayer.fajr', time: '05:24' },
  { nameKey: 'prayer.sunrise', time: '06:59' },
  { nameKey: 'prayer.dhuhr', time: '13:15', active: true },
  { nameKey: 'prayer.asr', time: '16:57' },
  { nameKey: 'prayer.maghrib', time: '21:28' },
  { nameKey: 'prayer.isha', time: '22:59' },
].map((prayer, index) => ({ ...prayer, ...pointOnCurve(prayerPositions[index]) }));

export default function PrayerCard() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const compact = width < 370;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Image
        source={require('../../assets/images/mosquee-hero.png')}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        style={styles.mosque}
      />
      <LinearGradient
        colors={['rgba(8,7,19,0.18)', 'rgba(8,7,19,0.01)', 'rgba(8,7,19,0.55)']}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(7,4,19,0.84)', 'rgba(10,5,24,0.69)', 'rgba(10,5,24,0.04)']}
        locations={[0, 0.4, 0.72]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.info}>
        <Text style={styles.eyebrow}>{t('prayer.next')}</Text>
        <Text style={[styles.name, compact && styles.nameCompact]}>{t('prayer.dhuhr')}</Text>
        <Text style={[styles.countdown, compact && styles.countdownCompact]}>01:48:32</Text>
        <Text style={[styles.date, compact && styles.dateCompact]}>{t('prayer.date')}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={12} color={colors.primaryLight} />
          <Text style={styles.location}>{t('prayer.location')}</Text>
          <Ionicons name="chevron-down" size={12} color={colors.text} />
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.adhan, compact && styles.adhanCompact, pressed && styles.pressed]}>
        <Ionicons name="volume-medium-outline" size={16} color={colors.primaryLight} />
        <Text style={styles.adhanText}>{t('prayer.adhan')}</Text>
      </Pressable>

      <View style={styles.timeline}>
        <Svg width="100%" height="114" viewBox="0 0 400 114">
          <Path
            d="M 7 112 Q 200 56 393 112"
            fill="none"
            stroke={colors.primary}
            strokeWidth={1}
          />
          {prayers.filter((prayer) => prayer.active).map((prayer) => (
            <Circle
              key={`${prayer.nameKey}-glow`}
              cx={prayer.x}
              cy={prayer.y}
              r={15}
              fill="rgba(240,217,154,0.13)"
            />
          ))}
          {prayers.filter((prayer) => !prayer.active).map((prayer) => (
            <Circle
              key={`${prayer.nameKey}-glow`}
              cx={prayer.x}
              cy={prayer.y}
              r={7.5}
              fill="rgba(227,181,90,0.14)"
            />
          ))}
          {prayers.map((prayer) => (
            <Circle
              key={`${prayer.nameKey}-outer`}
              cx={prayer.x}
              cy={prayer.y}
              r={prayer.active ? 10 : 4.3}
              fill={prayer.active ? 'rgba(16,10,36,0.86)' : colors.primaryLight}
              stroke={colors.primaryLight}
              strokeWidth={prayer.active ? 2 : 1}
            />
          ))}
          {prayers.filter((prayer) => prayer.active).map((prayer) => (
            <Circle
              key={`${prayer.nameKey}-inner`}
              cx={prayer.x}
              cy={prayer.y}
              r={6.5}
              fill={colors.primary}
            />
          ))}
          {prayers.map((prayer) => (
            <SvgText
              key={`${prayer.nameKey}-label`}
              x={prayer.x}
              y={Math.max(13, prayer.y - 25)}
              fill={colors.text}
              fontSize={prayer.nameKey === 'prayer.sunrise' ? 8.4 : 9.2}
              fontWeight="600"
              textAnchor="middle"
            >
              {t(prayer.nameKey as TranslationKey)}
            </SvgText>
          ))}
          {prayers.map((prayer) => (
            <SvgText
              key={`${prayer.nameKey}-time`}
              x={prayer.x}
              y={Math.max(26, prayer.y - 12)}
              fill={prayer.active ? colors.primaryLight : colors.textSecondary}
              fontSize={8.3}
              fontWeight={prayer.active ? '700' : '500'}
              textAnchor="middle"
            >
              {prayer.time}
            </SvgText>
          ))}
        </Svg>
      </View>

      <View style={styles.downButton}>
        <Ionicons name="chevron-down" size={20} color={colors.text} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 264,
    marginBottom: 8,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardCompact: { height: 254 },
  mosque: {
    position: 'absolute',
    top: 0,
    right: '-6%',
    bottom: 0,
    left: '-2%',
    width: '108%',
    height: '100%',
  },
  info: {
    position: 'absolute',
    top: 20,
    left: 18,
    width: '48%',
  },
  eyebrow: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: '500',
  },
  name: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 35,
    fontWeight: '400',
  },
  nameCompact: { fontSize: 31 },
  countdown: {
    marginTop: -2,
    color: colors.primaryLight,
    fontFamily: typography.serifMedium,
    fontSize: 29,
    fontWeight: '400',
    letterSpacing: 1.2,
  },
  countdownCompact: { fontSize: 25, letterSpacing: 0.5 },
  date: {
    marginTop: 1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: '500',
  },
  dateCompact: { fontSize: 9.5 },
  locationRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    marginHorizontal: 4,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: '500',
  },
  adhan: {
    position: 'absolute',
    top: 10,
    right: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(21,12,36,0.86)',
  },
  adhanCompact: { right: 9, paddingHorizontal: 10 },
  adhanText: {
    marginLeft: 5,
    color: colors.primaryLight,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  timeline: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
  },
  downButton: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    width: 34,
    height: 27,
    marginLeft: -17,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#60406F',
    backgroundColor: '#2A153D',
  },
  pressed: {
    opacity: 0.6,
  },
});
