import AsyncStorage from '@react-native-async-storage/async-storage';
import { dailyGoalDateKey } from '../daily-goals/data/goalStorage';

export type ReadingConfirmationKind = 'quran' | 'hadith' | 'dua';
const storageKey = (kind: ReadingConfirmationKind, dateKey = dailyGoalDateKey()) => `oummah.read-confirmations.v1.${dateKey}.${kind}`;
let writeChain = Promise.resolve();

export async function loadReadConfirmations(kind: ReadingConfirmationKind): Promise<Set<string>> {
  return loadReadConfirmationsForDate(kind, dailyGoalDateKey());
}

export async function loadReadConfirmationsForDate(kind: ReadingConfirmationKind, dateKey: string): Promise<Set<string>> {
  try {
    const value: unknown = JSON.parse((await AsyncStorage.getItem(storageKey(kind, dateKey))) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []);
  } catch { return new Set(); }
}

export async function hasReadConfirmationsForDate(kind: ReadingConfirmationKind, dateKey: string) {
  return (await AsyncStorage.getItem(storageKey(kind, dateKey))) !== null;
}

export function setReadConfirmation(kind: ReadingConfirmationKind, id: string, selected: boolean): Promise<Set<string>> {
  const operation = writeChain.then(async () => {
    const current = await loadReadConfirmations(kind);
    if (selected) current.add(id);
    else current.delete(id);
    await AsyncStorage.setItem(storageKey(kind), JSON.stringify([...current]));
    return current;
  });
  writeChain = operation.then(() => undefined, () => undefined);
  return operation;
}

export function onLocalMidnight(callback: () => void): () => void {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    timer = setTimeout(() => { callback(); schedule(); }, Math.max(1000, tomorrow.getTime() - Date.now() + 50));
  };
  schedule();
  return () => clearTimeout(timer);
}
