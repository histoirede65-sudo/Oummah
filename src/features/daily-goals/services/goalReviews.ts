import type { GoalCategory, GoalMetric } from "../domain/GoalCategory";
import { isGoalComplete } from "../domain/DailyGoal";
import type { DailyPlan } from "../domain/DailyPlan";
import { dailyGoalDateKey, readDailyPlansFor } from "../data/goalStorage";

export type ReviewPeriod = "week" | "month" | "year";

export type ReviewDay = { key: string; completed: number; total: number };

export type GoalReview = {
  period: ReviewPeriod;
  start: Date;
  /** Last day of the period, or today when the period is still running (current year). */
  end: Date;
  ongoing: boolean;
  days: ReviewDay[];
  activeDays: number;
  /** Days of the period already lived (the whole period once it is over). */
  dayCount: number;
  completedGoals: number;
  totals: Partial<Record<GoalMetric, number>>;
  categories: { category: GoalCategory; rate: number }[];
  bestDay: ReviewDay | null;
  longestStreak: number;
  /** Active days of the period before, for « +2 jours ». Null when there was no data at all. */
  previousActiveDays: number | null;
  previousTotals: Partial<Record<GoalMetric, number>> | null;
  /** Year only: month with the most active days (0-11). */
  bestMonth: number | null;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Bounds of the period `offset` steps back. Week: Monday to Sunday. Offset 0 is the last complete
 *  week/month; for the year, offset 0 is the current year (so far), except in January (last year). */
export function reviewBounds(period: ReviewPeriod, offset: number, today = new Date()) {
  const day = startOfDay(today);
  if (period === "week") {
    const monday = new Date(day);
    monday.setDate(day.getDate() - ((day.getDay() + 6) % 7) - 7 * (offset + 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday, ongoing: false };
  }
  if (period === "month") {
    const start = new Date(day.getFullYear(), day.getMonth() - 1 - offset, 1);
    return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 0), ongoing: false };
  }
  const year = day.getFullYear() - (day.getMonth() === 0 ? 1 : 0) - offset;
  const end = new Date(year, 11, 31);
  const ongoing = end >= day;
  return { start: new Date(year, 0, 1), end: ongoing ? day : end, ongoing };
}

function dayKeys(start: Date, end: Date) {
  // Step by calendar day, not by 24 h, so daylight-saving changes never skip or repeat a day.
  const keys: string[] = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) keys.push(dailyGoalDateKey(day));
  return keys;
}

function summarize(plans: DailyPlan[]) {
  const totals: Partial<Record<GoalMetric, number>> = {};
  const byCategory = new Map<GoalCategory, { done: number; total: number }>();
  const byDay = new Map<string, ReviewDay>();
  for (const plan of plans) {
    let completed = 0;
    for (const goal of plan.goals) {
      const done = isGoalComplete(goal);
      if (done) completed += 1;
      if (goal.metric !== "manual") totals[goal.metric] = (totals[goal.metric] ?? 0) + Math.max(0, goal.progress.current);
      const entry = byCategory.get(goal.category) ?? { done: 0, total: 0 };
      entry.total += 1;
      if (done) entry.done += 1;
      byCategory.set(goal.category, entry);
    }
    byDay.set(plan.dateKey, { key: plan.dateKey, completed, total: plan.goals.length });
  }
  return { totals, byCategory, byDay };
}

export async function loadGoalReview(period: ReviewPeriod, offset = 0, today = new Date()): Promise<GoalReview> {
  const { start, end, ongoing } = reviewBounds(period, offset, today);
  const keys = dayKeys(start, end);
  const previous = reviewBounds(period, offset + 1, today);
  // Compare like with like: a year still running is compared with the same days of the year before.
  const previousEnd = ongoing ? new Date(previous.start.getFullYear(), end.getMonth(), end.getDate()) : previous.end;
  const previousKeys = dayKeys(previous.start, previousEnd);

  const [plans, previousPlans] = await Promise.all([readDailyPlansFor(keys), readDailyPlansFor(previousKeys)]);
  const current = summarize(plans);
  const before = summarize(previousPlans);

  const days = keys.map((key) => current.byDay.get(key) ?? { key, completed: 0, total: 0 });
  const active = (item: ReviewDay) => item.completed > 0;

  let longestStreak = 0;
  let run = 0;
  for (const item of days) {
    run = active(item) ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }

  const bestDay = days.reduce<ReviewDay | null>((best, item) => (item.completed > 0 && (!best || item.completed > best.completed) ? item : best), null);

  let bestMonth: number | null = null;
  if (period === "year") {
    const perMonth = new Array<number>(12).fill(0);
    for (const item of days) if (active(item)) perMonth[Number(item.key.slice(5, 7)) - 1] += 1;
    const max = Math.max(...perMonth);
    bestMonth = max > 0 ? perMonth.indexOf(max) : null;
  }

  return {
    period,
    start,
    end,
    ongoing,
    days,
    activeDays: days.filter(active).length,
    dayCount: days.length,
    completedGoals: days.reduce((sum, item) => sum + item.completed, 0),
    totals: current.totals,
    categories: [...current.byCategory.entries()]
      .filter(([, value]) => value.total > 0)
      .map(([category, value]) => ({ category, rate: Math.round((value.done / value.total) * 100) }))
      .sort((a, b) => b.rate - a.rate),
    bestDay,
    longestStreak,
    previousActiveDays: previousPlans.length ? [...before.byDay.values()].filter(active).length : null,
    previousTotals: previousPlans.length ? before.totals : null,
    bestMonth,
  };
}
