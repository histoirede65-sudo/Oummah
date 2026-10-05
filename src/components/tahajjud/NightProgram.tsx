import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { goalRepository } from '../../features/daily-goals/data/goalRepository';
import type { DailyGoal } from '../../features/daily-goals/domain/DailyGoal';
import type { GoalMetric } from '../../features/daily-goals/domain/GoalCategory';
import { readGoalActivity } from '../../features/daily-goals/services/goalActivity';
import { GlassCard, shellStyles } from './TahajjudShell';
import { night, nightType } from './theme';
import { tx } from '../../features/tahajjud/tahajjudI18n';

/**
 * « Programme de la nuit » : dhikr, Coran, hadith, prophètes, doua. Each action opens the existing
 * module, which already feeds the daily goals; a tile is ticked when that activity happened tonight.
 */

type Action = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  href: Href;
  metrics: GoalMetric[];
};

const ACTIONS: Action[] = [
  { id: 'dhikr', icon: 'ellipse-outline', title: 'Dhikr de la nuit', hint: 'SubhanAllah, Alhamdulillah, Allahu akbar…', href: '/dhikr' as Href, metrics: ['dhikr_count'] },
  { id: 'mulk', icon: 'moon-outline', title: 'Sourate Al-Mulk', hint: 'Le Prophète ﷺ ne dormait pas sans la réciter', href: '/surah/67' as Href, metrics: ['quran_verses_read', 'quran_listen_seconds'] },
  { id: 'listen', icon: 'headset-outline', title: 'Écouter le Coran', hint: 'Laisser la récitation apaiser la nuit', href: '/listen/reciters' as Href, metrics: ['quran_listen_seconds'] },
  { id: 'hadith', icon: 'library-outline', title: 'Lire un hadith', hint: 'Le hadith du jour, en une minute', href: { pathname: '/hadiths', params: { open: 'daily' } } as unknown as Href, metrics: ['hadith_read'] },
  { id: 'prophets', icon: 'star-outline', title: 'Histoire d’un prophète', hint: 'Lire ou écouter un chapitre', href: '/prophets' as Href, metrics: ['prophet_story'] },
  { id: 'dua', icon: 'heart-outline', title: 'Une doua', hint: 'Les invocations du Coran et de la Sunna', href: '/dua' as Href, metrics: ['dua_read', 'dua_listen_seconds'] },
];

function goalLine(goals: DailyGoal[], metrics: GoalMetric[]) {
  const goal = goals.find((item) => metrics.includes(item.metric) && item.validation === 'automatic');
  if (!goal) return null;
  const minutes = goal.progress.unit === 'minute';
  const current = minutes ? Math.floor(goal.progress.current / 60) : Math.floor(goal.progress.current);
  const target = minutes ? Math.ceil(goal.progress.target / 60) : goal.progress.target;
  const done = goal.progress.current >= goal.progress.target;
  return { text: done ? tx('Objectif du jour atteint') : tx("Objectif : {0}/{1}{2}", [current, target, minutes ? ' min' : '']), done };
}

export function NightProgram({ since }: { since: number | null }) {
  const [activity, setActivity] = useState<Partial<Record<GoalMetric, string>>>({});
  const [goals, setGoals] = useState<DailyGoal[]>([]);

  useFocusEffect(useCallback(() => {
    void readGoalActivity().then(setActivity);
    void goalRepository.getToday().then((plan) => setGoals(plan.goals)).catch(() => undefined);
  }, []));

  // Tonight = since Maghrib (or since midnight when the night is unknown).
  const from = since ?? new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const isDone = (action: Action) => action.metrics.some((metric) => {
    const at = activity[metric];
    return at ? Date.parse(at) >= from : false;
  });
  const doneCount = ACTIONS.filter(isDone).length;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[shellStyles.sectionLabel, styles.noMargin]}>{tx("Programme de la nuit")}</Text>
        <Text style={styles.count}>{doneCount}/{ACTIONS.length}</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${(doneCount / ACTIONS.length) * 100}%` }]} /></View>

      <View style={styles.grid}>
        {ACTIONS.map((action) => {
          const done = isDone(action);
          const goal = goalLine(goals, action.metrics);
          return (
            <Pressable key={action.id} onPress={() => router.push(action.href)} style={({ pressed }) => [styles.tileWrap, pressed && styles.pressed]}>
              <GlassCard gold={done} style={styles.tile}>
                <View style={styles.tileTop}>
                  <View style={[styles.icon, done && styles.iconDone]}>
                    <Ionicons name={done ? 'checkmark' : action.icon} size={19} color={done ? night.sky0 : night.goldSoft} />
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={night.muted} />
                </View>
                <Text style={styles.title}>{tx(action.title)}</Text>
                <Text style={styles.hint} numberOfLines={2}>{tx(action.hint)}</Text>
                {goal ? <Text style={[styles.goal, goal.done && styles.goalDone]}>{goal.text}</Text> : null}
              </GlassCard>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.note}>{tx("Chaque action compte automatiquement dans vos objectifs du jour.")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 26 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noMargin: { marginBottom: 0 },
  count: { color: night.goldSoft, fontSize: 16, ...nightType.bold },
  track: { marginTop: 10, height: 6, borderRadius: 3, backgroundColor: night.glassStrong, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: night.gold },
  grid: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tileWrap: { width: '47%', flexGrow: 1 },
  tile: { padding: 14, minHeight: 150 },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: night.glassStrong, borderWidth: 1, borderColor: night.goldLine },
  iconDone: { backgroundColor: night.gold, borderColor: night.gold },
  title: { marginTop: 10, color: night.text, fontSize: 17, lineHeight: 22, ...nightType.semibold },
  hint: { marginTop: 4, color: night.muted, fontSize: 13, lineHeight: 18, ...nightType.body },
  goal: { marginTop: 8, color: night.lavender, fontSize: 12, ...nightType.bold },
  goalDone: { color: night.success },
  note: { marginTop: 10, color: night.muted, fontSize: 13, textAlign: 'center', ...nightType.body },
  pressed: { opacity: 0.85 },
});
