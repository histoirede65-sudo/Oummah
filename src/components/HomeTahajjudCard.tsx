import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { MosquePrayerSchedule } from '../features/mosques/data/mosquePrayerTimes';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = { schedule: MosquePrayerSchedule | null };

function time(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function HomeTahajjudCard({ schedule }: Props) {
  const [now, setNow] = useState(Date.now());
  useFocusEffect(useCallback(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []));

  const isha = schedule?.prayers.find(prayer => prayer.key === 'Isha')?.timestamp;
  const maghrib = schedule?.prayers.find(prayer => prayer.key === 'Maghrib')?.timestamp;
  const todayFajr = schedule?.prayers.find(prayer => prayer.key === 'Fajr')?.timestamp;
  const tomorrowFajr = schedule?.tomorrowFajr.timestamp;
  if (!isha || !maghrib || !todayFajr || !tomorrowFajr) return null;

  const beforeFajr = now < todayFajr;
  const afterIsha = now >= isha && now < tomorrowFajr;
  if (!beforeFajr && !afterIsha) return null;

  const fajr = beforeFajr ? todayFajr : tomorrowFajr;
  const lastThird = afterIsha ? maghrib + (tomorrowFajr - maghrib) * 2 / 3 : null;
  const inLastThird = lastThird != null && now >= lastThird;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir Tahajjud" onPress={() => router.push('/tahajjud')} style={styles.outer}>
      <View style={styles.card}>
        {/* The card has the photo's proportions (2172 × 724): the whole photo is shown, never cropped. */}
        <Image
          source={require('../assets/images/home/tahajjud-night-card-wide.png')}
          resizeMode="cover"
          style={styles.backgroundImage}
        />
        {/* Darkens only the right-hand sky, under the text; the moon and the city stay visible. */}
        <LinearGradient
          colors={['rgba(10,7,22,0)', 'rgba(10,7,22,0.35)', 'rgba(10,7,22,0.82)']}
          locations={[0, 0.38, 0.72]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>LA NUIT D’OUMMAH</Text>
          <Text style={styles.title}>Votre moment Tahajjud</Text>
          <Text style={styles.detail}>
            {inLastThird ? 'Le dernier tiers est arrivé' : lastThird && !beforeFajr ? `Dernier tiers à ${time(lastThird)}` : `La nuit se termine à ${time(fajr)}`}
            {' · '}Fajr à {time(fajr)}
          </Text>
          <Text style={styles.action}>Ouvrir mon espace <Ionicons name="arrow-forward" size={13} color={colors.goldLight} /></Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { marginHorizontal: 12, marginTop: 12 },
  card: { overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: colors.goldDark, aspectRatio: 2172 / 724, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: '#0C102C' },
  backgroundImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  copy: { width: '60%' },
  eyebrow: { color: colors.goldLight, letterSpacing: 2, fontSize: 8.5, fontWeight: '700' },
  title: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 18, marginTop: 2 },
  detail: { color: colors.textSecondary, fontSize: 11, marginTop: 3, lineHeight: 15 },
  action: { color: colors.goldLight, fontSize: 11.5, fontWeight: '700', marginTop: 5 },
});
