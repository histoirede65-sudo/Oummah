import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";

import type { DailyPlan } from "../domain/DailyPlan";
import { isGoalComplete } from "../domain/DailyGoal";
import { goalRepository, summarizeDailyPlan } from "../data/goalRepository";
import { goalProgressBridge } from "../services/goalProgressBridge";
import { dateKey, loadHifzState } from "../../hifz/HifzStore";

export function useDailyGoalsViewModel() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let next = await goalRepository.getToday();
    // Recover a completed review whose goal event was lost when an older build closed.
    const reviewGoal = next.goals.find((goal) => goal.metric === "hifz_review_completed");
    if (reviewGoal && reviewGoal.progress.current < reviewGoal.progress.target) {
      const hifz = await loadHifzState();
      if (hifz.sessions.some((session) => session.date === dateKey() && session.completed === true)) {
        next = await goalRepository.setEvidence("hifz_review_completed", `review:${next.dateKey}`, true);
      }
    }
    setPlan(next);
    setLoading(false);
    return next;
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const unsubscribe = goalProgressBridge.subscribe(setPlan);
    return () => {
      unsubscribe();
    };
  }, []);

  const summary = useMemo(
    () => (plan ? summarizeDailyPlan(plan) : null),
    [plan],
  );
  const essential = useMemo(
    () =>
      plan?.goals.find((goal) => goal.essential && !isGoalComplete(goal)) ??
      plan?.goals.find((goal) => !isGoalComplete(goal)) ??
      plan?.goals[0] ??
      null,
    [plan],
  );

  const toggle = useCallback(async (goalId: string) => {
    const next = await goalRepository.toggle(goalId);
    setPlan(next);
    goalProgressBridge.notify(next);
  }, []);

  const addPersonal = useCallback(async (title: string) => {
    const next = await goalRepository.addPersonal(title);
    setPlan(next);
    goalProgressBridge.notify(next);
  }, []);

  const removePersonal = useCallback(async (goalId: string) => {
    const next = await goalRepository.removePersonal(goalId);
    setPlan(next);
    goalProgressBridge.notify(next);
  }, []);

  return { plan, summary, essential, loading, refresh, toggle, addPersonal, removePersonal };
}
