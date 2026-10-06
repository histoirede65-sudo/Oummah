import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { MosquePrayerSchedule } from '../features/mosques/data/mosquePrayerTimes';
import { alarmTime, clock, formatDuration } from '../features/tahajjud/tahajjudNight';
import { loadTahajjudSettings, type TahajjudSettings } from '../features/tahajjud/TahajjudStore';
import { useTahajjudNight } from '../features/tahajjud/useTahajjudNight';
import { night, nightType } from './tahajjud/theme';
import { ValidateSheet } from './tahajjud/ValidateSheet';
import { WeekMoons } from './tahajjud/WeekMoons';
import { tx } from '../features/tahajjud/tahajjudI18n';

type Props = { schedule: MosquePrayerSchedule | null };

/**
 * Tahajjud on the home screen: appears at ‘Isha, follows the night (before the last third → during →
 * validated), disappears after Fajr.
 */
export default function HomeTahajjudCard({ schedule }: Props) {
  const view = useTahajjudNight(schedule);
  const [settings, setSettings] = useState<TahajjudSettings | null>(null);
  const [sheet, setSheet] = useState(false);

  useFocusEffect(useCallback(() => {
    void loadTahajjudSettings().then(setSettings);
  }, []));

  const { state, now } = view;
  if (!state || state.phase === 'day') return null;
  const tonight = state.night;
  const inLastThird = state.phase === 'lastThird';
  const wakeUp = settings?.alarm.enabled ? alarmTime(tonight, settings.alarm.mode, settings.alarm.customTime) : null;

  const title = view.validated ? tx('Nuit accomplie') : inLastThird ? tx('Dernier tiers en cours') : tx("Dernier tiers à {0}", [clock(tonight.lastThirdStart)]);
  const detail = view.validated
    ? view.streak > 1 ? tx("{0} nuits de suite", [view.streak]) : tx('Qu’Allah l’accepte')
    : inLastThird
      ? tx("encore {0} · Fajr à {1}", [formatDuration(tonight.fajr - now), clock(tonight.fajr)])
      : tx("dans {0} · Fajr à {1}", [formatDuration(tonight.lastThirdStart - now), clock(tonight.fajr)]);

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.outer}>
      <View style={styles.card}>
        <Pressable accessibilityRole="button" accessibilityLabel={tx("Ouvrir Qiyam al-Layl")} onPress={() => router.push('/tahajjud' as Href)} style={styles.photo}>
          {/* The band has the photo's proportions (2172 × 724): the whole photo is shown. */}
          <Image source={require('../assets/images/home/tahajjud-night-card-wide.png')} resizeMode="cover" style={styles.backgroundImage} />
          <LinearGradient
            colors={['rgba(10,7,22,0)', 'rgba(10,7,22,0.35)', 'rgba(10,7,22,0.85)']}
            locations={[0, 0.38, 0.72]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.copy}>
            <View style={styles.eyebrowRow}>
              {inLastThird && !view.validated ? <View style={styles.liveDot} /> : null}
              <Text style={styles.eyebrow}>{view.validated ? tx('QIYAM AL-LAYL') : inLastThird ? tx('C’EST LE MOMENT') : tx('CETTE NUIT')}</Text>
            </View>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
            <Text style={styles.detail} numberOfLines={1}>{detail}</Text>
          </View>
        </Pressable>

        <View style={styles.actions}>
          {view.validated ? (
            <Pressable onPress={() => router.push('/tahajjud/stats' as Href)} style={styles.weekRow}>
              <View style={styles.week}>
                <WeekMoons nights={view.nights} pauses={view.pauses} currentNight={state.validatableKey ?? tonight.key} size={16} />
              </View>
              <Ionicons name="chevron-forward" size={16} color={night.muted} />
            </Pressable>
          ) : inLastThird ? (
            <>
              <Pressable onPress={() => router.push('/tahajjud/awake' as Href)} style={({ pressed }) => [styles.flex, pressed && styles.pressed]}>
                <LinearGradient colors={[night.goldSoft, night.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
                  <Ionicons name="sunny" size={17} color={night.sky0} />
                  <Text style={styles.primaryText}>{tx("Je suis debout")}</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => setSheet(true)} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={night.goldSoft} />
                <Text style={styles.chipText}>{tx("J’ai prié")}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={() => router.push('/tahajjud/alarm' as Href)} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                <Ionicons name="alarm-outline" size={16} color={night.goldSoft} />
                <Text style={styles.chipText}>{wakeUp ? tx("Réveil {0}", [clock(wakeUp)]) : tx('Régler mon réveil')}</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/tahajjud/duas' as Href)} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                <Ionicons name="heart-outline" size={16} color={night.goldSoft} />
                <Text style={styles.chipText}>{tx("Ma nuit")}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      <ValidateSheet
        visible={sheet}
        late={false}
        streak={view.streak + 1}
        nightKey={state.validatableKey}
        onClose={() => setSheet(false)}
        onConfirm={view.validate}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { marginHorizontal: 12, marginTop: 12 },
  card: { overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(227,181,90,0.45)', backgroundColor: '#0B0820' },
  photo: { aspectRatio: 2172 / 724, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  backgroundImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },
  copy: { width: '60%' },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: night.goldSoft },
  eyebrow: { color: night.goldSoft, letterSpacing: 2, fontSize: 10, ...nightType.bold },
  title: { color: night.text, fontSize: 22, marginTop: 2, ...nightType.display },
  detail: { color: night.text, fontSize: 13, marginTop: 2, ...nightType.medium },
  actions: { flexDirection: 'row', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: 'rgba(227,181,90,0.18)' },
  flex: { flex: 1 },
  chip: { flex: 1, height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#201826', borderWidth: 1, borderColor: 'rgba(227,181,90,0.28)' },
  chipText: { color: night.text, fontSize: 15, ...nightType.semibold },
  primary: { height: 46, borderRadius: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: night.sky0, fontSize: 16, ...nightType.bold },
  weekRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6 },
  week: { flex: 1 },
  pressed: { opacity: 0.85 },
});
