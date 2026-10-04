import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { storageService } from "../../core/storage";
import type { HajjType, Rite } from "./pilgrimageTypes";

/** A dua someone asked the pilgrim to make (« prie pour moi là-bas »). */
export type DuaRequest = {
  id: string;
  person: string;
  request: string;
  createdAt: number;
  doneAt: number | null;
  place: string | null;
};

/** Everything the pilgrimage module keeps on the device. */
export type PilgrimageState = {
  version: 2;
  hajjType: HajjType | null;
  reading: Record<Rite, { stepId: string | null; done: string[] }>;
  counters: { tawaf: number; sai: number; jamaratDay: 10 | 11 | 12 | 13; jamarat: [number, number, number] };
  checklist: string[];
  /** Reading size of the books and invocations (1 = normal). */
  textScale: number;
  duaRequests: DuaRequest[];
  /** Notifications of the Hajj days (8 → 13 Dhul-Hijja, Mecca time). */
  hajjReminders: boolean;
};

const KEY = "pilgrimage:state:v2";
const LEGACY_KEY = "pilgrimage:progress:v1";

export const DEFAULT_PILGRIMAGE_STATE: PilgrimageState = {
  version: 2,
  hajjType: null,
  reading: { umrah: { stepId: null, done: [] }, hajj: { stepId: null, done: [] } },
  counters: { tawaf: 0, sai: 0, jamaratDay: 10, jamarat: [0, 0, 0] },
  checklist: [],
  textScale: 1,
  duaRequests: [],
  hajjReminders: false,
};

type LegacyProgress = { mode?: Rite; hajjType?: HajjType; stepId?: string; tawafCount?: number; sayCount?: number };

let cache: PilgrimageState | null = null;
const listeners = new Set<(state: PilgrimageState) => void>();

export async function loadPilgrimageState(): Promise<PilgrimageState> {
  if (cache) return cache;
  const stored = await storageService.get<PilgrimageState>(KEY).catch(() => null);
  if (stored?.version === 2) {
    cache = {
      ...DEFAULT_PILGRIMAGE_STATE,
      ...stored,
      reading: { ...DEFAULT_PILGRIMAGE_STATE.reading, ...stored.reading },
      counters: { ...DEFAULT_PILGRIMAGE_STATE.counters, ...stored.counters },
    };
    return cache;
  }
  // First launch of the new guide: keep the counters and Hajj type of the old Mode Pèlerin.
  const legacy = await storageService.get<LegacyProgress>(LEGACY_KEY).catch(() => null);
  cache = {
    ...DEFAULT_PILGRIMAGE_STATE,
    hajjType: legacy?.hajjType ?? null,
    counters: {
      ...DEFAULT_PILGRIMAGE_STATE.counters,
      tawaf: Math.min(7, legacy?.tawafCount ?? 0),
      sai: Math.min(7, legacy?.sayCount ?? 0),
    },
  };
  return cache;
}

let writeQueue: Promise<void> = Promise.resolve();

export function updatePilgrimageState(update: (state: PilgrimageState) => PilgrimageState) {
  const run = async () => {
    const next = update(await loadPilgrimageState());
    cache = next;
    listeners.forEach((listener) => listener(next));
    await storageService.set(KEY, next).catch(() => undefined);
  };
  writeQueue = writeQueue.then(run, run);
  return writeQueue;
}

/** Live state shared by every pilgrimage screen. */
export function usePilgrimageState() {
  const [state, setState] = useState<PilgrimageState | null>(cache);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  useFocusEffect(useCallback(() => {
    void loadPilgrimageState().then(setState);
  }, []));

  return state;
}
