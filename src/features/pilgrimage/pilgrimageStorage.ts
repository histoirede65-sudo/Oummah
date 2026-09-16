import { storageService } from "../../core/storage";
import type { Progress } from "./pilgrimageTypes";
const KEY = "pilgrimage:progress:v1";
export const DEFAULT_PROGRESS: Progress = { mode: "umrah", stepId: "preparation", tawafCount: 0, sayCount: 0 };
export const loadPilgrimageProgress = async () => (await storageService.get<Progress>(KEY)) ?? DEFAULT_PROGRESS;
export const savePilgrimageProgress = (value: Progress) => storageService.set(KEY, value);
export const clearPilgrimageProgress = () => storageService.remove(KEY);
