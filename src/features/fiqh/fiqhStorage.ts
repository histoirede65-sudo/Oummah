import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const KEY = "oumma:fiqh-progress:v1";
const PREFS_KEY = "oumma:fiqh-reading:v1";

export type FiqhProgress = { lastTopicId?: string; lastCategoryId?: string };
export async function loadFiqhProgress(): Promise<FiqhProgress> { try { return JSON.parse(await AsyncStorage.getItem(KEY) || "{}"); } catch { return {}; } }
export async function saveFiqhProgress(value: FiqhProgress) { await AsyncStorage.setItem(KEY, JSON.stringify(value)); }

/** Reading state shared by every Fiqh screen: lessons read, last lesson, text size. */
export type FiqhReading = { read: string[]; lastTopicId?: string; textScale: number };

export const FIQH_TEXT_SCALES = [0.92, 1, 1.12, 1.26];
const DEFAULT_READING: FiqhReading = { read: [], textScale: 1 };

let cache: FiqhReading | null = null;
let loading: Promise<FiqhReading> | null = null;
const listeners = new Set<(value: FiqhReading) => void>();

async function loadReading(): Promise<FiqhReading> {
  if (cache) return cache;
  loading ??= (async () => {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      const parsed = raw ? JSON.parse(raw) as Partial<FiqhReading> : {};
      const legacy = await loadFiqhProgress();
      cache = {
        read: Array.isArray(parsed.read) ? parsed.read : [],
        lastTopicId: parsed.lastTopicId ?? legacy.lastTopicId,
        textScale: FIQH_TEXT_SCALES.includes(parsed.textScale ?? 1) ? parsed.textScale ?? 1 : 1,
      };
    } catch {
      cache = { ...DEFAULT_READING };
    }
    return cache;
  })();
  return loading;
}

export async function updateFiqhReading(change: (value: FiqhReading) => FiqhReading) {
  const next = change(await loadReading());
  cache = next;
  listeners.forEach((listener) => listener(next));
  try { await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* reading state is a convenience */ }
}

export function markFiqhLessonRead(topicId: string) {
  return updateFiqhReading((value) => ({
    ...value,
    lastTopicId: topicId,
    read: value.read.includes(topicId) ? value.read : [...value.read, topicId],
  }));
}

export function useFiqhReading(): FiqhReading {
  const [value, setValue] = useState<FiqhReading>(cache ?? DEFAULT_READING);
  useEffect(() => {
    let alive = true;
    listeners.add(setValue);
    void loadReading().then((loaded) => { if (alive) setValue(loaded); });
    return () => { alive = false; listeners.delete(setValue); };
  }, []);
  return value;
}
