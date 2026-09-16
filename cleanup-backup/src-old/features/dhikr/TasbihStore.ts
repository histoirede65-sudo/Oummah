import { storageService } from "../../core/storage";

const TASBIH_STATE_KEY = "oummah.tasbih.state.v1";

export type TasbihState = {
  presetId: string;
  stepIndex: number;
  counts: Record<string, number>;
  totalToday: number;
  dayKey: string;
  updatedAt: number;
};

export function tasbihDayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export async function loadTasbihState() {
  return storageService.get<TasbihState>(TASBIH_STATE_KEY).catch(() => null);
}

export async function saveTasbihState(state: TasbihState) {
  return storageService.set(TASBIH_STATE_KEY, state);
}
