import AsyncStorage from "@react-native-async-storage/async-storage";

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

const LANGUAGE_STORAGE_KEY = "@oummah/language/v1";

// Several recordings share a reciter's name: the suffix tells them apart.
// Ids and recordings checked against the audio files (download.quranicaudio.com/qdc/...).
const RECORDING_SUFFIX: Record<string, { fr: string; en: string }> = {
  "1": { fr: "Mujawwad", en: "Mujawwad" },
  "2": { fr: "Murattal", en: "Murattal" },
  "12": { fr: "Mu‘allim", en: "Mu‘allim" },
  "168": { fr: "répétition enfants", en: "children repeat" },
};

function displayReciterName(reciter: { id: number | string; name?: string }, language: "fr" | "en" = "fr") {
  const id = String(reciter.id);
  const base =
    id === "176" ? "Ahmed Abdelhamid Tahoun"
    : id === "12" ? "Mahmoud Khalil Al-Husary"
    : id === "168" ? "Muhammad Siddiq al-Minshawi"
    : reciter.name ?? id;
  const suffix = RECORDING_SUFFIX[id]?.[language];
  return suffix ? `${base} (${suffix})` : base;
}

function displayReciterCountry(reciter: { id: number | string }) {
  return String(reciter.id) === "176" ? "Égypte" : "";
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
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).catch(() => null);
    const language = storedLanguage === "en" ? "en" : "fr";

    // Only true duplicates are dropped (e.g. Mishary's "Streaming" copy of the same recording).
    const uniqueReciters = reciters.filter((reciter, index, list) => {
      const key = canonicalReciterKey(displayReciterName(reciter));
      return list.findIndex((candidate) => canonicalReciterKey(displayReciterName(candidate)) === key) === index;
    });

    return orderReciters(uniqueReciters.map((reciter, index) => ({
      id: String(reciter.id),
      name: displayReciterName(reciter, language),

      language: "ar",
      country: displayReciterCountry(reciter),

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
