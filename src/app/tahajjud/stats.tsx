import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { GlassCard, shellStyles, TahajjudShell } from '../../components/tahajjud/TahajjudShell';
import { night, nightType } from '../../components/tahajjud/theme';
import { localDateKey } from '../../features/tahajjud/tahajjudNight';
import {
  activePause,
  bestStreak,
  challengeProgress,
  currentStreak,
  isPaused,
  loadChallenge,
  periodStats,
  saveChallenge,
  setPause,
  type StatsPeriod,
  type TahajjudChallenge,
  type TahajjudPause,
} from '../../features/tahajjud/TahajjudStore';
import { useTahajjudNight } from '../../features/tahajjud/useTahajjudNight';
import { tx, txCount, tahajjudLocale } from '../../features/tahajjud/tahajjudI18n';

const PERIODS: readonly { id: StatsPeriod; label: string }[] = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
];

const CHALLENGES: readonly { id: string; label: string; target: number; hint: string }[] = [
  { id: 'n7', label: '7 nuits', target: 7, hint: 'Une semaine pour prendre le rythme' },
  { id: 'n10', label: '10 nuits', target: 10, hint: 'Comme les dix dernières nuits' },
  { id: 'n30', label: '30 nuits', target: 30, hint: 'Un mois avec la nuit' },
  { id: 'n40', label: '40 nuits', target: 40, hint: 'Ancrer l’habitude' },
  { id: 'ramadan', label: 'Ramadan', target: 30, hint: 'Les 30 nuits du mois béni' },
];

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function Ring({ value, size = 76 }: { value: number; size?: number }) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={radius} stroke={night.gold} strokeWidth={stroke} fill="none" strokeLinecap="round"
        strokeDasharray={`${circumference * Math.min(1, value)} ${circumference}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

function Calendar({ month, nights, pauses, today }: {
  month: Date;
  nights: Record<string, string>;
  pauses: readonly TahajjudPause[];
  today: string;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, index) => localDateKey(new Date(month.getFullYear(), month.getMonth(), index + 1))),
  ];
  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((day, index) => <Text key={index} style={styles.weekday}>{day}</Text>)}
      </View>
      <View style={styles.calendarGrid}>
        {cells.map((key, index) => {
          if (!key) return <View key={`empty-${index}`} style={styles.cell} />;
          const done = Boolean(nights[key]);
          const paused = !done && isPaused(pauses, key);
          const future = key > today;
          return (
            <View key={key} style={styles.cell}>
              <View style={[styles.dayDot, done && styles.dayDone, paused && styles.dayPaused, key === today && !done && styles.dayToday]}>
                <Text style={[styles.dayNumber, done && styles.dayNumberDone, future && styles.dayFuture]}>{Number(key.slice(8))}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function TahajjudStatsScreen() {
  const view = useTahajjudNight();
  const currentNight = view.state?.validatableKey ?? view.state?.night.key ?? localDateKey(new Date());
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [pauses, setPauses] = useState<TahajjudPause[] | null>(null);
  const [challenge, setChallenge] = useState<TahajjudChallenge | null>(null);
  const [customTarget, setCustomTarget] = useState('');

  useFocusEffect(useCallback(() => {
    void loadChallenge().then(setChallenge);
  }, []));

  const allPauses = pauses ?? view.pauses;
  const stats = periodStats(period, currentNight, view.nights, allPauses);
  const streak = currentStreak(view.nights, allPauses, currentNight);
  const best = bestStreak(view.nights, allPauses);
  const total = Object.keys(view.nights).length;
  const paused = Boolean(activePause(allPauses));
  const progress = challenge ? challengeProgress(challenge, view.nights) : null;

  const startChallenge = (id: string, label: string, target: number) => {
    const next = { id, label, target, startNight: currentNight };
    setChallenge(next);
    void saveChallenge(next);
  };

  return (
    <TahajjudShell title={tx("Mes statistiques")} eyebrow={tx("Qiyam al-Layl")}>
      <View style={styles.segment}>
        {PERIODS.map((item) => (
          <Pressable key={item.id} onPress={() => setPeriod(item.id)} style={[styles.segmentItem, period === item.id && styles.segmentOn]}>
            <Text style={[styles.segmentText, period === item.id && styles.segmentTextOn]}>{tx(item.label)}</Text>
          </Pressable>
        ))}
      </View>

      <GlassCard gold style={styles.hero}>
        <View style={styles.heroRing}>
          <Ring value={stats.regularity / 100} size={104} />
          <View style={styles.heroRingCenter}>
            <Text style={styles.heroPercent}>{stats.regularity}%</Text>
            <Text style={styles.heroPercentLabel}>{tx("régularité")}</Text>
          </View>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroBig}>{stats.done}</Text>
          <Text style={styles.heroLabel}>{txCount(stats.done, 'nuit', 'nuits')} {period === 'week' ? tx('cette semaine') : period === 'month' ? tx('ce mois-ci') : tx('cette année')}</Text>
          {/* What the percentage is made of: nights prayed out of the nights already passed (pauses left out). */}
          <Text style={styles.heroNote}>{txCount(stats.counted, 'Régularité : {1} sur {0} nuit passée, hors pauses.', 'Régularité : {1} sur {0} nuits passées, hors pauses.', [stats.done])}</Text>
        </View>
      </GlassCard>

      <View style={styles.metrics}>
        {[
          { icon: 'flame' as const, value: streak, label: tx('série actuelle') },
          { icon: 'trophy-outline' as const, value: best, label: tx('meilleure série') },
          { icon: 'moon' as const, value: total, label: tx('nuits au total') },
        ].map((item) => (
          <GlassCard key={item.label} style={styles.metric}>
            <Ionicons name={item.icon} size={18} color={night.gold} />
            <Text style={styles.metricValue}>{item.value}</Text>
            <Text style={styles.metricLabel}>{item.label}</Text>
          </GlassCard>
        ))}
      </View>

      <Text style={[shellStyles.sectionLabel, styles.section]}>{tx("Calendrier")}</Text>
      <GlassCard>
        <View style={styles.monthHeader}>
          <Pressable hitSlop={10} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <Ionicons name="chevron-back" size={20} color={night.textSoft} />
          </Pressable>
          <Text style={styles.monthTitle}>{month.toLocaleDateString(tahajjudLocale(), { month: 'long', year: 'numeric' })}</Text>
          <Pressable hitSlop={10} onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <Ionicons name="chevron-forward" size={20} color={night.textSoft} />
          </Pressable>
        </View>
        <Calendar month={month} nights={view.nights} pauses={allPauses} today={currentNight} />
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, styles.dayDone]} /><Text style={styles.legendText}>{tx("Nuit priée")}</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, styles.dayPaused]} /><Text style={styles.legendText}>{tx("En pause")}</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, styles.dayToday]} /><Text style={styles.legendText}>{tx("À enregistrer")}</Text></View>
        </View>
      </GlassCard>

      <GlassCard style={styles.pauseCard}>
        <View style={styles.pauseRow}>
          <Ionicons name="pause-circle-outline" size={22} color={night.lavender} />
          <View style={styles.pauseCopy}>
            <Text style={styles.pauseTitle}>{tx("Mettre ma série en pause")}</Text>
            <Text style={styles.pauseText}>{tx("Règles, maladie, voyage : ces nuits ne cassent pas la série.")}</Text>
          </View>
          <Switch
            value={paused}
            onValueChange={(value) => void setPause(value, currentNight).then(setPauses)}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: night.lavender }}
            thumbColor={night.text}
          />
        </View>
      </GlassCard>

      <Text style={[shellStyles.sectionLabel, styles.section]}>{tx("Mon défi")}</Text>
      {challenge && progress ? (
        <GlassCard gold style={styles.challengeActive}>
          <View style={styles.heroRing}>
            <Ring value={progress.done / challenge.target} size={84} />
            <View style={styles.heroRingCenter}>
              <Text style={styles.challengeCount}>{progress.done}</Text>
              <Text style={styles.heroPercentLabel}>/ {challenge.target}</Text>
            </View>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.challengeTitle}>{progress.complete ? tx('Défi accompli') : tx(challenge.label)}</Text>
            <Text style={styles.challengeText}>
              {progress.complete
                ? tx('Qu’Allah fasse de cette habitude une constance.')
                : txCount(challenge.target - progress.done, '{0} nuit pour y arriver. Les nuits n’ont pas besoin d’être consécutives.', '{0} nuits pour y arriver. Les nuits n’ont pas besoin d’être consécutives.')}
            </Text>
            <Pressable onPress={() => { setChallenge(null); void saveChallenge(null); }} hitSlop={6}>
              <Text style={styles.challengeStop}>{progress.complete ? tx('Choisir un nouveau défi') : tx('Arrêter ce défi')}</Text>
            </Pressable>
          </View>
        </GlassCard>
      ) : (
        <>
          {CHALLENGES.map((item) => (
            <Pressable key={item.id} onPress={() => startChallenge(item.id, item.label, item.target)} style={({ pressed }) => [pressed && styles.pressed]}>
              <GlassCard style={styles.challengeOption}>
                <Text style={styles.challengeOptionTitle}>{tx(item.label)}</Text>
                <Text style={styles.challengeOptionHint}>{tx(item.hint)}</Text>
                <Ionicons name="arrow-forward" size={16} color={night.gold} style={styles.challengeArrow} />
              </GlassCard>
            </Pressable>
          ))}
          <GlassCard style={styles.challengeOption}>
            <Text style={styles.challengeOptionTitle}>{tx("Mon défi personnalisé")}</Text>
            <View style={styles.customRow}>
              <TextInput
                value={customTarget}
                onChangeText={(value) => setCustomTarget(value.replace(/\D/g, '').slice(0, 3))}
                placeholder={tx("Nombre de nuits")}
                placeholderTextColor={night.placeholder}
                keyboardType="number-pad"
                style={styles.customInput}
              />
              <Pressable
                disabled={!Number(customTarget)}
                onPress={() => startChallenge('custom', tx("{0} nuits", [Number(customTarget)]), Number(customTarget))}
                style={[styles.customStart, !Number(customTarget) && styles.disabled]}
              >
                <Text style={styles.customStartText}>{tx("Commencer")}</Text>
              </Pressable>
            </View>
          </GlassCard>
        </>
      )}
      <Text style={styles.footer}>{tx("Un défi personnel, entre vous et Allah : aucun classement, aucune comparaison.")}</Text>
    </TahajjudShell>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', padding: 4, borderRadius: 18, backgroundColor: night.glass, borderWidth: 1, borderColor: night.line, marginBottom: 14 },
  segmentItem: { flex: 1, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: night.gold },
  segmentText: { color: night.textSoft, fontSize: 17, ...nightType.semibold },
  segmentTextOn: { color: night.sky0, ...nightType.bold },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  heroRing: { alignItems: 'center', justifyContent: 'center' },
  heroRingCenter: { position: 'absolute', alignItems: 'center' },
  heroPercent: { color: night.text, fontSize: 26, ...nightType.bold },
  heroPercentLabel: { color: night.muted, fontSize: 12, ...nightType.medium },
  heroCopy: { flex: 1 },
  heroBig: { color: night.goldSoft, fontSize: 54, lineHeight: 58, ...nightType.display },
  heroLabel: { color: night.textSoft, fontSize: 17, ...nightType.medium },
  heroNote: { marginTop: 6, color: night.muted, fontSize: 13.5, lineHeight: 18, ...nightType.body },
  metrics: { marginTop: 10, flexDirection: 'row', gap: 10 },
  metric: { flex: 1, padding: 14, alignItems: 'flex-start' },
  metricValue: { marginTop: 8, color: night.text, fontSize: 30, ...nightType.display },
  metricLabel: { color: night.muted, fontSize: 14, ...nightType.medium },
  section: { marginTop: 26 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  monthTitle: { color: night.text, fontSize: 22, textTransform: 'capitalize', ...nightType.semibold },
  weekRow: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', color: night.muted, fontSize: 14, ...nightType.bold },
  calendarGrid: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayDot: { width: '78%', aspectRatio: 1, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  dayDone: { backgroundColor: night.goldSoft, shadowColor: night.goldSoft, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  dayPaused: { borderWidth: 1, borderStyle: 'dashed', borderColor: night.lavender },
  dayToday: { borderWidth: 1.5, borderColor: night.gold },
  dayNumber: { color: night.textSoft, fontSize: 16, ...nightType.medium },
  dayNumberDone: { color: night.sky0, ...nightType.bold },
  dayFuture: { color: 'rgba(207,198,226,0.3)' },
  legend: { marginTop: 10, flexDirection: 'row', gap: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { color: night.muted, fontSize: 14, ...nightType.medium },
  pauseCard: { marginTop: 12 },
  pauseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pauseCopy: { flex: 1 },
  pauseTitle: { color: night.text, fontSize: 18, ...nightType.semibold },
  pauseText: { marginTop: 2, color: night.muted, fontSize: 15, lineHeight: 20, ...nightType.body },
  challengeActive: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  challengeCount: { color: night.text, fontSize: 26, ...nightType.bold },
  challengeTitle: { color: night.text, fontSize: 24, ...nightType.display },
  challengeText: { marginTop: 4, color: night.textSoft, fontSize: 16, lineHeight: 22, ...nightType.body },
  challengeStop: { marginTop: 10, color: night.muted, fontSize: 15, textDecorationLine: 'underline', ...nightType.medium },
  challengeOption: { marginBottom: 10, paddingVertical: 14 },
  challengeOptionTitle: { color: night.text, fontSize: 20, ...nightType.semibold },
  challengeOptionHint: { marginTop: 2, color: night.muted, fontSize: 16, ...nightType.body },
  challengeArrow: { position: 'absolute', right: 18, top: 24 },
  customRow: { marginTop: 10, flexDirection: 'row', gap: 10 },
  customInput: { flex: 1, height: 44, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: night.line, backgroundColor: '#080518', color: night.text, fontSize: 18, ...nightType.medium },
  customStart: { height: 44, paddingHorizontal: 18, borderRadius: 14, backgroundColor: night.gold, justifyContent: 'center' },
  customStartText: { color: night.sky0, fontSize: 17, ...nightType.bold },
  disabled: { opacity: 0.4 },
  footer: { marginTop: 14, color: night.muted, fontSize: 15, textAlign: 'center', ...nightType.body },
  pressed: { opacity: 0.85 },
});
