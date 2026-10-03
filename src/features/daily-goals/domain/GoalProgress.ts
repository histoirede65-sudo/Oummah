export type GoalProgress = {
  current: number;
  target: number;
  unit: "verset" | "minute" | "dhikr" | "doua" | "hadith" | "prière" | "action";
  evidence: string[];
  completedAt?: string;
};
