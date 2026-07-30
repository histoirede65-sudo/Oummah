import type { DailyGoal } from "../domain/DailyGoal";
import { isGoalComplete } from "../domain/DailyGoal";
import type {
  DailyGoalSettings,
  DailyPlan,
  DailyPlanSummary,
} from "../domain/DailyPlan";
import { createDailyGoalTemplates } from "./goalTemplates";
import {
  dailyGoalDateKey,
  readDailyGoalSettings,
  readDailyPlan,
  readRecentDailyPlans,
  writeDailyGoalSettings,
  writeDailyPlan,
} from "./goalStorage";

export function summarizeDailyPlan(plan: DailyPlan): DailyPlanSummary {
  const completed = plan.goals.filter(isGoalComplete).length;
  const remainingMinutes = plan.goals.reduce(
    (total, goal) => total + (isGoalComplete(goal) ? 0 : goal.estimatedMinutes),
    0,
  );
  return {
    total: plan.goals.length,
    completed,
    remainingMinutes,
    progress: plan.goals.length ? completed / plan.goals.length : 0,
  };
}

async function getToday(): Promise<DailyPlan> {
  const dateKey = dailyGoalDateKey();
  const stored = await readDailyPlan(dateKey);
  const settings = await readDailyGoalSettings();
  if (stored) {
    const templates = createDailyGoalTemplates(settings);
    const existingById = new Map(stored.goals.map((goal) => [goal.id, goal]));
    const program = templates.map((goal) => {
      const existing = existingById.get(goal.id);
      return existing ? { ...goal, progress: existing.progress } : goal;
    });
    const personal = stored.goals.filter((goal) => goal.personal);
    const nextIds = [...program, ...personal].map((goal) => goal.id).join("|");
    const storedIds = stored.goals.map((goal) => goal.id).join("|");
    if (nextIds === storedIds) return stored;
    const migrated = {
      ...stored,
      goals: [...program, ...personal],
      updatedAt: new Date().toISOString(),
    };
    await writeDailyPlan(migrated);
    return migrated;
  }
  const now = new Date().toISOString();
  const plan: DailyPlan = {
    dateKey,
    goals: createDailyGoalTemplates(settings),
    createdAt: now,
    updatedAt: now,
  };
  await writeDailyPlan(plan);
  return plan;
}

async function save(plan: DailyPlan) {
  const next = { ...plan, updatedAt: new Date().toISOString() };
  await writeDailyPlan(next);
  return next;
}

async function toggle(goalId: string) {
  const plan = await getToday();
  return save({
    ...plan,
    goals: plan.goals.map((goal) => {
      if (goal.id !== goalId || goal.validation !== "manual") return goal;
      const complete = isGoalComplete(goal);
      return {
        ...goal,
        progress: {
          ...goal.progress,
          current: complete ? 0 : goal.progress.target,
          completedAt: complete ? undefined : new Date().toISOString(),
        },
      };
    }),
  });
}

async function addPersonal(title: string, estimatedMinutes = 5) {
  const plan = await getToday();
  const newGoal: DailyGoal = {
    id: `personal-${Date.now()}`,
    title: title.trim(),
    subtitle: "Objectif personnel",
    category: "personal",
    metric: "manual",
    validation: "manual",
    estimatedMinutes,
    essential: false,
    personal: true,
    progress: { current: 0, target: 1, unit: "action", evidence: [] },
  };
  return save({ ...plan, goals: [...plan.goals, newGoal] });
}

async function saveSettings(settings: DailyGoalSettings) {
  await writeDailyGoalSettings(settings);
  return settings;
}

async function updateProgram(settings: DailyGoalSettings) {
  await writeDailyGoalSettings(settings);
  const plan = await getToday();
  const existingById = new Map(plan.goals.map((goal) => [goal.id, goal]));
  const program = createDailyGoalTemplates(settings).map((goal) => {
    const existing = existingById.get(goal.id);
    if (!existing) return goal;
    const current = Math.min(existing.progress.current, goal.progress.target);
    return {
      ...goal,
      progress: {
        ...goal.progress,
        current,
        evidence: existing.progress.evidence,
        completedAt:
          current >= goal.progress.target
            ? existing.progress.completedAt ?? new Date().toISOString()
            : undefined,
      },
    };
  });
  const personal = plan.goals.filter((goal) => goal.personal);
  return save({ ...plan, goals: [...program, ...personal] });
}

export const goalRepository = {
  getToday,
  save,
  toggle,
  addPersonal,
  readSettings: readDailyGoalSettings,
  saveSettings,
  updateProgram,
  recent: readRecentDailyPlans,
};
