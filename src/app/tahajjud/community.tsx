import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CommunityMap } from '../../components/tahajjud/CommunityMap';
import { GlassCard, shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import {
  declareTahajjud,
  getCommunityProfile,
  getMyPresence,
  getTahajjudLive,
  isSignedIn,
  MAP_THRESHOLD,
  withdrawTahajjud,
  type CommunityProfile,
  type PresenceStatus,
  type TahajjudLive,
} from '../../features/tahajjud/tahajjudCommunity';
import { useTahajjudNight } from '../../features/tahajjud/useTahajjudNight';

/** Number that counts up smoothly to its value. */
function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = from.current;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / 900);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(start + (target - start) * eased);
      setValue(next);
      if (t >= 1) {
        from.current = target;
        clearInterval(timer);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

export default function TahajjudCommunityScreen() {
  const view = useTahajjudNight();
  const [live, setLive] = useState<TahajjudLive | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [presence, setPresence] = useState<PresenceStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const night_ = view.state?.night;
  const nightKey = view.state && view.state.phase !== 'day' ? view.state.night.key : null;

  const refresh = useCallback(async () => {
    setLive(await getTahajjudLive().catch(() => null));
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    void refresh();
    const timer = setInterval(() => void refresh(), 60_000);
    void (async () => {
      const connected = await isSignedIn();
      const mine = connected ? await getCommunityProfile() : null;
      if (!active) return;
      setSignedIn(connected);
      setProfile(mine);
    })();
    return () => { active = false; clearInterval(timer); };
  }, [refresh]));

  useEffect(() => {
    if (nightKey && profile) void getMyPresence(nightKey).then(setPresence);
  }, [nightKey, profile]);

  const awake = useCountUp(live?.awake ?? 0);
  const prayed = live?.prayed ?? 0;

  const declare = async () => {
    if (!nightKey || busy) return;
    setBusy(true);
    try {
      await declareTahajjud(nightKey, 'awake');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setPresence((current) => current ?? 'awake');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!nightKey || busy) return;
    setBusy(true);
    try {
      await withdrawTahajjud(nightKey);
      setPresence(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <TahajjudShell title="La Oummah cette nuit" eyebrow="Communauté">
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={styles.tagline}>Vous ne priez pas seul : la Oummah est éveillée.</Text>

        <GlassCard gold style={styles.counterCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>EN DIRECT · 12 DERNIÈRES HEURES</Text>
          </View>
          {live ? (
            <>
              <Text style={styles.counter}>{awake}</Text>
              <Text style={styles.counterLabel}>membre{awake > 1 ? 's' : ''} réveillé{awake > 1 ? 's' : ''} pour Tahajjud</Text>
              <View style={styles.prayedPill}>
                <Ionicons name="moon" size={15} color={night.sky0} />
                <Text style={styles.prayedText}>dont {prayed} {prayed > 1 ? 'ont' : 'a'} prié</Text>
              </View>
            </>
          ) : (
            <ActivityIndicator color={night.gold} style={styles.loader} />
          )}
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)}>
        {live && live.awake >= MAP_THRESHOLD ? (
          <>
            <CommunityMap zones={live.zones} />
            <Text style={styles.mapNote}>Chaque halo réunit au moins 3 membres dans une zone d’environ 30 km.</Text>
          </>
        ) : (
          <GlassCard style={styles.mapSoon}>
            <Ionicons name="earth" size={34} color={night.lavender} />
            <Text style={styles.mapSoonTitle}>La carte s’allume bientôt</Text>
            <Text style={styles.mapSoonText}>
              Elle apparaît dès {MAP_THRESHOLD} membres réveillés dans la nuit. Chaque déclaration rapproche ce moment.
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, ((live?.awake ?? 0) / MAP_THRESHOLD) * 100)}%` }]} />
            </View>
          </GlassCard>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(500)}>
        <Text style={[shellStyles.sectionLabel, styles.section]}>Et vous ?</Text>
        {!signedIn ? (
          <GlassCard style={styles.actionCard}>
            <Text style={styles.actionText}>Connectez-vous pour être compté avec la Oummah.</Text>
            <Pressable onPress={() => router.push('/profile' as Href)} style={styles.secondary}>
              <Text style={styles.secondaryText}>Se connecter</Text>
            </Pressable>
          </GlassCard>
        ) : !profile ? (
          <GlassCard style={styles.actionCard}>
            <Text style={styles.actionText}>Un pseudo suffit pour rejoindre la communauté. Tout reste volontaire.</Text>
            <Pressable onPress={() => router.push('/tahajjud/profile' as Href)} style={styles.secondary}>
              <Text style={styles.secondaryText}>Créer mon profil OUMMAH</Text>
            </Pressable>
          </GlassCard>
        ) : !nightKey ? (
          <GlassCard style={styles.actionCard}>
            <Text style={styles.actionText}>
              Revenez cette nuit, après ‘Isha{night_ ? ` (dernier tiers vers ${new Date(night_.lastThirdStart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})` : ''}.
            </Text>
          </GlassCard>
        ) : presence ? (
          <GlassCard gold style={styles.actionCard}>
            <View style={styles.countedRow}>
              <Ionicons name="checkmark-circle" size={24} color={night.success} />
              <Text style={styles.countedText}>{presence === 'prayed' ? 'Votre nuit est comptée : vous avez prié.' : 'Vous êtes compté parmi les réveillés.'}</Text>
            </View>
            <Pressable onPress={() => void withdraw()} disabled={busy} hitSlop={8}>
              <Text style={styles.withdraw}>Me retirer pour cette nuit</Text>
            </Pressable>
          </GlassCard>
        ) : (
          <Pressable disabled={busy || !profile.shareTahajjud} onPress={() => void declare()} style={({ pressed }) => [pressed && styles.pressed]}>
            <LinearGradient colors={[night.goldSoft, night.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cta, !profile.shareTahajjud && styles.disabled]}>
              <Ionicons name="sunny" size={20} color={night.sky0} />
              <Text style={styles.ctaText}>{busy ? '…' : 'Je suis réveillé pour Tahajjud'}</Text>
            </LinearGradient>
          </Pressable>
        )}
        {profile && !profile.shareTahajjud ? (
          <Text style={styles.mapNote}>Vous avez choisi de ne pas apparaître. Modifiable dans votre profil.</Text>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <GlassCard style={styles.friends}>
          <Ionicons name="people-outline" size={22} color={night.muted} />
          <View style={styles.friendsCopy}>
            <Text style={styles.friendsTitle}>Mes amis cette nuit</Text>
            <Text style={styles.friendsText}>Bientôt : voir et encourager vos amis, selon leurs réglages.</Text>
          </View>
        </GlassCard>
        {profile ? (
          <Pressable onPress={() => router.push('/tahajjud/profile' as Href)} style={styles.profileLink}>
            <Ionicons name="person-circle-outline" size={18} color={night.goldSoft} />
            <Text style={styles.profileLinkText}>{profile.pseudo} · confidentialité</Text>
          </Pressable>
        ) : null}
        <Text style={styles.footer}>
          Uniquement de vraies déclarations OUMMAH. Aucune position précise n’est envoyée ni affichée.
        </Text>
      </Animated.View>
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  tagline: { color: night.textSoft, fontSize: 18, lineHeight: 25, marginBottom: 16, ...nightType.medium },
  counterCard: { alignItems: 'center', paddingVertical: 26 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: night.success },
  liveText: { color: night.muted, fontSize: 12, letterSpacing: 1.6, ...nightType.bold },
  counter: { marginTop: 6, color: night.goldSoft, fontSize: 84, lineHeight: 92, ...nightType.display },
  counterLabel: { color: night.text, fontSize: 18, ...nightType.medium },
  prayedPill: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: night.goldSoft },
  prayedText: { color: night.sky0, fontSize: 15, ...nightType.bold },
  loader: { marginVertical: 40 },
  mapNote: { marginTop: 8, color: night.muted, fontSize: 13, lineHeight: 18, textAlign: 'center', ...nightType.body },
  mapSoon: { marginTop: 14, alignItems: 'center', gap: 8, paddingVertical: 24 },
  mapSoonTitle: { color: night.text, fontSize: 22, ...nightType.display },
  mapSoonText: { color: night.textSoft, fontSize: 15, lineHeight: 21, textAlign: 'center', ...nightType.body },
  progressTrack: { marginTop: 8, alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: night.lavender },
  section: { marginTop: 26 },
  actionCard: { gap: 14 },
  actionText: { color: night.text, fontSize: 17, lineHeight: 24, ...nightType.medium },
  secondary: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, backgroundColor: night.gold },
  secondaryText: { color: night.sky0, fontSize: 16, ...nightType.bold },
  countedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countedText: { flex: 1, color: night.text, fontSize: 17, ...nightType.semibold },
  withdraw: { color: night.muted, fontSize: 14, textDecorationLine: 'underline', ...nightType.medium },
  cta: { minHeight: 60, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { color: night.sky0, fontSize: 18, ...nightType.bold },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
  friends: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: 0.75 },
  friendsCopy: { flex: 1 },
  friendsTitle: { color: night.text, fontSize: 16, ...nightType.semibold },
  friendsText: { marginTop: 2, color: night.muted, fontSize: 14, lineHeight: 19, ...nightType.body },
  profileLink: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  profileLinkText: { color: night.goldSoft, fontSize: 15, ...nightType.semibold },
  footer: { marginTop: 14, color: night.muted, fontSize: 13, lineHeight: 18, textAlign: 'center', ...nightType.body },
});
