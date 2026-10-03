import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import { NIGHT_READINGS } from '../../features/tahajjud/tahajjudContent';

/** « Lire quelques versets » : passages of the night, or any surah of OUMMAH's Quran. */
export default function TahajjudReadingsScreen() {
  return (
    <TahajjudShell title="Lire quelques versets" eyebrow="Qiyam al-Layl">
      <Text style={styles.intro}>Des passages liés à la nuit, ou la sourate de votre choix.</Text>
      {NIGHT_READINGS.map((reading, index) => (
        <Animated.View key={reading.id} entering={FadeInDown.delay(index * 60).duration(400)}>
          <Pressable
            onPress={() => router.push((reading.verse ? `/surah/${reading.surah}?verse=${reading.verse}` : `/surah/${reading.surah}`) as Href)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.number}>
              <Text style={styles.numberText}>{reading.surah}</Text>
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{reading.title}</Text>
                <Text style={styles.reference}>{reading.reference}</Text>
              </View>
              <Text style={styles.why}>{reading.why}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={night.goldSoft} />
          </Pressable>
        </Animated.View>
      ))}
      <Pressable onPress={() => router.push('/quran' as Href)} style={({ pressed }) => [styles.other, pressed && styles.pressed]}>
        <Ionicons name="book-outline" size={20} color={night.sky0} />
        <Text style={styles.otherText}>Choisir une autre sourate</Text>
      </Pressable>
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 16, color: night.textSoft, fontSize: 17, lineHeight: 24, ...nightType.body },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginBottom: 10, borderRadius: 22, backgroundColor: night.glass, borderWidth: 1, borderColor: night.line },
  number: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: night.goldLine, backgroundColor: 'rgba(227,181,90,0.1)' },
  numberText: { color: night.goldSoft, fontSize: 16, ...nightType.bold },
  copy: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 },
  title: { color: night.text, fontSize: 19, ...nightType.semibold },
  reference: { color: night.gold, fontSize: 14, ...nightType.semibold },
  why: { marginTop: 4, color: night.textSoft, fontSize: 15, lineHeight: 21, ...nightType.body },
  other: { marginTop: 10, minHeight: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: night.gold },
  otherText: { color: night.sky0, fontSize: 17, ...nightType.bold },
  pressed: { opacity: 0.85 },
});
