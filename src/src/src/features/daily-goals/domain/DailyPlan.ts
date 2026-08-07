import type { DailyGoal } from "./DailyGoal";

export type DailyPlan = {
  dateKey: string;
  goals: DailyGoal[];
  createdAt: string;
  updatedAt: string;
};

export type DailyGoalSettings = {
  dailyMinutes: 5 | 10 | 20 | 30;
  focus: Array<"quran" | "prayer" | "dhikr" | "hifz" | "dua" | "hadith" | "character">;
  onboardingComplete: boolean;
};

export type DailyPlanSummary = {
  total: number;
  completed: number;
  remainingMinutes: number;
  progress: number;
};
