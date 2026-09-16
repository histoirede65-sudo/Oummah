import { storageService } from "../../core/storage";

export type DhikrSectionId =
  | "morning-evening"
  | "sleep"
  | "prayer"
  | "home"
  | "protection"
  | "travel"
  | "hajj"
  | "daily";

export type DhikrItem = {
  id: string;
  order: number;
  arabic: string;
  repetitions: number;
  audioUrl?: string;
  audioSource?: number;
  source: string;
};

export type DhikrCategory = {
  id: number;
  arabicTitle: string;
  frenchTitle: string;
  section: DhikrSectionId;
  audioUrl?: string;
  items: readonly DhikrItem[];
};

type RawDhikrCategory = {
  id: number;
  category: string;
  audio?: string;
  array: Array<{
    id: number;
    text: string;
    count?: number;
    audio?: string;
  }>;
};

const CATALOG_URL =
  "https://raw.githubusercontent.com/rn0x/Adhkar-json/main/adhkar.json";
const AUDIO_BASE_URL =
  "https://raw.githubusercontent.com/rn0x/Adhkar-json/main";
const CACHE_KEY = "oummah.dhikr.catalog.v1";

const LOCAL_DHIKR_AUDIO = {
  subhanallah: require("../../assets/audio/dhikr/subhanallah.mp3"),
  subhanallahDhikr: require("../../assets/audio/dhikr/subhanallah-dhikr.mp3"),
  alhamdulillah: require("../../assets/audio/dhikr/alhamdulillah.mp3"),
  allahuAkbar: require("../../assets/audio/dhikr/allahu-akbar.mp3"),
  subhanallahiWaBihamdihi: require("../../assets/audio/dhikr/subhanallahi-wa-bihamdihi.mp3"),
} as const;

function normalizeArabicForAudio(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\u0600-\u06FF]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function resolveLocalDhikrAudio(arabic: string): number | undefined {
  const normalized = normalizeArabicForAudio(arabic);
  if (normalized === "سبحان الله") return LOCAL_DHIKR_AUDIO.subhanallah;
  if (normalized === "الحمد لله") return LOCAL_DHIKR_AUDIO.alhamdulillah;
  if (normalized === "الله اكبر") return LOCAL_DHIKR_AUDIO.allahuAkbar;
  if (normalized === "سبحان الله وبحمده") {
    return LOCAL_DHIKR_AUDIO.subhanallahiWaBihamdihi;
  }
  if (normalized.startsWith("سبحان الله والحمد لله والله اكبر")) {
    return LOCAL_DHIKR_AUDIO.subhanallahDhikr;
  }
  return undefined;
}

const FRENCH_TITLES: Record<string, string> = {
  "أذكار الصباح والمساء": "Adhkār du matin et du soir",
  "أذكار النوم": "Avant de dormir",
  "أذكار الاستيقاظ من النوم": "Au réveil",
  "دعاء دخول الخلاء": "En entrant aux toilettes",
  "دعاء الخروج من الخلاء": "En sortant des toilettes",
  "الذكر قبل الوضوء": "Avant les ablutions",
  "الذكر بعد الفراغ من الوضوء": "Après les ablutions",
  "الذكر عند الخروج من المنزل": "En sortant de chez soi",
  "الذكر عند دخول المنزل": "En entrant chez soi",
  "دعاء الذهاب إلى المسجد": "En allant à la mosquée",
  "دعاء دخول المسجد": "En entrant à la mosquée",
  "دعاء الخروج من المسجد": "En sortant de la mosquée",
  "أذكار الآذان": "Autour de l’adhān",
  "دعاء ُلبْس الثوب": "En s’habillant",
  "دعاء ُلبْس الثوب الجديد": "En portant un vêtement neuf",
  "الدعاء لمن لبس ثوبا جديدا": "Pour celui qui porte un vêtement neuf",
  "ما يقول إذا وضع ثوبه": "En retirant ses vêtements",
  "دعاء الاستفتاح": "Invocation d’ouverture de la prière",
  "دعاء الركوع": "Pendant l’inclinaison",
  "دعاء الرفع من الركوع": "En se relevant de l’inclinaison",
  "دعاء السجود": "Pendant la prosternation",
  "دعاء الجلسة بين السجدتين": "Entre les deux prosternations",
  "دعاء سجود التلاوة": "Prosternation de récitation",
  التشهد: "Le tashahhud",
  "الصلاة على النبي بعد التشهد": "Prière sur le Prophète après le tashahhud",
  "الدعاء بعد التشهد الأخير قبل السلام": "Après le dernier tashahhud",
  "أذكار بعد السلام من الصلاة": "Après la prière",
  "دعاء صلاة الاستخارة": "Prière de consultation",
  "أذكار الكرب والهم والحزن": "Dans l’angoisse et la tristesse",
  "دعاء من أصابه شك في الإيمان": "Face aux doutes dans la foi",
  "دعاء قضاء الدين": "Pour s’acquitter d’une dette",
  "دعاء الوسوسة في الصلاة والقراءة":
    "Contre les insufflations pendant la prière",
  "دعاء من استصعب عليه أمر": "Lorsqu’une chose paraît difficile",
  "ما يقول ويفعل من أذنب ذنبا": "Après avoir commis une faute",
  "دعاء طرد الشيطان ووساوسه": "Pour repousser les insufflations",
  "الدعاء عند إفطار الصائم": "À la rupture du jeûne",
  "الدعاء قبل الطعام": "Avant de manger",
  "الدعاء عند الفراغ من الطعام": "Après avoir mangé",
  "دعاء الضيف لصاحب الطعام": "Invocation de l’invité pour son hôte",
  "دعاء العطاس": "Lors de l’éternuement",
  "الدعاء للمتزوج": "Pour les nouveaux mariés",
  "دعاء السفر": "Invocation du voyage",
  "دعاء الركوب": "En montant dans un moyen de transport",
  "دعاء دخول السوق": "En entrant au marché",
  "الدعاء عند نزول المطر": "Lorsqu’il pleut",
  "الدعاء عند هبوب الريح": "Lorsque le vent souffle",
  "دعاء رؤية الهلال": "À la vue de la nouvelle lune",
  "ما يقول عند الغضب": "Lors de la colère",
  "دعاء زيارة المريض": "En visitant un malade",
  "دعاء المريض الذي يئس من حياته": "Invocation du malade éprouvé",
  "دعاء التعزية": "Pour présenter ses condoléances",
  "الدعاء للميت في الصلاة عليه": "Invocation pour le défunt",
  "دعاء زيارة القبور": "En visitant les tombes",
  "دعاء الخوف من الشرك": "Par crainte de l’association",
  "دعاء يوم عرفة": "Invocation du jour de ‘Arafah",
  "الذكر عند المشعر الحرام": "Dhikr à Al-Mash‘ar Al-Harām",
};

function resolveUrl(path?: string) {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${AUDIO_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

function frenchTitle(arabicTitle: string) {
  return FRENCH_TITLES[arabicTitle] ?? `Hisn al-Muslim · ${arabicTitle}`;
}

export function classifyDhikrCategory(title: string): DhikrSectionId {
  if (/الصباح|المساء/.test(title)) return "morning-evening";
  if (/النوم|الاستيقاظ|الفراش/.test(title)) return "sleep";
  if (
    /الصلاة|السجود|الركوع|التشهد|المسجد|الآذان|الوضوء|الاستخارة/.test(title)
  ) {
    return "prayer";
  }
  if (/المنزل|الخلاء|الثوب|الطعام|الشراب|الضيف|العطاس|المتزوج/.test(title)) {
    return "home";
  }
  if (/السفر|الركوب|السوق|المطر|الريح|القرية|البلدة/.test(title)) {
    return "travel";
  }
  if (/عرفة|الحج|العمرة|الصفا|المروة|المشعر|الحجر الأسود/.test(title)) {
    return "hajj";
  }
  if (
    /الخوف|الكرب|الهم|الحزن|الشيطان|الوسوسة|الغضب|المريض|الرقية|العين/.test(
      title,
    )
  ) {
    return "protection";
  }
  return "daily";
}

function normalizeCatalog(raw: readonly RawDhikrCategory[]): DhikrCategory[] {
  return raw
    .filter(
      (category) =>
        Number.isFinite(category.id) &&
        typeof category.category === "string" &&
        Array.isArray(category.array),
    )
    .map((category) => ({
      id: category.id,
      arabicTitle: category.category.trim(),
      frenchTitle: frenchTitle(category.category.trim()),
      section: classifyDhikrCategory(category.category),
      audioUrl: resolveUrl(category.audio),
      items: category.array
        .filter((item) => typeof item.text === "string" && item.text.trim())
        .map((item) => {
          const arabic = item.text.trim();
          return {
            id: `${category.id}:${item.id}`,
            order: item.id,
            arabic,
            repetitions: Math.max(1, Number(item.count) || 1),
            audioUrl: resolveUrl(item.audio),
            audioSource: resolveLocalDhikrAudio(arabic),
            source: "Hisn al-Muslim",
          };
        }),
    }))
    .filter((category) => category.items.length > 0);
}

const FALLBACK_CATALOG: readonly RawDhikrCategory[] = [
  {
    id: 1,
    category: "أذكار الصباح والمساء",
    array: [
      {
        id: 1,
        text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.",
        count: 1,
      },
      {
        id: 2,
        text: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.",
        count: 1,
      },
      {
        id: 3,
        text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ.",
        count: 100,
      },
    ],
  },
  {
    id: 2,
    category: "أذكار النوم",
    array: [
      {
        id: 1,
        text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا.",
        count: 1,
      },
      {
        id: 2,
        text: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَاللَّهُ أَكْبَرُ.",
        count: 33,
      },
    ],
  },
  {
    id: 8,
    category: "الذكر عند الخروج من المنزل",
    array: [
      {
        id: 1,
        text: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ.",
        count: 1,
      },
    ],
  },
  {
    id: 28,
    category: "أذكار بعد السلام من الصلاة",
    array: [
      {
        id: 1,
        text: "أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ. اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ.",
        count: 1,
      },
      {
        id: 2,
        text: "سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَاللَّهُ أَكْبَرُ.",
        count: 33,
      },
    ],
  },
];

export async function loadDhikrCatalog(): Promise<readonly DhikrCategory[]> {
  const cached = await storageService
    .get<readonly RawDhikrCategory[]>(CACHE_KEY)
    .catch(() => null);

  if (cached?.length) return normalizeCatalog(cached);

  try {
    const response = await fetch(CATALOG_URL);
    if (!response.ok) throw new Error(`Dhikr catalog ${response.status}`);
    const raw = (await response.json()) as readonly RawDhikrCategory[];
    const normalized = normalizeCatalog(raw);
    if (normalized.length < 100) throw new Error("Incomplete dhikr catalog");
    void storageService.set(CACHE_KEY, raw).catch(() => undefined);
    return normalized;
  } catch {
    return normalizeCatalog(FALLBACK_CATALOG);
  }
}

export const DHIKR_SECTIONS: ReadonlyArray<{
  id: DhikrSectionId;
  label: string;
  subtitle: string;
  icon: string;
}> = [
  {
    id: "morning-evening",
    label: "Matin & soir",
    subtitle: "Protection quotidienne",
    icon: "sunny-outline",
  },
  {
    id: "sleep",
    label: "Sommeil",
    subtitle: "Dormir et se réveiller",
    icon: "moon-outline",
  },
  {
    id: "prayer",
    label: "Prière",
    subtitle: "Autour de la salāt",
    icon: "business-outline",
  },
  {
    id: "protection",
    label: "Protection",
    subtitle: "Crainte et épreuves",
    icon: "shield-checkmark-outline",
  },
  {
    id: "home",
    label: "Vie quotidienne",
    subtitle: "Maison et repas",
    icon: "home-outline",
  },
  {
    id: "travel",
    label: "Déplacements",
    subtitle: "Voyage et extérieur",
    icon: "navigate-outline",
  },
  {
    id: "hajj",
    label: "Hajj & ‘Umrah",
    subtitle: "Rites et lieux saints",
    icon: "location-outline",
  },
  {
    id: "daily",
    label: "Toutes occasions",
    subtitle: "Le reste de Hisn al-Muslim",
    icon: "sparkles-outline",
  },
];
