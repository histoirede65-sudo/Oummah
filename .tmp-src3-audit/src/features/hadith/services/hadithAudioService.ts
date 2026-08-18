import * as Speech from "expo-speech";
import type { Hadith } from "../domain/Hadith";

export const hadithAudioService = {
  stop: () => Speech.stop(),
  speakArabic(hadith: Hadith, rate = 0.78) { if (!hadith.arabic) return; Speech.stop(); Speech.speak(hadith.arabic, { language: "ar-SA", rate, pitch: 1 }); },
  speakFrench(hadith: Hadith, rate = 0.86) { Speech.stop(); Speech.speak(hadith.french, { language: "fr-FR", rate, pitch: 1 }); },
};

