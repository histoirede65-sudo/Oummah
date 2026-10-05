import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const KEY = "oumma:companions-opened:v1";

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

/** Remembers that a biography was opened, for the « Lu » mark on the list. */
export async function markCompanionOpened(id: string) {
  const opened = await loadOpened();
  if (opened.includes(id)) return;
  const next = [...opened, id];
  cache = next;
  listeners.forEach((listener) => listener(next));
  try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch { /* progress is a convenience */ }
}

export function useOpenedCompanions(): string[] {
  const [value, setValue] = useState<string[]>(cache ?? []);
  useEffect(() => {
    let alive = true;
    listeners.add(setValue);
    void loadOpened().then((loaded) => { if (alive) setValue(loaded); });
    return () => { alive = false; listeners.delete(setValue); };
  }, []);
  return value;
}
