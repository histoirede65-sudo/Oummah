import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Hadith } from "../domain/Hadith";

export type PersonalHadithList = { id: string; name: string; color: string; createdAt: number; hadiths: { id: string; title: string; grade: string; reference: string; addedAt: number }[] };
const KEY = "oumma:hadith:personal-lists:v1";

export async function loadPersonalHadithLists(): Promise<PersonalHadithList[]> {
  try { const raw = await AsyncStorage.getItem(KEY); return raw ? JSON.parse(raw) as PersonalHadithList[] : []; } catch { return []; }
}
export function savePersonalHadithLists(lists: PersonalHadithList[]) { return AsyncStorage.setItem(KEY, JSON.stringify(lists)); }
export async function createPersonalHadithList(name: string, color = "#B8874B") {
  const lists = await loadPersonalHadithLists();
  const list: PersonalHadithList = { id: `${Date.now()}`, name: name.trim(), color, createdAt: Date.now(), hadiths: [] };
  await savePersonalHadithLists([list, ...lists]); return list;
}
export async function addHadithToPersonalList(listId: string, hadith: Hadith) {
  const lists = await loadPersonalHadithLists();
  const next = lists.map((list) => list.id !== listId ? list : { ...list, hadiths: [{ id: hadith.id, title: hadith.title, grade: hadith.grade, reference: hadith.reference, addedAt: Date.now() }, ...list.hadiths.filter((item) => item.id !== hadith.id)] });
  await savePersonalHadithLists(next); return next;
}
export async function removeHadithFromPersonalList(listId: string, hadithId: string) {
  const lists = await loadPersonalHadithLists();
  const next = lists.map((list) => list.id !== listId ? list : { ...list, hadiths: list.hadiths.filter((item) => item.id !== hadithId) });
  await savePersonalHadithLists(next); return next;
}
export async function deletePersonalHadithList(listId: string) { const next = (await loadPersonalHadithLists()).filter((list) => list.id !== listId); await savePersonalHadithLists(next); return next; }

