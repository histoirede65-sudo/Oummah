import { quranFoundationRepository } from "../../quranfoundation/QuranFoundationRepository";
import type { CatalogReciter } from "../domain/audio";
import { getReciterImage } from "./QuranFoundationReciterMapper";

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function canonicalReciterKey(value: string) {
  const normalized = normalizeName(value);
  if (normalized.includes("mishary") || normalized.includes("afasy") || normalized.includes("alafasi")) return "misharyalafasy";
  if (normalized.includes("khalifahaltunaiji") || normalized.includes("khalifaaltunaiji") || normalized.includes("tunaiji")) return "khalifahaltunaiji";
  if (normalized.includes("abdullahhamadabusharida") || normalized.includes("abdullahhammadabusharida") || normalized.includes("abusharida") || normalized.includes("abushareeda") || normalized.includes("abushuraida")) return "abdullahhamadabusharida";
  return normalized;
}

function displayReciterName(reciter: { id: number | string; name?: string }) {
  if (String(reciter.id) === "12") return "Ali Al-Hudhaify";
  return reciter.name ?? String(reciter.id);
}

function orderReciters(reciters: CatalogReciter[]) {
  return [...reciters].sort((left, right) => {
    const leftIsAliJabir = left.id === "158";
    const rightIsAliJabir = right.id === "158";
    if (leftIsAliJabir !== rightIsAliJabir) return leftIsAliJabir ? 1 : -1;
    return right.popularity - left.popularity;
  });
}

export class QuranFoundationReciterDataSource {
  async list(): Promise<CatalogReciter[]> {
    const reciters =
      await quranFoundationRepository.getReciters() as any[];

    const uniqueReciters = reciters.filter((reciter, index, list) => {
      const key = canonicalReciterKey(reciter.name ?? String(reciter.id));
      return list.findIndex((candidate) => canonicalReciterKey(candidate.name ?? String(candidate.id)) === key) === index;
    });

    return orderReciters(uniqueReciters.map((reciter, index) => ({
      id: String(reciter.id),
      name: displayReciterName(reciter),

      language: "ar",
      country: "",

      style:
        reciter.style?.name?.toLowerCase() === "mujawwad"
          ? "mujawwad"
          : "murattal",

      image: getReciterImage(reciter.id, displayReciterName(reciter)),

      photoUri: String(reciter.id),
      portraitHdUri: String(reciter.id),

      audioSource: "quranfoundation",

      availableSurahs: 114,

      popularity: 100 - index,

      biography: "",

      popularSurahIds: [1, 2, 18, 36, 55, 67],

      totalDurationSeconds: 0,
    })));
  }

  async get(id: string): Promise<CatalogReciter | null> {
    const reciters = await this.list();

    return reciters.find((r) => r.id === id) ?? null;
  }
}
