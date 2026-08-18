export type ProgressivePathSessionKind = "learning" | "review" | "consolidation";
export type ProgressivePathSessionStatus = "pending" | "completed" | "postponed";
export type ProgressivePathSessionFeedback = "easy" | "normal" | "difficult";

export type ProgressivePathSession = {
  id: string;
  order: number;
  kind: ProgressivePathSessionKind;
  title: string;
  description: string;
  verseStart?: number;
  verseEnd?: number;
  estimatedMinutes: number;
  status: ProgressivePathSessionStatus;
  feedback?: ProgressivePathSessionFeedback;
  completedAt?: string;
};

export type ProgressivePath = {
  id: string;
  type: "hifz-surah";
  premium: true;
  title: string;
  subtitle: string;
  subjectId: string;
  subjectLabel: string;
  totalUnits: number;
  dailyMinutes: 5 | 10 | 20 | 30;
  createdAt: string;
  updatedAt: string;
  status: "active" | "completed" | "paused";
  sessions: ProgressivePathSession[];
};

export function progressivePathProgress(path: ProgressivePath) {
  const completed = path.sessions.filter((session) => session.status === "completed").length;
  return {
    completed,
    total: path.sessions.length,
    ratio: path.sessions.length ? completed / path.sessions.length : 0,
  };
}

export function nextProgressivePathSession(path: ProgressivePath) {
  return path.sessions.find((session) => session.status !== "completed") ?? null;
}
