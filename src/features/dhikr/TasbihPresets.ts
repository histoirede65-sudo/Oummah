export type TasbihStep = {
  id: string;
  arabic: string;
  phonetic: string;
  french: string;
  english: string;
  target: number;
  audioSource?: number | { uri: string };
};

export type TasbihPreset = {
  id: string;
  title: string;
  englishTitle: string;
  subtitle: string;
  englishSubtitle: string;
  icon: string;
  source: string;
  sourceUrl: string;
  steps: readonly TasbihStep[];
};

const AUDIO_BASE =
  "https://raw.githubusercontent.com/rn0x/Adhkar-json/main/audio";
const SUBHANALLAH_AUDIO = require("../../assets/audio/dhikr/subhanallah-dhikr.mp3");
const ALHAMDULILLAH_AUDIO = require("../../assets/audio/dhikr/alhamdulillah.mp3");
const ALLAHU_AKBAR_AUDIO = require("../../assets/audio/dhikr/allahu-akbar.mp3");
const SUBHANALLAH_BIHAMDIHI_AUDIO = require("../../assets/audio/dhikr/subhanallahi-wa-bihamdihi.mp3");

function remoteAudio(filename: string) {
  return { uri: `${AUDIO_BASE}/${filename}` };
}

export const TASBIH_PRESETS: readonly TasbihPreset[] = [
  {
    id: "after-prayer",
    title: "Après la prière",
    englishTitle: "After prayer",
    subtitle: "33 · 33 · 33 puis compléter 100",
    englishSubtitle: "33 · 33 · 33, then complete 100",
    icon: "moon-outline",
    source: "Sahih Muslim 597",
    sourceUrl: "https://sunnah.com/muslim:597a",
    steps: [
      {
        id: "subhanallah-33-prayer",
        arabic: "سُبْحَانَ اللَّهِ",
        phonetic: "Subhāna-Llāh",
        french: "Gloire et pureté à Allah",
        english: "Glory be to Allah",
        target: 33,
        audioSource: SUBHANALLAH_AUDIO,
      },
      {
        id: "alhamdulillah-33-prayer",
        arabic: "الْحَمْدُ لِلَّهِ",
        phonetic: "Al-hamdu li-Llāh",
        french: "Louange à Allah",
        english: "All praise is due to Allah",
        target: 33,
        audioSource: ALHAMDULILLAH_AUDIO,
      },
      {
        id: "allahu-akbar-33-prayer",
        arabic: "اللَّهُ أَكْبَرُ",
        phonetic: "Allāhu akbar",
        french: "Allah est le Plus Grand",
        english: "Allah is the Greatest",
        target: 33,
        audioSource: ALLAHU_AKBAR_AUDIO,
      },
      {
        id: "tahlil-completion",
        arabic:
          "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        phonetic:
          "Lā ilāha illa-Llāhu wahdahu lā sharīka lah, lahu-l-mulku wa lahu-l-hamd, wa huwa ‘alā kulli shay’in qadīr",
        french:
          "Nul ne mérite d’être adoré sauf Allah, Seul sans associé. À Lui la royauté et la louange, et Il est capable de toute chose.",
        english:
          "None has the right to be worshipped except Allah alone, without partner. His is the dominion and all praise, and He is capable of all things.",
        target: 1,
        audioSource: remoteAudio("93.mp3"),
      },
    ],
  },
  {
    id: "before-sleep",
    title: "Avant de dormir",
    englishTitle: "Before sleep",
    subtitle: "Tasbih de Fātimah · 33 · 33 · 34",
    englishSubtitle: "Tasbih of Fatimah · 33 · 33 · 34",
    icon: "bed-outline",
    source: "Sahih al-Bukhari 5362",
    sourceUrl: "https://sunnah.com/bukhari:5362",
    steps: [
      {
        id: "subhanallah-33-sleep",
        arabic: "سُبْحَانَ اللَّهِ",
        phonetic: "Subhāna-Llāh",
        french: "Gloire et pureté à Allah",
        english: "Glory be to Allah",
        target: 33,
        audioSource: SUBHANALLAH_AUDIO,
      },
      {
        id: "alhamdulillah-33-sleep",
        arabic: "الْحَمْدُ لِلَّهِ",
        phonetic: "Al-hamdu li-Llāh",
        french: "Louange à Allah",
        english: "All praise is due to Allah",
        target: 33,
        audioSource: ALHAMDULILLAH_AUDIO,
      },
      {
        id: "allahu-akbar-34-sleep",
        arabic: "اللَّهُ أَكْبَرُ",
        phonetic: "Allāhu akbar",
        french: "Allah est le Plus Grand",
        english: "Allah is the Greatest",
        target: 34,
        audioSource: ALLAHU_AKBAR_AUDIO,
      },
    ],
  },
  {
    id: "subhanallah-bihamdihi",
    title: "100 glorifications",
    englishTitle: "100 glorifications",
    subtitle: "Un dhikr léger sur la langue",
    englishSubtitle: "A dhikr that is light on the tongue",
    icon: "sparkles-outline",
    source: "Sahih al-Bukhari 6405",
    sourceUrl: "https://sunnah.com/bukhari:6405",
    steps: [
      {
        id: "subhanallah-bihamdihi-100",
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        phonetic: "Subhāna-Llāhi wa bi-hamdih",
        french: "Gloire et louange à Allah",
        english: "Glory and praise be to Allah",
        target: 100,
        audioSource: SUBHANALLAH_BIHAMDIHI_AUDIO,
      },
    ],
  },
  {
    id: "tahlil-100",
    title: "Tahlīl du jour",
    englishTitle: "Daily Tahlil",
    subtitle: "100 fois dans la journée",
    englishSubtitle: "100 times during the day",
    icon: "sunny-outline",
    source: "Sahih al-Bukhari 3293",
    sourceUrl: "https://sunnah.com/bukhari:3293",
    steps: [
      {
        id: "tahlil-100-step",
        arabic:
          "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        phonetic:
          "Lā ilāha illa-Llāhu wahdahu lā sharīka lah, lahu-l-mulku wa lahu-l-hamd, wa huwa ‘alā kulli shay’in qadīr",
        french:
          "Nul ne mérite d’être adoré sauf Allah, Seul sans associé. À Lui la royauté et la louange, et Il est capable de toute chose.",
        english:
          "None has the right to be worshipped except Allah alone, without partner. His is the dominion and all praise, and He is capable of all things.",
        target: 100,
        audioSource: remoteAudio("93.mp3"),
      },
    ],
  },
  {
    id: "istighfar",
    title: "Istighfār",
    englishTitle: "Istighfar",
    subtitle: "Demander pardon · 100 fois",
    englishSubtitle: "Seek forgiveness · 100 times",
    icon: "water-outline",
    source: "Sahih Muslim 2702",
    sourceUrl: "https://sunnah.com/muslim:2702b",
    steps: [
      {
        id: "istighfar-100-step",
        arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
        phonetic: "Astaghfiru-Llāha wa atūbu ilayh",
        french: "Je demande pardon à Allah et je me repens à Lui",
        english: "I seek Allah’s forgiveness and repent to Him",
        target: 100,
        audioSource: remoteAudio("96.mp3"),
      },
    ],
  },
  {
    id: "free-remembrance",
    title: "Dhikr libre",
    englishTitle: "Free dhikr",
    subtitle: "Compteur personnel · objectif 33",
    englishSubtitle: "Personal counter · target 33",
    icon: "infinite-outline",
    source: "Compteur libre",
    sourceUrl: "",
    steps: [
      {
        id: "hawqala-free",
        arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        phonetic: "Lā hawla wa lā quwwata illā bi-Llāh",
        french: "Il n’y a de force ni de puissance qu’en Allah",
        english: "There is no power nor might except through Allah",
        target: 33,
        audioSource: remoteAudio("260.mp3"),
      },
    ],
  },
];

export function findTasbihPreset(id?: string) {
  return TASBIH_PRESETS.find((preset) => preset.id === id) ?? TASBIH_PRESETS[0];
}
