import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const KEY = "oumma:sirah-read:v1";

let cache: string[] | null = null;
let loading: Promise<string[]> | null = null;
const listeners = new Set<(value: string[]) => void>();

async function loadOpened(): Promise<string[]> {
  if (cache) return cache;
  loading ??= (async () => {
    try {
      const parsed = JSON.parse(await AsyncStorage.getItem(KEY) || "[]");
      cache = Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
    } catch {
      cache = [];
    }
    return cache;
  })();
  return loading;
}

/** Remembers the chapters read, for the « Lu » marks and the progress bar. */
export async function markSirahChapterRead(id: string) {
  const opened = await loadOpened();
  if (opened.includes(id)) return;
  const next = [...opened, id];
  cache = next;
  listeners.forEach((listener) => listener(next));
  try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch { /* progress is a convenience */ }
}

export function useReadSirahChapters(): string[] {
  const [value, setValue] = useState<string[]>(cache ?? []);
  useEffect(() => {
    let alive = true;
    listeners.add(setValue);
    void loadOpened().then((loaded) => { if (alive) setValue(loaded); });
    return () => { alive = false; listeners.delete(setValue); };
  }, []);
  return value;
}

const LAST_KEY = "oumma:sirah-last:v1";
let last: string | null | undefined;
const lastListeners = new Set<(value: string | null) => void>();

/** Last chapter opened, for the « Reprendre » button. */
export async function setLastSirahChapter(id: string) {
  last = id;
  lastListeners.forEach((listener) => listener(id));
  try { await AsyncStorage.setItem(LAST_KEY, id); } catch { /* convenience only */ }
}

export function useLastSirahChapter(): string | null {
  const [value, setValue] = useState<string | null>(last ?? null);
  useEffect(() => {
    let alive = true;
    lastListeners.add(setValue);
    if (last === undefined) {
      AsyncStorage.getItem(LAST_KEY)
        .then((id) => { if (last === undefined) last = id; if (alive) setValue(last ?? null); })
        .catch(() => undefined);
    }
    return () => { alive = false; lastListeners.delete(setValue); };
  }, []);
  return value;
}
