import type { DailyGoal } from "../domain/DailyGoal";
import type { DailyGoalSettings } from "../domain/DailyPlan";

function goal(
  input: Omit<DailyGoal, "progress"> & {
    target: number;
    unit: DailyGoal["progress"]["unit"];
  },
): DailyGoal {
  const { target, unit, ...definition } = input;
  return {
    ...definition,
    progress: { current: 0, target, unit, evidence: [] },
  };
}

export function createDailyGoalTemplates(
  settings: DailyGoalSettings,
): DailyGoal[] {
  const quranTarget = settings.dailyMinutes <= 5 ? 3 : settings.dailyMinutes >= 20 ? 10 : 5;
  const dhikrTarget = settings.dailyMinutes <= 5 ? 33 : 100;
  const includeListening = settings.dailyMinutes >= 20;

  const goals: DailyGoal[] = [
    goal({
      id: "program-quran-reading",
      title: `Lire ${quranTarget} versets`,
      subtitle: "La progression se fait pendant votre lecture",
      category: "quran",
      metric: "quran_verses_read",
      validation: "automatic",
      estimatedMinutes: Math.max(2, Math.round(quranTarget * 0.6)),
      essential: true,
      sourceRoute: "/quran",
      target: quranTarget,
      unit: "verset",
    }),
    goal({
      id: "program-dhikr",
      title: `Faire ${dhikrTarget} dhikr`,
      subtitle: "Relié automatiquement au compteur",
      category: "dhikr",
      metric: "dhikr_count",
      validation: "automatic",
      estimatedMinutes: settings.dailyMinutes <= 5 ? 2 : 4,
      essential: false,
      sourceRoute: "/dhikr",
      target: dhikrTarget,
      unit: "dhikr",
    }),
    goal({
      id: "program-hifz",
      title: "Réviser un verset",
      subtitle: "Une petite étape de mémorisation",
      category: "hifz",
      metric: "hifz_verses_learned",
      validation: "automatic",
      estimatedMinutes: 3,
      essential: false,
      sourceRoute: "/hifz",
      target: 1,
      unit: "verset",
    }),
    goal({
      id: "program-dua",
      title: "Lire une dou’a",
      subtitle: "Une invocation lue dans le module Dou’a",
      category: "dua",
      metric: "dua_read",
      validation: "automatic",
      estimatedMinutes: 2,
      essential: false,
      sourceRoute: "/dua",
      target: 1,
      unit: "doua",
    }),
    goal({
      id: "program-hadith",
      title: "Lire le hadith du jour",
      subtitle: "Lisez l’enseignement proposé aujourd’hui",
      category: "hadith",
      metric: "hadith_read",
      validation: "automatic",
      estimatedMinutes: 2,
      essential: false,
      sourceRoute: "/hadith",
      target: 1,
      unit: "hadith",
    }),
  ];

  if (includeListening) {
    goals.splice(
      1,
      0,
      goal({
        id: "program-quran-listening",
        title: "Écouter 10 minutes de Coran",
        subtitle: "Le temps d’écoute est compté automatiquement",
        category: "quran",
        metric: "quran_listen_seconds",
        validation: "automatic",
        estimatedMinutes: 10,
        essential: false,
        sourceRoute: "/listen/reciters",
        target: 600,
        unit: "minute",
      }),
    );
  }

  const filtered = goals.filter((item) =>
    settings.focus.includes(item.category as DailyGoalSettings["focus"][number]),
  );
  const fallback = goals[0];
  return filtered.length || !fallback ? filtered : [fallback];
}
