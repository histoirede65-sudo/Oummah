import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ProgressivePath } from "../domain/ProgressivePath";

const PATHS_KEY = "oumma:progressive-paths:v1";

export async function readProgressivePaths(): Promise<ProgressivePath[]> {
  const raw = await AsyncStorage.getItem(PATHS_KEY).catch(() => null);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ProgressivePath[];
  } catch {
    return [];
  }
}

export async function writeProgressivePaths(paths: ProgressivePath[]) {
  await AsyncStorage.setItem(PATHS_KEY, JSON.stringify(paths));
}
