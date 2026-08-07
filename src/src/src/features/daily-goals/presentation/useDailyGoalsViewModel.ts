import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import type { DailyPlan } from "../domain/DailyPlan";
import { isGoalComplete } from "../domain/DailyGoal";
import { goalRepository, summarizeDailyPlan } from "../data/goalRepository";
import { goalProgressBridge } from "../services/goalProgressBridge";

export function useDailyGoalsViewModel() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await goalRepository.getToday();
    setPlan(next);
    setLoading(false);
    return next;
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => goalProgressBridge.subscribe(setPlan), []);

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

  return {
    plan,
    summary,
    essential,
    loading,
    refresh,
    toggle,
    addPersonal,
    readSettings: goalRepository.readSettings,
  };
}
