import AsyncStorage from "@react-native-async-storage/async-storage";
import { hadithRepository } from "../data/hadithRepository";

export type HadithOfflinePack = { id: string; label: string; query: string; hadithIds: string[]; downloadedAt: number };
const KEY = "oumma:hadith:offline-packs:v1";

export async function loadHadithOfflinePacks(): Promise<HadithOfflinePack[]> { try { const raw = await AsyncStorage.getItem(KEY); return raw ? JSON.parse(raw) as HadithOfflinePack[] : []; } catch { return []; } }
export async function downloadHadithPack(id: string, label: string, query: string, limit = 20, onProgress?: (value: number) => void) {
  const summaries = (await hadithRepository.search(query)).slice(0, limit);
  const downloaded: string[] = [];
  for (let index = 0; index < summaries.length; index += 1) {
    try { await hadithRepository.get(summaries[index].id); downloaded.push(summaries[index].id); } catch { /* Conserve les fiches déjà obtenues. */ }
    onProgress?.((index + 1) / Math.max(1, summaries.length));
  }
  const packs = await loadHadithOfflinePacks();
  const pack: HadithOfflinePack = { id, label, query, hadithIds: downloaded, downloadedAt: Date.now() };
  const next = [pack, ...packs.filter((item) => item.id !== id)];
  await AsyncStorage.setItem(KEY, JSON.stringify(next)); return pack;
}
export async function removeHadithOfflinePack(id: string) { const next = (await loadHadithOfflinePacks()).filter((item) => item.id !== id); await AsyncStorage.setItem(KEY, JSON.stringify(next)); return next; }

