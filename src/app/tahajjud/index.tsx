import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { NightArc } from '../../components/tahajjud/NightArc';
import { GlassCard, shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import { ValidateSheet } from '../../components/tahajjud/ValidateSheet';
import { WeekMoons } from '../../components/tahajjud/WeekMoons';
import { getTahajjudLive } from '../../features/tahajjud/tahajjudCommunity';
import { verseOfTheNight } from '../../features/tahajjud/tahajjudContent';
import { alarmTime, clock, formatDuration } from '../../features/tahajjud/tahajjudNight';
import { loadTahajjudSettings, type TahajjudSettings } from '../../features/tahajjud/TahajjudStore';
import { useTahajjudNight } from '../../features/tahajjud/useTahajjudNight';

function nightTitle(key: string) {
  const evening = new Date(`${key}T12:00:00`);
  const morning = new Date(evening);
  morning.setDate(evening.getDate() + 1);
  const day = (date: Date) => date.toLocaleDateString('fr-FR', { weekday: 'long' });
  return `Nuit du ${day(evening)} au ${day(morning)} ${morning.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
}

type Tile = { icon: keyof typeof Ionicons.glyphMap; label: string; hint: string; route?: string; onPress?: () => void; soon?: boolean };

export default function TahajjudScreen() {
  const { width } = useWindowDimensions();
  const view = useTahajjudNight();
  const [settings, setSettings] = useState<TahajjudSettings | null>(null);
  const [sheet, setSheet] = useState(false);
  const [awakeCount, setAwakeCount] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    void loadTahajjudSettings().then(setSettings);
    void getTahajjudLive().then((live) => setAwakeCount(live.awake)).catch(() => undefined);
  }, []));

  const { state, now } = view;
  const phase = state?.phase ?? 'day';
  const tonight = state?.night;
  const late = phase === 'day' && view.canValidate;
  const wakeUp = tonight && settings?.alarm.enabled ? alarmTime(tonight, settings.alarm.mode, settings.alarm.customTime) : null;
  const verse = tonight ? verseOfTheNight(tonight.key) : null;

  const tiles: Tile[] = [
    { icon: 'book-outline', label: 'Conseils', hint: 'Apprendre Tahajjud', route: '/tahajjud/guide' },
    { icon: 'heart-outline', label: 'Mes duas', hint: 'Préparer ma nuit', route: '/tahajjud/duas' },
    { icon: 'checkmark-circle-outline', label: 'J’ai prié', hint: view.validated ? 'Nuit enregistrée' : 'Valider ma nuit', onPress: () => view.canValidate && setSheet(true) },
    { icon: 'stats-chart-outline', label: 'Statistiques', hint: 'Calendrier · défis', route: '/tahajjud/stats' },
    { icon: 'people-outline', label: 'Mur des duas', hint: 'Dire Amine', route: '/tahajjud/wall' },
    { icon: 'chatbubbles-outline', label: 'Amis', hint: 'S’encourager', route: '/tahajjud/friends' },
  ];

  // Center of the arc: what matters now, in one glance.
  const center = !tonight ? null : view.validated ? (
    <>
      <Text style={styles.centerLabel}>NUIT ACCOMPLIE</Text>
      <Ionicons name="checkmark-circle" size={44} color={night.goldSoft} />
      <Text style={styles.centerSub}>{view.streak > 1 ? `${view.streak} nuits de suite` : 'Qu’Allah l’accepte'}</Text>
    </>
  ) : phase === 'lastThird' ? (
    <>
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={[styles.centerLabel, styles.centerLabelGold]}>DERNIER TIERS EN COURS</Text>
      </View>
      <Text style={styles.centerBig}>{formatDuration(tonight.fajr - now)}</Text>
      <Text style={styles.centerSub}>restantes · Fajr à {clock(tonight.fajr)}</Text>
    </>
  ) : (
    <>
      <Text style={styles.centerLabel}>{phase === 'day' ? 'PROCHAIN DERNIER TIERS' : 'DERNIER TIERS DE LA NUIT'}</Text>
      <Text style={styles.centerBig}>{clock(tonight.lastThirdStart)}</Text>
      <Text style={styles.centerSub}>
        {phase === 'day' ? `jusqu’à ${clock(tonight.fajr)} · ce soir après ‘Isha` : `commence dans ${formatDuration(tonight.lastThirdStart - now)}`}
      </Text>
    </>
  );

  return (
    <TahajjudShell>
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={styles.eyebrow}>{tonight ? nightTitle(tonight.key) : 'Cette nuit'}</Text>
        <Text style={styles.title}>Tahajjud</Text>
        <Text style={styles.subtitle}>Un rendez-vous privilégié avec ton Seigneur</Text>
      </Animated.View>

      {view.loading && !tonight ? (
        <View style={styles.loader}><ActivityIndicator color={night.gold} /></View>
      ) : !tonight ? (
        <GlassCard style={styles.errorCard}>
          <Ionicons name="cloud-offline-outline" size={26} color={night.gold} />
          <Text style={styles.errorText}>
            {view.error === 'location'
              ? 'Autorisez la localisation (ou choisissez votre mosquée) pour calculer le dernier tiers.'
              : 'Les horaires sont momentanément indisponibles.'}
          </Text>
          <Pressable onPress={view.reload} style={styles.retry}><Text style={styles.retryText}>Réessayer</Text></Pressable>
        </GlassCard>
      ) : (
        <>
          <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.arcWrap}>
            <NightArc width={width - 36} night={tonight} phase={phase} now={now} validated={view.validated}>
              {center}
            </NightArc>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            {phase === 'lastThird' && view.canValidate ? (
              <Pressable onPress={() => setSheet(true)} style={({ pressed }) => [pressed && styles.pressed]}>
                <LinearGradient colors={[night.goldSoft, night.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                  <Ionicons name="moon" size={20} color={night.sky0} />
                  <Text style={styles.ctaText}>J’ai prié Tahajjud</Text>
                </LinearGradient>
              </Pressable>
            ) : view.validated ? (
              <View style={[styles.cta, styles.ctaDone]}>
                <Ionicons name="checkmark-circle" size={20} color={night.success} />
                <Text style={[styles.ctaText, styles.ctaDoneText]}>Nuit enregistrée</Text>
                <Pressable onPress={() => void view.undo()} hitSlop={8} style={styles.undo}>
                  <Text style={styles.undoText}>Annuler</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => router.push('/tahajjud/alarm' as Href)} style={({ pressed }) => [pressed && styles.pressed]}>
                <LinearGradient colors={[night.goldSoft, night.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                  <Ionicons name="alarm" size={20} color={night.sky0} />
                  <Text style={styles.ctaText}>{wakeUp ? `Réveil réglé · ${clock(wakeUp)}` : 'Régler mon réveil'}</Text>
                </LinearGradient>
              </Pressable>
            )}
            {late ? (
              <Pressable onPress={() => setSheet(true)} style={styles.lateLink}>
                <Ionicons name="moon-outline" size={15} color={night.goldSoft} />
                <Text style={styles.lateText}>J’ai prié cette nuit ? Enregistrez-la jusqu’à Dhuhr.</Text>
              </Pressable>
            ) : null}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320).duration(500)} style={styles.grid}>
            {tiles.map((tile) => (
              <Pressable
                key={tile.label}
                disabled={tile.soon}
                onPress={() => (tile.route ? router.push(tile.route as Href) : tile.onPress?.())}
                style={({ pressed }) => [styles.tile, tile.soon && styles.tileSoon, pressed && styles.pressed]}
              >
                <View style={[styles.tileIcon, tile.soon && styles.tileIconSoon]}>
                  <Ionicons name={tile.icon} size={20} color={tile.soon ? night.muted : night.goldSoft} />
                </View>
                <Text style={[styles.tileLabel, tile.soon && styles.tileLabelSoon]}>{tile.label}</Text>
                <Text style={styles.tileHint}>{tile.hint}</Text>
              </Pressable>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(360).duration(500)}>
            <Pressable onPress={() => router.push('/tahajjud/community' as Href)} style={({ pressed }) => [pressed && styles.pressed]}>
              <LinearGradient colors={['rgba(183,171,242,0.16)', 'rgba(227,181,90,0.12)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.community}>
                <View style={styles.communityIcon}>
                  <Ionicons name="earth" size={24} color={night.goldSoft} />
                </View>
                <View style={styles.communityCopy}>
                  <Text style={styles.communityTitle}>La Oummah cette nuit</Text>
                  <Text style={styles.communityText}>
                    {awakeCount === null ? 'Vous ne priez pas seul' : `${awakeCount} membre${awakeCount > 1 ? 's' : ''} réveillé${awakeCount > 1 ? 's' : ''} · voir la carte`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={night.goldSoft} />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Pressable onPress={() => router.push('/tahajjud/stats' as Href)}>
              <GlassCard style={styles.weekCard}>
                <View style={styles.weekHeader}>
                  <Text style={shellStyles.sectionLabel}>Mes 7 dernières nuits</Text>
                  {view.streak > 0 ? (
                    <View style={styles.streakPill}>
                      <Ionicons name="flame" size={13} color={night.gold} />
                      <Text style={styles.streakText}>{view.streak}</Text>
                    </View>
                  ) : null}
                </View>
                <WeekMoons nights={view.nights} pauses={view.pauses} currentNight={state?.validatableKey ?? tonight.key} />
              </GlassCard>
            </Pressable>
          </Animated.View>

          {verse ? (
            <Animated.View entering={FadeInDown.delay(480).duration(500)}>
              <GlassCard gold style={styles.verseCard}>
                <Text style={shellStyles.sectionLabel}>Pour cette nuit</Text>
                {verse.arabic ? <Text style={styles.arabic}>{verse.arabic}</Text> : null}
                {verse.phonetic ? <Text style={styles.phonetic}>{verse.phonetic}</Text> : null}
                <Text style={styles.verseText}>{verse.text}</Text>
                <Text style={styles.verseSource}>{verse.source}</Text>
                <Pressable onPress={() => router.push('/tahajjud/readings' as Href)} style={styles.readButton}>
                  <Ionicons name="book" size={15} color={night.goldSoft} />
                  <Text style={styles.readText}>Lire quelques versets</Text>
                </Pressable>
              </GlassCard>
            </Animated.View>
          ) : null}
        </>
      )}

      <ValidateSheet
        visible={sheet}
        late={late}
        streak={view.streak + (view.validated ? 0 : 1)}
        onClose={() => setSheet(false)}
        onConfirm={view.validate}
      />
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: night.gold, fontSize: 14, letterSpacing: 1.8, textTransform: 'uppercase', ...nightType.bold },
  title: { marginTop: 4, color: night.text, fontSize: 54, lineHeight: 58, ...nightType.display },
  subtitle: { marginTop: 2, color: night.textSoft, fontSize: 18, ...nightType.body },
  loader: { height: 280, alignItems: 'center', justifyContent: 'center' },
  errorCard: { marginTop: 30, alignItems: 'center', gap: 12 },
  errorText: { color: night.textSoft, fontSize: 17, textAlign: 'center', lineHeight: 24, ...nightType.body },
  retry: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: night.goldLine },
  retryText: { color: night.goldSoft, ...nightType.semibold },
  arcWrap: { marginTop: 18, alignItems: 'center' },
  centerLabel: { color: night.muted, fontSize: 12, letterSpacing: 2.2, marginBottom: 4, ...nightType.bold },
  centerLabelGold: { color: night.goldSoft, marginBottom: 0 },
  centerBig: { color: night.text, fontSize: 48, lineHeight: 52, ...nightType.display },
  centerSub: { marginTop: 2, color: night.textSoft, fontSize: 16, ...nightType.medium },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: night.goldSoft },
  cta: { marginTop: 22, minHeight: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  ctaText: { color: night.sky0, fontSize: 20, ...nightType.bold },
  ctaDone: { backgroundColor: 'rgba(127,216,166,0.1)', borderWidth: 1, borderColor: 'rgba(127,216,166,0.3)' },
  ctaDoneText: { color: night.success },
  undo: { position: 'absolute', right: 18 },
  undoText: { color: night.muted, fontSize: 15, ...nightType.medium },
  lateLink: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  lateText: { color: night.goldSoft, fontSize: 16, ...nightType.medium },
  grid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31.5%', flexGrow: 1, minHeight: 104, borderRadius: 22, padding: 13, backgroundColor: night.glass, borderWidth: 1, borderColor: night.line },
  tileSoon: { opacity: 0.55 },
  tileIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(227,181,90,0.12)' },
  tileIconSoon: { backgroundColor: 'rgba(255,255,255,0.05)' },
  tileLabel: { marginTop: 10, color: night.text, fontSize: 17, ...nightType.semibold },
  tileLabelSoon: { color: night.textSoft },
  tileHint: { marginTop: 2, color: night.muted, fontSize: 14, ...nightType.body },
  weekCard: { marginTop: 16 },
  community: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: night.goldLine },
  communityIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  communityCopy: { flex: 1 },
  communityTitle: { color: night.text, fontSize: 19, ...nightType.semibold },
  communityText: { marginTop: 2, color: night.textSoft, fontSize: 15, ...nightType.body },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 9, borderRadius: 11, backgroundColor: 'rgba(227,181,90,0.12)' },
  streakText: { color: night.goldSoft, fontSize: 15, ...nightType.bold },
  verseCard: { marginTop: 16 },
  phonetic: { marginTop: 8, color: night.goldSoft, fontSize: 16, lineHeight: 23, fontStyle: 'italic', ...nightType.medium },
  arabic: { color: night.moon, fontSize: 24, lineHeight: 42, textAlign: 'right', writingDirection: 'rtl', ...nightType.arabic },
  verseText: { marginTop: 10, color: night.textSoft, fontSize: 18, lineHeight: 27, ...nightType.body },
  verseSource: { marginTop: 8, color: night.gold, fontSize: 15, ...nightType.semibold },
  readButton: { marginTop: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, borderWidth: 1, borderColor: night.goldLine },
  readText: { color: night.goldSoft, fontSize: 16, ...nightType.semibold },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
});
