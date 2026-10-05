import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const KEY = "oumma:99-names-opened:v1";

let cache: number[] | null = null;
let loading: Promise<number[]> | null = null;
const listeners = new Set<(value: number[]) => void>();

async function loadOpened(): Promise<number[]> {
  if (cache) return cache;
  loading ??= (async () => {
    try {
      const parsed = JSON.parse(await AsyncStorage.getItem(KEY) || "[]");
      cache = Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id) && id >= 1 && id <= 99) : [];
    } catch {
      cache = [];
    }
    return cache;
  })();
  return loading;
}

/** Remembers that a name's page was opened, for the dot on the grid and the « x / 99 » counter. */
export async function markAllahNameOpened(id: number) {
  const opened = await loadOpened();
  if (opened.includes(id)) return;
  const next = [...opened, id];
  cache = next;
  listeners.forEach((listener) => listener(next));
  try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch { /* progress is a convenience */ }
}

export function useOpenedAllahNames(): number[] {
  const [value, setValue] = useState<number[]>(cache ?? []);
  useEffect(() => {
    let alive = true;
    listeners.add(setValue);
    void loadOpened().then((loaded) => { if (alive) setValue(loaded); });
    return () => { alive = false; listeners.delete(setValue); };
  }, []);
  return value;
}
