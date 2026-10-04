export type GoalProgress = {
  current: number;
  target: number;
  unit: "verset" | "minute" | "dhikr" | "doua" | "hadith" | "prière" | "histoire" | "action";
  evidence: string[];
  completedAt?: string;
};
