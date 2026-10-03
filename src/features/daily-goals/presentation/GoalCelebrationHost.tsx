import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import {
  isIndividualPrayerCelebrationActive,
  subscribeCelebrationCoordinator,
} from "../../celebrations/CelebrationCoordinator";
import { goalRepository } from "../data/goalRepository";
import { isGoalComplete, type DailyGoal } from "../domain/DailyGoal";
import type { DailyPlan } from "../domain/DailyPlan";
import { goalProgressBridge } from "../services/goalProgressBridge";

function messageFor(goal: DailyGoal) {
  switch (goal.metric) {
    case "quran_verses_read":
      return `Félicitations ! Tu as lu les ${goal.progress.target} versets de ton objectif quotidien.`;
    case "dhikr_count":
      return `Félicitations ! Tu as accompli tes ${goal.progress.target} dhikr du jour.`;
    case "hifz_review_completed":
      return "Félicitations ! Tu as révisé un verset aujourd’hui.";
    case "hadith_read":
      return "Félicitations ! Tu as lu ton hadith du jour.";
    case "dua_read":
      return "Félicitations ! Tu as lu ta dou’a du jour.";
    default:
      return `Félicitations ! Tu as accompli ton objectif : ${goal.title.toLowerCase()}.`;
  }
}

export default function GoalCelebrationHost() {
  const previous = useRef<DailyPlan | null>(null);
  const seen = useRef(new Set<string>());
  const queue = useRef<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void goalRepository.getToday().then((plan) => {
      if (active && !previous.current) previous.current = plan;
    }).catch(() => undefined);
    const unsubscribe = goalProgressBridge.subscribe((plan) => {
      const before = previous.current;
      previous.current = plan;
      if (!before || before.dateKey !== plan.dateKey) return;
      for (const goal of plan.goals) {
        const wasComplete = before.goals.find((item) => item.id === goal.id);
        const key = `${plan.dateKey}:${goal.id}`;
        if (wasComplete && !isGoalComplete(wasComplete) && isGoalComplete(goal) && !seen.current.has(key)) {
          seen.current.add(key);
          queue.current.push(messageFor(goal));
        }
      }
      setMessage((current) => (
        current ?? (isIndividualPrayerCelebrationActive() ? null : queue.current.shift() ?? null)
      ));
    });
    const unsubscribeCoordinator = subscribeCelebrationCoordinator((individualActive) => {
      if (individualActive) return;
      setMessage((current) => current ?? queue.current.shift() ?? null);
    });
    return () => {
      active = false;
      unsubscribe();
      unsubscribeCoordinator();
    };
  }, []);

  const dismiss = () => setMessage(queue.current.shift() ?? null);

  return (
    <Modal visible={Boolean(message)} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="sparkles" size={30} color={colors.goldLight} /></View>
          <Text style={styles.heading}>Objectif accompli</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.blessing}>Qu’Allah te récompense et accepte tes efforts. Âmîn.</Text>
          <Pressable accessibilityRole="button" onPress={dismiss} style={styles.button}>
            <Text style={styles.buttonText}>Continuer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(4,6,13,0.76)" },
  card: { padding: 24, alignItems: "center", borderRadius: 27, borderWidth: 1, borderColor: colors.goldLight, backgroundColor: colors.surface, shadowColor: colors.goldLight, shadowOpacity: 0.35, shadowRadius: 20, elevation: 12 },
  icon: { width: 58, height: 58, borderRadius: 29, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(241,188,79,0.14)" },
  heading: { marginTop: 16, color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 24, textAlign: "center" },
  message: { marginTop: 11, color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 24, textAlign: "center" },
  blessing: { marginTop: 14, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 21, textAlign: "center" },
  button: { marginTop: 22, minHeight: 44, paddingHorizontal: 26, justifyContent: "center", borderRadius: 14, backgroundColor: colors.goldLight },
  buttonText: { color: colors.background, fontFamily: typography.sans, fontSize: 14, fontWeight: "800" },
});
