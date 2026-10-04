import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LAST_TEN_HADITHS, LAYLAT_AL_QADR_DUA } from '../../features/tahajjud/tahajjudContent';
import { clock, type TahajjudNight } from '../../features/tahajjud/tahajjudNight';
import { getRamadanNight, type RamadanNight } from '../../features/tahajjud/tahajjudRamadan';
import { night as palette, nightType } from './theme';

/**
 * Ramadan mode: « n-ième nuit », suhoor until Fajr, and for the last ten nights the odd nights
 * (Laylat al-Qadr), a 10-night tracker and the dua taught to ‘Aïcha.
 */
export function RamadanCard({ tonight, nights }: { tonight: TahajjudNight; nights: Record<string, string> }) {
  const [ramadan, setRamadan] = useState<RamadanNight | null>(null);

  useEffect(() => {
    let active = true;
    void getRamadanNight(tonight.key).then((value) => { if (active) setRamadan(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [tonight.key]);

  if (!ramadan) return null;
  const prayedInLastTen = ramadan.lastTenKeys.filter((item) => nights[item.key]).length;

  return (
    <Animated.View entering={FadeInDown.duration(500)}>
      <LinearGradient colors={['#2A1F45', '#15102C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.head}>
          <Ionicons name="moon" size={18} color={palette.goldSoft} />
          <Text style={styles.eyebrow}>RAMADAN · {ramadan.night}{ramadan.night === 1 ? 're' : 'e'} NUIT</Text>
        </View>

        {ramadan.lastTen ? (
          <>
            <Text style={styles.title}>
              {ramadan.odd ? 'Nuit impaire : peut-être Laylat al-Qadr' : 'Les dix dernières nuits'}
            </Text>
            <Text style={styles.text}>
              {ramadan.odd
                ? 'Une nuit meilleure que mille mois. Multipliez les invocations, le Coran et le pardon.'
                : 'Les nuits les plus précieuses de l’année. Demain soir est une nuit impaire.'}
            </Text>

            <View style={styles.tracker}>
              {ramadan.lastTenKeys.map((item) => {
                const done = Boolean(nights[item.key]);
                const current = item.night === ramadan.night;
                const odd = item.night % 2 === 1;
                return (
                  <View key={item.night} style={styles.trackItem}>
                    <View style={[styles.dot, odd && styles.dotOdd, done && styles.dotDone, current && styles.dotCurrent]}>
                      {done ? <Ionicons name="checkmark" size={12} color={palette.sky0} /> : null}
                    </View>
                    <Text style={[styles.trackLabel, odd && styles.trackLabelOdd]}>{item.night}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.trackSummary}>{prayedInLastTen}/10 nuits priées · les nuits impaires sont en or</Text>

            <View style={styles.dua}>
              <Text style={styles.duaArabic}>{LAYLAT_AL_QADR_DUA.arabic}</Text>
              <Text style={styles.duaPhonetic}>{LAYLAT_AL_QADR_DUA.phonetic}</Text>
              <Text style={styles.duaText}>{LAYLAT_AL_QADR_DUA.text}</Text>
              <Text style={styles.duaSource}>{LAYLAT_AL_QADR_DUA.source}</Text>
            </View>
            <Text style={styles.hadith}>« {LAST_TEN_HADITHS[ramadan.odd ? 1 : 0].text} » — {LAST_TEN_HADITHS[ramadan.odd ? 1 : 0].source}</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Le mois des nuits debout</Text>
            <Text style={styles.text}>Encore {21 - ramadan.night} nuit{21 - ramadan.night > 1 ? 's' : ''} avant les dix dernières. Prier la nuit avec le suhoor, c’est une seule montée.</Text>
          </>
        )}

        <View style={styles.suhoor}>
          <Ionicons name="restaurant-outline" size={16} color={palette.goldSoft} />
          <Text style={styles.suhoorText}>Suhoor jusqu’à Fajr, {clock(tonight.fajr)}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: palette.goldLine },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: palette.goldSoft, fontSize: 12, letterSpacing: 1.8, ...nightType.bold },
  title: { marginTop: 10, color: palette.text, fontSize: 22, lineHeight: 27, ...nightType.display },
  text: { marginTop: 6, color: palette.textSoft, fontSize: 15, lineHeight: 22, ...nightType.body },
  tracker: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  trackItem: { alignItems: 'center', gap: 4 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, backgroundColor: palette.glass },
  dotOdd: { borderColor: palette.gold },
  dotDone: { backgroundColor: palette.gold, borderColor: palette.gold },
  dotCurrent: { borderWidth: 2, borderColor: palette.text },
  trackLabel: { color: palette.muted, fontSize: 11, ...nightType.semibold },
  trackLabelOdd: { color: palette.goldSoft },
  trackSummary: { marginTop: 8, color: palette.muted, fontSize: 13, textAlign: 'center', ...nightType.medium },
  dua: { marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: '#0D0A1F' },
  duaArabic: { color: palette.goldSoft, fontSize: 24, lineHeight: 42, textAlign: 'right', writingDirection: 'rtl', ...nightType.arabic },
  duaPhonetic: { marginTop: 6, color: palette.textSoft, fontSize: 15, lineHeight: 22, fontStyle: 'italic', ...nightType.medium },
  duaText: { marginTop: 6, color: palette.textSoft, fontSize: 14, lineHeight: 20, ...nightType.body },
  duaSource: { marginTop: 4, color: palette.muted, fontSize: 12, ...nightType.semibold },
  hadith: { marginTop: 12, color: palette.muted, fontSize: 13, lineHeight: 19, fontStyle: 'italic', ...nightType.body },
  suhoor: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  suhoorText: { color: palette.goldSoft, fontSize: 14, ...nightType.semibold },
});
