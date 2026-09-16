export type GoalProgress = {
  current: number;
  target: number;
  unit: "verset" | "minute" | "dhikr" | "doua" | "hadith" | "action";
  evidence: string[];
  completedAt?: string;
};
