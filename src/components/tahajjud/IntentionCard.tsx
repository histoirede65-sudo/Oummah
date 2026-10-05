import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { INTENTION_PROOF } from '../../features/tahajjud/tahajjudContent';
import { clock, shiftDateKey, type NightPhase, type TahajjudNight } from '../../features/tahajjud/tahajjudNight';
import { loadIntentions, setIntention, type TahajjudIntentions } from '../../features/tahajjud/TahajjudStore';
import { GlassCard } from './TahajjudShell';
import { night, nightType } from './theme';
import { tx } from '../../features/tahajjud/tahajjudI18n';

/**
 * Between Maghrib and ‘Isha (today's times): « Ce soir, j'ai l'intention de me lever ». Once made, a
 * confirmation stays for the night. Next day, if the night was missed, a kind word: the intention is
 * already rewarded.
 */
export function IntentionCard({ phase, tonight, now, nights }: {
  phase: NightPhase;
  tonight: TahajjudNight;
  now: number;
  nights: Record<string, string>;
}) {
  const tonightKey = tonight.key;
  const inWindow = phase === 'day' && now >= tonight.maghrib && now < tonight.isha;
  const [intentions, setIntentions] = useState<TahajjudIntentions>({});

  useFocusEffect(useCallback(() => {
    void loadIntentions().then(setIntentions);
  }, []));

  const toggle = async (on: boolean) => {
    if (on) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setIntentions(await setIntention(tonightKey, on));
  };

  // Daytime (before Maghrib): was last night's intention kept by sleep? Its reward is already written.
  if (phase === 'day' && !inWindow) {
    const lastNight = shiftDateKey(tonightKey, -1);
    if (!intentions[lastNight] || nights[lastNight]) return null;
    return (
      <Animated.View entering={FadeIn.duration(500)}>
        <GlassCard style={styles.card}>
          <View style={styles.head}>
            <Ionicons name="heart" size={18} color={night.goldSoft} />
            <Text style={styles.title}>{tx("Vous aviez l’intention de vous lever")}</Text>
          </View>
          <Text style={styles.text}>{tx("Le sommeil l’a emporté ? Votre intention compte déjà. Ce soir est une nouvelle nuit.")}</Text>
          <View style={styles.proof}>
            <Text style={styles.proofText}>{INTENTION_PROOF.text}</Text>
            <Text style={styles.proofSource}>{INTENTION_PROOF.source}</Text>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  if (nights[tonightKey]) return null;
  const made = Boolean(intentions[tonightKey]);
  // After ‘Isha the button is gone; only a made intention is still shown.
  if (!made && !inWindow) return null;

  return made ? (
    <View style={styles.made}>
      <Ionicons name="checkmark-circle" size={18} color={night.success} />
      <Text style={styles.madeText}>{tx("Intention posée pour cette nuit. Qu’Allah vous facilite.")}</Text>
      {inWindow ? (
        <Pressable onPress={() => void toggle(false)} hitSlop={8}>
          <Text style={styles.undo}>{tx("Retirer")}</Text>
        </Pressable>
      ) : null}
    </View>
  ) : (
    <Pressable onPress={() => void toggle(true)} style={({ pressed }) => [pressed && styles.pressed]}>
      <GlassCard gold style={styles.cta}>
        <View style={styles.ctaIcon}><Ionicons name="moon-outline" size={20} color={night.sky0} /></View>
        <View style={styles.flex}>
          <Text style={styles.title}>{tx("Ce soir, j’ai l’intention de me lever")}</Text>
          <Text style={styles.ctaText}>{tx("Jusqu’à ‘Isha (")}{clock(tonight.isha)}{tx("). Même si le sommeil l’emporte, l’intention est déjà récompensée.")}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { marginTop: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: night.text, fontSize: 17, lineHeight: 22, ...nightType.semibold },
  text: { marginTop: 8, color: night.textSoft, fontSize: 15, lineHeight: 22, ...nightType.body },
  proof: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: night.glassStrong, borderLeftWidth: 2, borderLeftColor: night.gold },
  proofText: { color: night.textSoft, fontSize: 14, lineHeight: 20, ...nightType.body },
  proofSource: { marginTop: 4, color: night.muted, fontSize: 12, ...nightType.semibold },
  cta: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: night.goldSoft },
  ctaText: { marginTop: 3, color: night.muted, fontSize: 13, lineHeight: 18, ...nightType.body },
  made: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  madeText: { flex: 1, color: night.textSoft, fontSize: 14, lineHeight: 19, ...nightType.medium },
  undo: { color: night.muted, fontSize: 13, textDecorationLine: 'underline', ...nightType.medium },
  pressed: { opacity: 0.85 },
});
