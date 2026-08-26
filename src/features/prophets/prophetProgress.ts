import AsyncStorage from "@react-native-async-storage/async-storage";

export type ProphetProgress = {
  completed: string[];
  lastChapterId: string | null;
  updatedAt: number;
};

const EMPTY: ProphetProgress = { completed: [], lastChapterId: null, updatedAt: 0 };
const keyFor = (prophetId: string) => `oummah:prophets:${prophetId}:v1`;

export async function loadProphetProgress(prophetId: string): Promise<ProphetProgress> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(prophetId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<ProphetProgress>;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed.filter((value): value is string => typeof value === "string") : [],
      lastChapterId: typeof parsed.lastChapterId === "string" ? parsed.lastChapterId : null,
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return EMPTY;
  }
}

export async function saveProphetProgress(prophetId: string, progress: Omit<ProphetProgress, "updatedAt">) {
  await AsyncStorage.setItem(keyFor(prophetId), JSON.stringify({ ...progress, updatedAt: Date.now() }));
}

// Backward-compatible aliases for the existing Mûsâ screen.
export type MusaProgress = ProphetProgress;
export const loadMusaProgress = () => loadProphetProgress("musa");
export const saveMusaProgress = (progress: Omit<ProphetProgress, "updatedAt">) => saveProphetProgress("musa", progress);
