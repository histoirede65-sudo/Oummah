import type { GoalMetric } from "../domain/GoalCategory";
import type { DailyPlan } from "../domain/DailyPlan";
import { goalRepository } from "../data/goalRepository";

export type GoalProgressEvent = {
  metric: Exclude<GoalMetric, "manual">;
  amount?: number;
  absolute?: number;
  evidenceId?: string;
};

type Listener = (plan: DailyPlan) => void;

class GoalProgressBridge {
  private listeners = new Set<Listener>();
  private pending: GoalProgressEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private writeChain = Promise.resolve();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  record(event: GoalProgressEvent) {
    this.pending.push(event);
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const events = this.pending.splice(0);
      this.writeChain = this.writeChain
        .then(() => this.apply(events))
        .catch(() => undefined);
    }, 180);
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const events = this.pending.splice(0);
    if (events.length) await this.apply(events);
    await this.writeChain;
  }

  notify(plan: DailyPlan) {
    this.listeners.forEach((listener) => listener(plan));
  }

  private async apply(events: GoalProgressEvent[]) {
    if (!events.length) return;
    const plan = await goalRepository.getToday();
    let changed = false;
    const goals = plan.goals.map((goal) => {
      const matching = events.filter((event) => event.metric === goal.metric);
      if (!matching.length || goal.validation !== "automatic") return goal;
      let current = goal.progress.current;
      const evidence = new Set(goal.progress.evidence);

      matching.forEach((event) => {
        if (event.evidenceId) {
          if (evidence.has(event.evidenceId)) return;
          evidence.add(event.evidenceId);
        }
        if (typeof event.absolute === "number") {
          current = Math.max(current, event.absolute);
        } else {
          current += event.amount ?? 1;
        }
      });

      current = Math.min(goal.progress.target, Math.max(0, current));
      if (
        current === goal.progress.current &&
        evidence.size === goal.progress.evidence.length
      ) {
        return goal;
      }
      changed = true;
      return {
        ...goal,
        progress: {
          ...goal.progress,
          current,
          evidence: [...evidence],
          completedAt:
            current >= goal.progress.target
              ? goal.progress.completedAt ?? new Date().toISOString()
              : undefined,
        },
      };
    });

    if (!changed) return;
    const saved = await goalRepository.save({ ...plan, goals });
    this.notify(saved);
  }
}

export const goalProgressBridge = new GoalProgressBridge();
