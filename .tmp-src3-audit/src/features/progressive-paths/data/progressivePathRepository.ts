import type {
  ProgressivePath,
  ProgressivePathSessionFeedback,
} from "../domain/ProgressivePath";
import { nextProgressivePathSession } from "../domain/ProgressivePath";
import { readProgressivePaths, writeProgressivePaths } from "./progressivePathStorage";

function createKahfSessions(dailyMinutes: ProgressivePath["dailyMinutes"]) {
  const versesPerSession = dailyMinutes === 5 ? 2 : dailyMinutes === 10 ? 3 : dailyMinutes === 20 ? 5 : 7;
  const sessions: ProgressivePath["sessions"] = [];
  let verse = 1;
  let learningCount = 0;

  while (verse <= 110) {
    const end = Math.min(110, verse + versesPerSession - 1);
    learningCount += 1;
    sessions.push({
      id: `kahf-learning-${verse}-${end}`,
      order: sessions.length + 1,
      kind: "learning",
      title: `Mémoriser les versets ${verse} à ${end}`,
      description: "Écouter, répéter puis réciter sans regarder.",
      verseStart: verse,
      verseEnd: end,
      estimatedMinutes: dailyMinutes,
      status: "pending",
    });

    if (learningCount % 3 === 0 && end < 110) {
      const reviewStart = Math.max(1, verse - versesPerSession * 2);
      sessions.push({
        id: `kahf-review-${reviewStart}-${end}`,
        order: sessions.length + 1,
        kind: "review",
        title: `Réviser les versets ${reviewStart} à ${end}`,
        description: "Réciter les trois dernières portions et reprendre les passages hésitants.",
        verseStart: reviewStart,
        verseEnd: end,
        estimatedMinutes: Math.max(5, Math.round(dailyMinutes * 0.75)),
        status: "pending",
      });
    }
    verse = end + 1;
  }

  sessions.push({
    id: "kahf-consolidation-final",
    order: sessions.length + 1,
    kind: "consolidation",
    title: "Consolidation complète d’Al-Kahf",
    description: "Réciter la sourate en plusieurs blocs, puis reprendre uniquement les erreurs.",
    verseStart: 1,
    verseEnd: 110,
    estimatedMinutes: 30,
    status: "pending",
  });

  return sessions;
}

async function list() {
  return readProgressivePaths();
}

async function getActive() {
  const paths = await readProgressivePaths();
  return paths.find((path) => path.status === "active") ?? null;
}

async function createKahfPath(dailyMinutes: ProgressivePath["dailyMinutes"]) {
  const paths = await readProgressivePaths();
  const existing = paths.find(
    (path) => path.type === "hifz-surah" && path.subjectId === "18" && path.status === "active",
  );
  if (existing) return existing;

  const now = new Date().toISOString();
  const path: ProgressivePath = {
    id: `hifz-kahf-${Date.now()}`,
    type: "hifz-surah",
    premium: true,
    title: "Mémoriser la sourate Al-Kahf",
    subtitle: "Parcours progressif avec révisions intelligentes",
    subjectId: "18",
    subjectLabel: "Al-Kahf",
    totalUnits: 110,
    dailyMinutes,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessions: createKahfSessions(dailyMinutes),
  };
  await writeProgressivePaths([path, ...paths]);
  return path;
}

async function updateSession(
  pathId: string,
  sessionId: string,
  status: "completed" | "postponed",
  feedback?: ProgressivePathSessionFeedback,
) {
  const paths = await readProgressivePaths();
  let updated: ProgressivePath | null = null;
  const nextPaths = paths.map((path) => {
    if (path.id !== pathId) return path;
    const sessions = path.sessions.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            status,
            feedback,
            completedAt: status === "completed" ? new Date().toISOString() : undefined,
          }
        : session,
    );
    const isComplete = sessions.every((session) => session.status === "completed");
    updated = {
      ...path,
      sessions,
      status: isComplete ? "completed" : "active",
      updatedAt: new Date().toISOString(),
    };
    return updated;
  });
  await writeProgressivePaths(nextPaths);
  return updated;
}

async function completeNext(pathId: string, feedback: ProgressivePathSessionFeedback = "normal") {
  const paths = await readProgressivePaths();
  const path = paths.find((item) => item.id === pathId);
  if (!path) return null;
  const next = nextProgressivePathSession(path);
  if (!next) return path;
  return updateSession(pathId, next.id, "completed", feedback);
}

async function postponeNext(pathId: string) {
  const paths = await readProgressivePaths();
  const path = paths.find((item) => item.id === pathId);
  if (!path) return null;
  const next = nextProgressivePathSession(path);
  if (!next) return path;
  const moved = path.sessions.filter((session) => session.id !== next.id);
  const postponed = { ...next, status: "postponed" as const, order: moved.length + 1 };
  const reordered = [...moved, postponed].map((session, index) => ({ ...session, order: index + 1 }));
  const updated = { ...path, sessions: reordered, updatedAt: new Date().toISOString() };
  await writeProgressivePaths(paths.map((item) => (item.id === pathId ? updated : item)));
  return updated;
}

export const progressivePathRepository = {
  list,
  getActive,
  createKahfPath,
  completeNext,
  postponeNext,
};
