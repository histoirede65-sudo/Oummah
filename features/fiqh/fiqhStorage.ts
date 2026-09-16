import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "oumma:fiqh-progress:v1";
export type FiqhProgress = { lastTopicId?: string; lastCategoryId?: string };
export async function loadFiqhProgress(): Promise<FiqhProgress> { try { return JSON.parse(await AsyncStorage.getItem(KEY) || "{}"); } catch { return {}; } }
export async function saveFiqhProgress(value: FiqhProgress) { await AsyncStorage.setItem(KEY, JSON.stringify(value)); }
