import type { GoalCategory, GoalMetric } from "./GoalCategory";
import type { GoalProgress } from "./GoalProgress";

export type DailyGoal = {
  id: string;
  title: string;
  subtitle: string;
  category: GoalCategory;
  metric: GoalMetric;
  validation: "automatic" | "manual";
  estimatedMinutes: number;
  essential: boolean;
  sourceRoute?: string;
  personal?: boolean;
  progress: GoalProgress;
};

export function isGoalComplete(goal: DailyGoal) {
  return goal.progress.current >= goal.progress.target;
}
