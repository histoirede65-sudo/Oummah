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
      if (!existing) return goal;
      if (existing.metric !== goal.metric) return goal;
      if (goal.metric === "dhikr_count") return { ...goal, progress: { ...existing.progress, target: goal.progress.target, current: Math.min(existing.progress.current, goal.progress.target), completedAt: existing.progress.current >= goal.progress.target ? existing.progress.completedAt ?? new Date().toISOString() : undefined } };
      if (goal.metric !== "quran_verses_read" && goal.metric !== "dua_read") return { ...goal, progress: existing.progress };
      // Earlier builds counted verses on display and duas via the repetition
      // counter. Keep only explicit reading confirmations for today's plan.
      const evidence = [...new Set(existing.progress.evidence.filter(id => id.startsWith("read:")))];
      const current = Math.min(goal.progress.target, evidence.length);
      return { ...goal, progress: {
        ...existing.progress,
        evidence,
        current,
        completedAt: current >= goal.progress.target ? existing.progress.completedAt ?? new Date().toISOString() : undefined,
      } };
    });
    const personal = stored.goals.filter((goal) => goal.personal);
    const nextIds = [...program, ...personal].map((goal) => goal.id).join("|");
    const storedIds = stored.goals.map((goal) => goal.id).join("|");
    const staleTemplateMetrics = program.some(goal => {
      const previous = existingById.get(goal.id);
      return previous && previous.metric !== goal.metric;
    });
    const staleReadingProgress = stored.goals.some(goal => {
      if (goal.metric !== "quran_verses_read" && goal.metric !== "dua_read") return false;
      const count = new Set(goal.progress.evidence.filter(id => id.startsWith("read:"))).size;
      return goal.progress.evidence.length !== count || goal.progress.current !== Math.min(goal.progress.target, count);
    });
    const staleDhikrTarget = stored.goals.some(goal => goal.metric === "dhikr_count" && goal.progress.target !== (settings.dailyMinutes <= 5 ? 33 : 99));
    if (nextIds === storedIds && !staleReadingProgress && !staleTemplateMetrics && !staleDhikrTarget) return stored;
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

async function setEvidence(metric: DailyGoal["metric"], evidenceId: string, selected: boolean) {
  const plan = await getToday();
  const goals = plan.goals.map(goal => {
    if (goal.metric !== metric || goal.validation !== "automatic") return goal;
    const evidence = new Set(goal.progress.evidence);
    if (selected) evidence.add(evidenceId);
    else evidence.delete(evidenceId);
    const current = Math.min(goal.progress.target, evidence.size);
    return { ...goal, progress: {
      ...goal.progress,
      evidence: [...evidence],
      current,
      completedAt: current >= goal.progress.target ? goal.progress.completedAt ?? new Date().toISOString() : undefined,
    } };
  });
  return save({ ...plan, goals });
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

async function removePersonal(goalId: string) {
  const plan = await getToday();
  const goals = plan.goals.filter((goal) => goal.id !== goalId || !goal.personal);
  if (goals.length === plan.goals.length) return plan;
  return save({ ...plan, goals });
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
  setEvidence,
  toggle,
  addPersonal,
  removePersonal,
  readSettings: readDailyGoalSettings,
  saveSettings,
  updateProgram,
  recent: readRecentDailyPlans,
};
