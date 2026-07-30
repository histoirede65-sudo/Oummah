import { storageService } from "../../core/storage";
import { findOfficialFrenchDua } from "./OfficialFrenchDuaCatalog";

export type DuaSectionId =
  | "morning-evening"
  | "sleep"
  | "prayer"
  | "home"
  | "family"
  | "food"
  | "protection"
  | "health"
  | "travel"
  | "work"
  | "nature"
  | "etiquette"
  | "hajj"
  | "daily";

export type DuaItem = {
  id: string;
  order: number;
  arabic: string;
  phonetic: string;
  french: string;
  repetitions: number;
  audioUrl?: string;
  audioSource?: number;
  audioStartRatio?: number;
  audioEndRatio?: number;
  audioStartOffsetSeconds?: number;
  audioEndOffsetSeconds?: number;
  frenchIsSummary?: boolean;
  source: string;
  sourceUrl?: string;
};

export type DuaCategory = {
  id: number;
  arabicTitle: string;
  frenchTitle: string;
  section: DuaSectionId;
  audioUrl?: string;
  items: readonly DuaItem[];
};

type RawDuaCategory = {
  id: number;
  category: string;
  audio?: string;
  array: Array<{
    id: number;
    text: string;
    count?: number;
    audio?: string;
    filename?: string;
  }>;
};

type RawFrenchDua = {
  id: string;
  category?: readonly string[];
  arabic: string;
  transliteration?: string;
  translation?: { fr?: string };
  repeat?: number;
  reference?: string;
  verify_url?: string;
};

const CATALOG_URL =
  "https://raw.githubusercontent.com/rn0x/Adhkar-json/main/adhkar.json";
const FRENCH_CATALOG_URL =
  "https://raw.githubusercontent.com/Open-Waqf/wird/2a7959ea846091a16268c320f14c2d8651c29858/www/data.json";
const AUDIO_BASE_URL =
  "https://raw.githubusercontent.com/rn0x/Adhkar-json/main";
const RAW_CACHE_KEY = "oummah.dua.catalog.raw.v2";
const FRENCH_CACHE_KEY = "oummah.dua.catalog.fr.v2";
const STUDY_20_114_AUDIO = require("../../assets/audio/dua/study-20-114.mp3");
const STUDY_20_25_28_AUDIO = require("../../assets/audio/dua/study-20-25-28.mp3");
const FAMILY_25_74_AUDIO = require("../../assets/audio/dua/family-25-74.mp3");
const NEWLYWEDS_AUDIO = require("../../assets/audio/dua/newlyweds.mp3");
const HEALING_SEVEN_AUDIO = require("../../assets/audio/dua/healing-seven.mp3");

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
  "الأذكار بعد السلام من الصلاة": "Après la prière",
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
  "الدعاء يوم عرفة": "Invocation du jour de ‘Arafah",
  "الذكر عند المشعر الحرام": "Dua à Al-Mash‘ar Al-Harām",
  "الدعاء إذا تقلب ليلا": "Lorsqu’on se retourne pendant la nuit",
  "دعاء الفزع في النوم و من بُلِيَ بالوحشة":
    "En cas d’effroi nocturne ou de solitude",
  "ما يفعل من رأى الرؤيا أو الحلم": "Après un rêve ou un songe",
  "دعاء قنوت الوتر": "Invocation du qunūt dans le Witr",
  "الذكر عقب السلام من الوتر": "Après la prière du Witr",
  "دعاء الهم والحزن": "Contre l’inquiétude et la tristesse",
  "دعاء الكرب": "Dans une grande détresse",
  "دعاء لقاء العدو و ذي السلطان": "Face à un ennemi ou une autorité",
  "دعاء من خاف ظلم السلطان": "Face à l’injustice d’un dirigeant",
  "الدعاء على العدو": "Face à l’hostilité d’un ennemi",
  "ما يقول من خاف قوما": "Lorsqu’on craint certaines personnes",
  "دعاء من أصابه وسوسة في الإيمان": "Contre les doutes dans la foi",
  "دعاء الوسوسة في الصلاة و القراءة":
    "Contre les distractions pendant la prière",
  "دعاء طرد الشيطان و وساوسه": "Pour repousser Satan et ses suggestions",
  "الدعاء حينما يقع ما لا يرضاه أو ُ غلب على أمره":
    "Lorsqu’un événement pénible survient",
  "ﺗﻬنئة المولود له وجوابه": "Pour féliciter la naissance d’un enfant",
  "ما يعوذ به الأولاد": "Pour protéger ses enfants",
  "الدعاء للمريض في عيادته": "En visitant une personne malade",
  "فضل عيادة المريض": "Mérite de la visite au malade",
  "تلقين المحتضر": "Auprès d’une personne mourante",
  "دعاء من أصيب بمصيبة": "Lorsqu’on est touché par une épreuve",
  "الدعاء عند إغماض الميت": "Au moment de fermer les yeux du défunt",
  "الدعاء للفرط في الصلاة عليه": "Prière funéraire pour un enfant",
  "الدعاء عند إدخال الميت القبر": "Lors de la mise en terre du défunt",
  "الدعاء بعد دفن الميت": "Après l’enterrement",
  "دعاء الريح": "Lorsque le vent souffle",
  "دعاء الرعد": "Lorsqu’on entend le tonnerre",
  "من أدعية الاستسقاء": "Pour demander la pluie",
  "الدعاء إذا نزل المطر": "Lorsque la pluie tombe",
  "الذكر بعد نزول المطر": "Après la pluie",
  "من أدعية الاستصحاء": "Lorsque la pluie devient excessive",
  "التعريض بالدعاء لطلب الطعام أو الشراب":
    "Pour demander avec délicatesse à manger ou à boire",
  "الدعاء إذا أفطر عند أهل بيت": "Après avoir rompu le jeûne chez quelqu’un",
  "دعاء الصائم إذا حضر الطعام ولم يفطر": "Pour le jeûneur présent à un repas",
  "ما يقول الصائم إذا سابه أحد": "Lorsque le jeûneur est insulté",
  "الدعاء عند رؤية باكورة الثمر": "À la vue des premiers fruits",
  "ما يقال للكافر إذا عطس فحمد الله":
    "Répondre à une personne non musulmane qui éternue",
  "دعاء المتزوج و شراء الدابة": "Au mariage ou lors d’une nouvelle acquisition",
  "الدعاء قبل إتيان الزوجة": "Avant l’intimité conjugale",
  "دعاء الغضب": "Lors de la colère",
  "دعاء من رأى مبتلى": "À la vue d’une personne éprouvée",
  "ما يقال في اﻟﻤﺠلس": "Pendant une assemblée",
  "كفارة اﻟﻤﺠلس": "À la fin d’une assemblée",
  "الدعاء لمن قال غفر الله لك": "Répondre à celui qui demande votre pardon",
  "الدعاء لمن صنع إليك معروفا": "Remercier celui qui vous a rendu service",
  "ما يعصم الله به من الدجال": "Protection contre l’Antéchrist",
  "الدعاء لمن قال إني أحبك في الله":
    "Répondre à celui qui dit vous aimer en Allah",
  "الدعاء لمن عرض عليك ماله": "Pour celui qui propose son aide financière",
  "الدعاء لمن أقرض عند القضاء": "Lors du remboursement d’un prêt",
  "الدعاء لمن قال بارك الله فيك": "Répondre à « Qu’Allah te bénisse »",
  "دعاء كراهية الطيرة": "Contre les mauvais présages",
  "دعاء دخول القرية أو البلدة": "En entrant dans une ville ou un village",
  "الدعاء إذا تعس المركوب": "Lorsque le moyen de transport trébuche",
  "دعاء المسافر للمقيم": "Paroles du voyageur à celui qui reste",
  "دعاء المقيم للمسافر": "Paroles à celui qui part en voyage",
  "التكبير و التسبيح في سير السفر": "Dhikr pendant le trajet",
  "دعاء المسافر إذا أسحر": "Invocation du voyageur à l’aube",
  "الدعاء إذا نزل مترلا في سفر أو غيره": "Lorsqu’on s’arrête dans un lieu",
  "ذكر الرجوع من السفر": "Au retour d’un voyage",
  "ما يقول من أتاه أمر يسره أو يكرهه":
    "Lorsqu’une bonne ou une mauvaise nouvelle arrive",
  "فضل الصلاة على النبي صلى الله عليه و سلم":
    "Prière et bénédictions sur le Prophète",
  "إفشاء السلام": "Répandre la salutation de paix",
  "كيف يرد السلام على الكافر إذا سلم":
    "Répondre à la salutation d’une personne non musulmane",
  "الدُّعاءُ عِنْدَ سَمَاعِ صِياحِ الدِّيكِ ونَهِيقِ الْحِمَارِ":
    "En entendant le coq ou l’âne",
  "دعاء نباح الكلاب بالليل": "En entendant les chiens aboyer la nuit",
  "الدعاء لمن سببته": "Pour une personne que l’on a offensée",
  "ما يقول المسلم إذا مدح المسلم": "Lorsqu’on fait l’éloge d’une personne",
  "ما يقول المسلم إذا زكي": "Lorsqu’on reçoit un compliment",
  "كيف يلبي المحرم في الحج أو العمرة ؟": "Talbiyah du Hajj et de la ‘Umrah",
  "التكبير إذا أتى الركن الأسود": "Au niveau de la Pierre noire",
  "الدعاء بين الركن اليماني والحجر الأسود":
    "Entre le coin yéménite et la Pierre noire",
  "دعاء الوقوف على الصفا والمروة": "Sur As-Safā et Al-Marwah",
  "التكبير عند رمي الجمار مع كل حصاة": "Lors de la lapidation des stèles",
  "دعاء التعجب والأمر السار": "Lors d’un étonnement ou d’un événement heureux",
  "ما يفعل من أتاه أمر يسره": "Lorsqu’une heureuse nouvelle arrive",
  "ما يقول من أحس وجعا في جسده": "Lorsqu’on ressent une douleur dans le corps",
  "دعاء من خشي أن يصيب شيئا بعينه": "Par crainte de causer le mauvais œil",
  "ما يقال عند الفزع": "Lors d’une peur soudaine",
  "ما يقول عند الذبح أو النحر": "Au moment du sacrifice",
  "ما يقول لرد كيد مردة الشياطين": "Pour repousser les démons rebelles",
  "الاستغفار و التوبة": "Demander pardon et se repentir",
  "فضل التسبيح و التحميد، و التهليل، و التكبير":
    "Mérite du tasbih, de la louange et du takbīr",
  "كيف كان النبي يسبح؟": "Comment le Prophète comptait son dhikr",
  "من أنواع الخير والآداب الجامعة": "Bonnes actions et règles de savoir-vivre",
};

function resolveUrl(path?: string) {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${AUDIO_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

function frenchTitle(arabicTitle: string) {
  return FRENCH_TITLES[arabicTitle] ?? `Hisn al-Muslim · ${arabicTitle}`;
}

const ARABIC_TO_LATIN: Record<string, string> = {
  ء: "’",
  أ: "a",
  إ: "i",
  آ: "ā",
  ا: "ā",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "‘",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  ة: "ah",
  و: "w",
  ؤ: "’",
  ي: "y",
  ئ: "’",
  ى: "ā",
  "َ": "a",
  "ُ": "u",
  "ِ": "i",
  "ً": "an",
  "ٌ": "un",
  "ٍ": "in",
  "ْ": "",
  "ّ": "",
  ـ: "",
};

function phoneticFromArabic(value: string) {
  return value
    .replace(/[﴿﴾()[\]{}«»]/g, " ")
    .split("")
    .map((character) => ARABIC_TO_LATIN[character] ?? character)
    .join("")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

type FocusedDua = {
  arabic: string;
  audioStartRatio: number;
  audioEndRatio: number;
  hasNarration: boolean;
  learnable: boolean;
};

function stripArabicMarks(value: string) {
  return value
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[ـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactArabic(value: string) {
  return stripArabicMarks(value).replace(/[^\u0600-\u06ff]/g, "");
}

function speechWeight(value: string) {
  const clean = stripArabicMarks(value);
  let weight = 0;
  for (const character of clean) {
    if (/[\u0600-\u06ff]/.test(character)) weight += 1;
    else if (/[,،.;؛:!?؟]/.test(character)) weight += 2.3;
    else if (/\s/.test(character)) weight += 0.18;
  }
  return Math.max(1, weight);
}

function looksLikeLearningFormula(value: string) {
  const plain = stripArabicMarks(value)
    .replace(/^[\s()[\]{}﴿﴾«».,،:؛]+/, "")
    .trim();
  if (!plain) return false;
  if (/[﴿﴾]/.test(value)) return true;
  return /^(?:الله|اللهم|رب|ربنا|أعوذ|اعوذ|بسم|الحمد|سبحان|لا إله|لا اله|حسبي|رضيت|يا حي|أصبحنا|امسينا|أمسينا|آمنا|استغفر|أستغفر|أسأل|اسأل|بارك|جزاك|غفر|يرحمك|يهديكم|السلام|لبيك|ذهب الظمأ|اللَّه أكبر|الله أكبر|إنا لله|حسبنا|توكلت|اللَّهُمَّ|اللَّهُ)/.test(
    plain,
  );
}

function cleanFocusedText(value: string) {
  return value
    .replace(/^\s*\(\(/, "")
    .replace(/\)\)\s*$/, "")
    .replace(/\s*\[(?:.|\n)*?\]\s*$/g, "")
    .replace(/\s*\((?:ثلاث|أربع|سبع|عشر|مرة|مرات|مَرَّات)[^)]+\)\s*\.?$/i, "")
    .replace(/^[\s()[\]{}،,.:؛]+|[\s()[\]{}]+$/g, "")
    .trim();
}

function extractFocusedDua(value: string): FocusedDua {
  const raw = value.trim();
  let start = 0;
  let end = raw.length;
  let candidate = raw;
  let selected = false;

  const wrappedMatches = [...raw.matchAll(/\(\(([\s\S]*?)\)\)/g)];
  if (wrappedMatches.length) {
    const best = wrappedMatches.reduce((current, next) =>
      compactArabic(next[1]).length > compactArabic(current[1]).length
        ? next
        : current,
    );
    start = (best.index ?? 0) + 2;
    end = start + best[1].length;
    candidate = best[1];
    selected = true;
  }

  if (!selected) {
    const firstVerse = raw.indexOf("﴿");
    const lastVerse = raw.lastIndexOf("﴾");
    if (firstVerse >= 0 && lastVerse > firstVerse) {
      const nearbyPrefixStart = Math.max(0, raw.lastIndexOf(".", firstVerse - 1) + 1);
      const nearbyPrefix = raw.slice(nearbyPrefixStart, firstVerse);
      const includePrefix = /أعوذ|بسم|ربنا|اللهم/.test(stripArabicMarks(nearbyPrefix));
      start = includePrefix ? nearbyPrefixStart : firstVerse;
      end = lastVerse + 1;
      candidate = raw.slice(start, end);
      selected = true;
    }
  }

  if (!selected) {
    const instruction = /قال|يقول|فليقل|فقل|يقرأ|فيقول|الدعاء|الكلمات|الذكر/;
    const colon = raw.search(/[:：]/);
    if (
      colon >= 0 &&
      colon < raw.length * 0.72 &&
      instruction.test(stripArabicMarks(raw.slice(0, colon)))
    ) {
      const after = raw.slice(colon + 1).trim();
      if (looksLikeLearningFormula(after)) {
        start = colon + 1 + raw.slice(colon + 1).indexOf(after);
        end = raw.length;
        candidate = after;
        selected = true;
      }
    }
  }

  if (!selected) {
    const annotationStart = raw.indexOf("[");
    if (annotationStart > 0) end = annotationStart;
    candidate = raw.slice(0, end);
  }

  const arabic = cleanFocusedText(candidate) || raw;
  const totalWeight = speechWeight(raw);
  const startWeight = speechWeight(raw.slice(0, start));
  const endWeight = speechWeight(raw.slice(0, end));
  const rawStartRatio = start <= 0 ? 0 : startWeight / totalWeight;
  const rawEndRatio = end >= raw.length ? 1 : endWeight / totalWeight;
  const audioStartRatio = Math.min(0.86, Math.max(0, rawStartRatio * 1.045));
  const audioEndRatio = Math.max(
    audioStartRatio + 0.08,
    Math.min(1, rawEndRatio * 0.992),
  );
  const learnable = looksLikeLearningFormula(arabic);

  return {
    arabic,
    audioStartRatio,
    audioEndRatio,
    hasNarration: audioStartRatio > 0.015 || audioEndRatio < 0.985,
    learnable,
  };
}

type FrenchMeaning = { text: string; isSummary: boolean };

type TranslationRule = {
  includes: readonly string[];
  text: string;
};

const TRANSLATION_RULES: readonly TranslationRule[] = [
  {
    includes: ["اللهلاالهالاهوالحيالقيوم", "وسعكرسيهالسماواتوالارض"],
    text: "Allah, nul ne mérite d’être adoré en dehors de Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. À Lui appartient tout ce qui est dans les cieux et sur la terre. Nul n’intercède auprès de Lui sans Sa permission. Il connaît leur présent et leur avenir, tandis qu’ils n’embrassent de Sa science que ce qu’Il veut. Son Kursî s’étend sur les cieux et la terre, dont la garde ne Lui coûte aucune peine. Il est le Très-Haut, l’Immense.",
  },
  {
    includes: ["قلهواللهاحد", "قلأعوذبربالفلق", "قلأعوذبربالناس"],
    text: "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. Dis : Il est Allah, Unique, Allah, Celui dont tous dépendent. Il n’a pas engendré et n’a pas été engendré, et nul ne Lui est égal. Dis : je cherche protection auprès du Seigneur de l’aube naissante contre le mal de ce qu’Il a créé, contre le mal de l’obscurité lorsqu’elle s’étend, contre le mal de celles qui soufflent sur les nœuds et contre le mal de l’envieux lorsqu’il envie. Dis : je cherche protection auprès du Seigneur des hommes, Souverain des hommes, Dieu des hommes, contre le mal du mauvais conseiller furtif qui souffle dans les poitrines des hommes, qu’il soit parmi les djinns ou les hommes.",
  },
  {
    includes: ["اصبحناواصبحالملكلله", "رباسالكخيرمافيهذااليوم"],
    text: "Nous voici au matin et la royauté appartient à Allah. Louange à Allah. Nul ne mérite d’être adoré sauf Allah, Seul, sans associé. À Lui la royauté et la louange, et Il est capable de toute chose. Seigneur, je Te demande le bien de ce jour et de ce qui le suit, et je cherche refuge auprès de Toi contre le mal de ce jour et de ce qui le suit. Seigneur, je cherche refuge auprès de Toi contre la paresse, les maux de la vieillesse, le châtiment du Feu et le châtiment de la tombe.",
  },
  {
    includes: ["اللهمبكاصبحنا", "وبكنحياوبكنموت"],
    text: "Ô Allah, c’est par Toi que nous atteignons le matin et le soir, par Toi que nous vivons et mourons, et c’est vers Toi que se fera la résurrection.",
  },
  {
    includes: ["اللهمانتربيلاإلهإلاأنت", "ابوءلكبنعمتمعلي"],
    text: "Ô Allah, Tu es mon Seigneur. Nul ne mérite d’être adoré sauf Toi. Tu m’as créé et je suis Ton serviteur. Je demeure fidèle à Ton engagement et à Ta promesse autant que je le peux. Je cherche refuge auprès de Toi contre le mal que j’ai commis. Je reconnais Tes bienfaits envers moi et je reconnais mes péchés. Pardonne-moi, car nul autre que Toi ne pardonne les péchés.",
  },
  {
    includes: ["اللهمانيصبحتاشهدك", "وانمحمداعبدكورسولك"],
    text: "Ô Allah, en ce matin je Te prends à témoin, ainsi que les porteurs de Ton Trône, Tes anges et toute Ta création, que Tu es Allah, nul ne mérite d’être adoré sauf Toi, Seul et sans associé, et que Muhammad est Ton serviteur et Ton Messager.",
  },
  {
    includes: ["اللهممااصبحبيمننعمة", "فلكالحمدولكالشكر"],
    text: "Ô Allah, tout bienfait qui m’est accordé ce matin, ou qui est accordé à l’une de Tes créatures, vient de Toi Seul, sans associé. À Toi la louange et à Toi la gratitude.",
  },
  {
    includes: ["اللهمعافنيفيبدني", "اعوذبكمنالكفروالفقر"],
    text: "Ô Allah, préserve mon corps, mon ouïe et ma vue. Nul ne mérite d’être adoré sauf Toi. Ô Allah, je cherche refuge auprès de Toi contre la mécréance, la pauvreté et le châtiment de la tombe.",
  },
  {
    includes: ["حسبياللهلاإلهإلاهو", "ربالعرشالعظيم"],
    text: "Allah me suffit. Nul ne mérite d’être adoré sauf Lui. Je place ma confiance en Lui, et Il est le Seigneur du Trône immense.",
  },
  {
    includes: ["اللهمانياسالكالعفوالعافية", "انياغتالمنتحتي"],
    text: "Ô Allah, je Te demande le pardon et la préservation ici-bas et dans l’au-delà. Je Te demande la préservation dans ma religion, ma vie, ma famille et mes biens. Ô Allah, couvre mes défauts, apaise mes craintes et protège-moi devant moi, derrière moi, à ma droite, à ma gauche et au-dessus de moi. Je cherche refuge auprès de Ta grandeur contre le fait d’être englouti par-dessous.",
  },
  {
    includes: ["اللهمعالمالغيبوالشهادة", "منشرنفسيومنشرالشيطان"],
    text: "Ô Allah, Connaisseur de l’invisible et du visible, Créateur des cieux et de la terre, Seigneur et Souverain de toute chose, j’atteste que nul ne mérite d’être adoré sauf Toi. Je cherche refuge auprès de Toi contre le mal de mon âme, contre le mal de Satan et son association, et contre le fait de commettre un mal envers moi-même ou de le faire subir à un musulman.",
  },
  {
    includes: ["بسماللهالذيلاضرمعاسمهشيء"],
    text: "Au nom d’Allah : rien ne peut nuire avec Son nom, sur terre ni au ciel. Il est Celui qui entend tout et sait tout.",
  },
  {
    includes: ["رضيتباللهربا", "وبمحمدنبيا"],
    text: "J’agrée Allah comme Seigneur, l’islam comme religion et Muhammad comme Prophète.",
  },
  {
    includes: ["ياحيياقيوم", "ولاتكلنيالىنفسيطرفةعين"],
    text: "Ô Vivant, ô Celui qui subsiste par Lui-même, c’est par Ta miséricorde que j’implore secours. Améliore toute ma situation et ne me laisse pas livré à moi-même, ne serait-ce que le temps d’un clin d’œil.",
  },
  {
    includes: ["اصبحناعلىفطرةالاسلام", "ملةابينابراهيم"],
    text: "Nous voici au matin sur la nature originelle de l’islam, la parole de sincérité, la religion de notre Prophète Muhammad et la voie de notre père Ibrahim, monothéiste soumis à Allah et non parmi les associateurs.",
  },
  { includes: ["سبحاناللهوبحمده"], text: "Gloire et louange à Allah." },
  {
    includes: ["لاإلهإلااللهوحدهلاشريكله", "لهالملكولهالحمد"],
    text: "Nul ne mérite d’être adoré sauf Allah, Seul, sans associé. À Lui la royauté et la louange, et Il est capable de toute chose.",
  },
  {
    includes: ["استغفراللهواتوباليه"],
    text: "Je demande pardon à Allah et je me repens à Lui.",
  },
  {
    includes: ["باسمكاللهماموتواحيا"],
    text: "C’est en Ton nom, ô Allah, que je meurs et que je vis.",
  },
  {
    includes: ["الحمدللهالذياحيانابعدمااماتنا"],
    text: "Louange à Allah qui nous a rendu la vie après nous avoir fait mourir, et c’est vers Lui que se fera la résurrection.",
  },
  {
    includes: ["اللهمانياسالكخيرهاوخيرماجبلتعليه"],
    text: "Ô Allah, je Te demande son bien et le bien de la nature que Tu lui as donnée, et je cherche refuge auprès de Toi contre son mal et le mal de la nature que Tu lui as donnée.",
  },
  {
    includes: ["اللهمانياسالكخيرالمولج", "بسماللهولجنا"],
    text: "Ô Allah, je Te demande la meilleure entrée et la meilleure sortie. Au nom d’Allah nous entrons, au nom d’Allah nous sortons, et en Allah notre Seigneur nous plaçons notre confiance.",
  },
  {
    includes: ["بسماللهتوكلتعلىالله", "لاحولولاقوةالابالله"],
    text: "Au nom d’Allah, je place ma confiance en Allah. Il n’y a de force ni de puissance qu’en Allah.",
  },
  {
    includes: ["اللهماغفرليذنوبيوافتحليابوابرحتك"],
    text: "Ô Allah, pardonne-moi mes péchés et ouvre-moi les portes de Ta miséricorde.",
  },
  {
    includes: ["اللهمانياسالكمنفضلك"],
    text: "Ô Allah, je Te demande de Ta grâce.",
  },
  {
    includes: ["اشهدانلاالهالااللهوحدهلاشريكله", "واجعلنيمنالمتطهرين"],
    text: "J’atteste que nul ne mérite d’être adoré sauf Allah, Seul et sans associé, et j’atteste que Muhammad est Son serviteur et Son Messager. Ô Allah, fais de moi quelqu’un qui se repent souvent et qui se purifie.",
  },
  {
    includes: ["سبحانكاللههموبحمدكوتباركاسمك"],
    text: "Gloire et louange à Toi, ô Allah. Béni soit Ton nom, élevée soit Ta grandeur, et nul ne mérite d’être adoré en dehors de Toi.",
  },
  {
    includes: ["سبحانربيالعظيم"],
    text: "Gloire à mon Seigneur, l’Immense.",
  },
  {
    includes: ["سمعاللهلمنحمده", "ربناولكالحمد"],
    text: "Allah entend celui qui Le loue. Seigneur, à Toi la louange, une louange abondante, pure et bénie.",
  },
  {
    includes: ["سبحانربيالاعلى"],
    text: "Gloire à mon Seigneur, le Très-Haut.",
  },
  {
    includes: ["رباغفرليوارحمنيواهدني"],
    text: "Seigneur, pardonne-moi, fais-moi miséricorde, guide-moi, accorde-moi la sécurité et pourvois à mes besoins.",
  },
  {
    includes: ["استغفرالله", "اللهمانتالسلامومنكالسلام"],
    text: "Je demande pardon à Allah. Ô Allah, Tu es la Paix et de Toi vient la paix. Béni sois-Tu, ô Détenteur de la majesté et de la générosité.",
  },
  {
    includes: ["اللهمانيأستخيركبعلمك", "واستقدركبقدرتك"],
    text: "Ô Allah, je Te demande de me guider par Ta science, je sollicite Ton pouvoir par Ta puissance et je Te demande de Ton immense grâce. Tu peux et je ne peux pas, Tu sais et je ne sais pas, et Tu connais parfaitement l’invisible. Ô Allah, si Tu sais que cette affaire est un bien pour ma religion, ma vie et l’issue de mes affaires, décrète-la pour moi, facilite-la-moi et bénis-la pour moi. Et si Tu sais qu’elle est un mal pour moi, éloigne-la de moi et éloigne-moi d’elle, puis décrète pour moi le bien où qu’il soit et rends-moi satisfait de celui-ci.",
  },
  {
    includes: ["لاإلهإلااللهالعظيمالحليم", "ربالعرشالعظيم"],
    text: "Nul ne mérite d’être adoré sauf Allah, l’Immense, le Clément. Nul ne mérite d’être adoré sauf Allah, Seigneur du Trône immense, Seigneur des cieux, Seigneur de la terre et Seigneur du noble Trône.",
  },
  {
    includes: ["اللهمانياعوذبكمنالهموالحزن", "غلبةالدينوقهرالرجال"],
    text: "Ô Allah, je cherche refuge auprès de Toi contre l’inquiétude et la tristesse, l’impuissance et la paresse, l’avarice et la lâcheté, le poids des dettes et la domination des hommes.",
  },
  {
    includes: ["اللهملاسهلإلاماجعلتهسهلا"],
    text: "Ô Allah, rien n’est facile sauf ce que Tu rends facile, et Tu peux, si Tu le veux, rendre la difficulté facile.",
  },
  {
    includes: ["ذهبالمبتلواابتلتالعروق"],
    text: "La soif est partie, les veines sont irriguées et la récompense est assurée, si Allah le veut.",
  },
  {
    includes: ["الحمدللهالذياطعمنيهذا"],
    text: "Louange à Allah qui m’a donné cette nourriture et me l’a accordée sans force ni puissance de ma part.",
  },
  {
    includes: ["باركاللهلكوباركعليك"],
    text: "Qu’Allah te bénisse, répande Sa bénédiction sur toi et vous réunisse tous deux dans le bien.",
  },
  {
    includes: ["سبحانالذيسخرلناهذا", "واناالىربنالمنقلبون"],
    text: "Gloire à Celui qui a mis ceci à notre service alors que nous n’étions pas capables de le maîtriser. C’est vers notre Seigneur que nous retournerons.",
  },
  {
    includes: ["اللهمهونعلينا سفرناهذا", "اللهمانتالصاحبفيالسفر"],
    text: "Ô Allah, facilite-nous ce voyage et raccourcis-en la distance. Ô Allah, Tu es le Compagnon durant le voyage et le Protecteur de la famille. Je cherche refuge auprès de Toi contre les difficultés du voyage, la tristesse du spectacle et un mauvais retour dans les biens et la famille.",
  },
  {
    includes: ["اللهمصيبا نافعا"],
    text: "Ô Allah, fais que cette pluie soit bénéfique.",
  },
  {
    includes: ["اللهمانيسالكخيرهاوخيرمافيها", "شرهاوشرمافيها"],
    text: "Ô Allah, je Te demande le bien de ce vent, le bien qu’il contient et le bien pour lequel il a été envoyé. Je cherche refuge auprès de Toi contre son mal, le mal qu’il contient et le mal pour lequel il a été envoyé.",
  },
  {
    includes: ["اعوذباللهمنالشيطانالرجيم"],
    text: "Je cherche refuge auprès d’Allah contre Satan le banni.",
  },
  {
    includes: ["اسالاللهالعظيمربالعرشالعظيمانيشفيك"],
    text: "Je demande à Allah l’Immense, Seigneur du Trône immense, de te guérir.",
  },
  {
    includes: ["اللهمربالناساذهبالباس"],
    text: "Ô Allah, Seigneur des hommes, éloigne le mal et guéris. Tu es Celui qui guérit ; il n’est de guérison que la Tienne, une guérison ne laissant aucune maladie.",
  },
  {
    includes: ["بسماللهأعوذب عزةالله", "منشرمااجدواحاذر"],
    text: "Au nom d’Allah. Je cherche refuge auprès de la puissance et du pouvoir d’Allah contre le mal que je ressens et que je redoute.",
  },
  {
    includes: ["اناللهوانااليهراجعون", "اللهمأجرنيفي مصيبتي"],
    text: "Nous appartenons à Allah et c’est vers Lui que nous retournons. Ô Allah, récompense-moi dans mon épreuve et remplace-la-moi par quelque chose de meilleur.",
  },
  {
    includes: ["السلامعليكمأهل الديار", "نسالاللهلنا ولكمالعافية"],
    text: "Que la paix soit sur vous, habitants de ces demeures parmi les croyants et les musulmans. Nous vous rejoindrons, si Allah le veut. Nous demandons à Allah la préservation pour nous et pour vous.",
  },
  {
    includes: ["لاإلهإلااللهوحدهلاشريكله", "لهالملكولهالحمديحييويميت"],
    text: "Nul ne mérite d’être adoré sauf Allah, Seul, sans associé. À Lui la royauté et la louange. Il donne la vie et donne la mort, et Il est capable de toute chose.",
  },
  {
    includes: ["اللهماهدنيفيمنهديت", "وباركليفيماعطيت"],
    text: "Ô Allah, guide-moi parmi ceux que Tu as guidés, préserve-moi parmi ceux que Tu as préservés, prends-moi en charge parmi ceux que Tu as pris en charge, bénis ce que Tu m’as accordé et protège-moi du mal de ce que Tu as décrété. C’est Toi qui décrètes et nul ne décrète contre Toi.",
  },
  {
    includes: ["سبحانالملك القدوس"],
    text: "Gloire au Souverain, au Très-Saint.",
  },
  {
    includes: ["ربناهبلنامنازواجناوذرياتناقرةاعين"],
    text: "Seigneur, accorde-nous en nos épouses, époux et descendants la joie des yeux, et fais de nous des modèles pour les pieux.",
  },
  {
    includes: ["سبحانكاللههموبحمدكاشهدانلاإلهإلاأنت"],
    text: "Gloire et louange à Toi, ô Allah. J’atteste que nul ne mérite d’être adoré sauf Toi. Je Te demande pardon et je me repens à Toi.",
  },
];

const GENERAL_FRENCH_BY_SECTION: Record<DuaSectionId, string> = {
  "morning-evening":
    "Invocation de protection et de reconnaissance à réciter le matin ou le soir.",
  sleep: "Invocation liée au sommeil, au réveil ou à la protection durant la nuit.",
  prayer: "Invocation authentique liée aux ablutions, à la mosquée ou à la prière.",
  home: "Invocation à réciter dans les situations courantes de la maison.",
  family: "Invocation demandant la bénédiction, la protection et le bien pour la famille.",
  food: "Invocation de gratitude et de bénédiction autour du repas ou du jeûne.",
  protection: "Invocation demandant à Allah protection, apaisement et délivrance.",
  health: "Invocation liée à la maladie, à la guérison, à l’épreuve ou au deuil.",
  travel: "Invocation de protection et de facilité durant un déplacement ou un voyage.",
  work: "Invocation demandant facilité, savoir, subsistance et réussite dans une affaire.",
  nature: "Invocation à réciter face à la pluie, au vent, au tonnerre ou aux signes de la création.",
  etiquette: "Invocation et parole prophétique liée aux relations et au bon comportement.",
  hajj: "Invocation liée aux rites du Hajj, de la ‘Umrah et aux lieux saints.",
  daily: "Invocation authentique adaptée à cette situation du quotidien.",
};

type FrenchCatalogIndex = {
  exact: ReadonlyMap<string, RawFrenchDua>;
  entries: readonly { key: string; value: RawFrenchDua }[];
};

function createFrenchCatalogIndex(
  catalog: readonly RawFrenchDua[],
): FrenchCatalogIndex {
  const entries = catalog
    .filter(
      (entry) =>
        typeof entry.arabic === "string" &&
        entry.arabic.trim().length > 0 &&
        typeof entry.translation?.fr === "string" &&
        entry.translation.fr.trim().length > 0,
    )
    .map((value) => ({ key: compactArabic(value.arabic), value }))
    .filter((entry) => entry.key.length >= 8);
  return {
    exact: new Map(entries.map((entry) => [entry.key, entry.value])),
    entries,
  };
}

function findVerifiedFrench(
  arabic: string,
  index: FrenchCatalogIndex,
): RawFrenchDua | undefined {
  const key = compactArabic(arabic);
  const exact = index.exact.get(key);
  if (exact) return exact;
  if (key.length < 10) return undefined;

  let best: { score: number; value: RawFrenchDua } | undefined;
  for (const entry of index.entries) {
    const shortest = Math.min(key.length, entry.key.length);
    const longest = Math.max(key.length, entry.key.length);
    if (shortest / longest < 0.72) continue;
    if (!key.includes(entry.key) && !entry.key.includes(key)) continue;
    const score = shortest / longest;
    if (!best || score > best.score) best = { score, value: entry.value };
  }
  return best?.value;
}

function frenchMeaning(
  arabic: string,
  context: string,
  section: DuaSectionId,
): FrenchMeaning {
  const compact = compactArabic(arabic);
  const match = TRANSLATION_RULES.find((rule) =>
    rule.includes.every((fragment) => compact.includes(compactArabic(fragment))),
  );
  if (match) return { text: match.text, isSummary: false };

  return {
    text: `${GENERAL_FRENCH_BY_SECTION[section]} Contexte : ${context}.`,
    isSummary: true,
  };
}

export function classifyDuaCategory(title: string): DuaSectionId {
  const plain = stripArabicMarks(title);
  if (/الصباح|المساء/.test(plain)) return "morning-evening";
  if (/النوم|الاستيقاظ|الفراش|الرؤيا|الحلم|ليلا/.test(plain)) return "sleep";
  if (
    /الصلاة|السجود|الركوع|التشهد|المسجد|الاذان|الوضوء|الاستخارة|الوتر/.test(
      plain,
    )
  ) {
    return "prayer";
  }
  if (/المتزوج|الزوجة|المولود|الاولاد|الطفل|الذرية|الاسرة/.test(plain)) {
    return "family";
  }
  if (/الطعام|الشراب|الضيف|الصائم|افطار|الثمر/.test(plain)) return "food";
  if (/المنزل|الخلاء|الثوب/.test(plain)) return "home";
  if (/السفر|الركوب|القرية|البلدة|المسافر|الرجوع من السفر/.test(plain)) {
    return "travel";
  }
  if (/المطر|الريح|الرعد|الهلال|الاستسقاء|الاستصحاء/.test(plain)) {
    return "nature";
  }
  if (/عرفة|الحج|العمرة|الصفا|المروة|المشعر|الحجر الاسود|الجمار/.test(plain)) {
    return "hajj";
  }
  if (
    /المريض|المرض|الشفاء|الوجع|المحتضر|الميت|القبر|التعزية|المصيبة|الجنازة/.test(
      plain,
    )
  ) {
    return "health";
  }
  if (
    /الخوف|الكرب|الهم|الحزن|الشيطان|الوسوسة|الغضب|العين|الدجال|الشرك|العدو|السلطان|الفزع/.test(
      plain,
    )
  ) {
    return "protection";
  }
  if (/الدين|الدَّين|العلم|العمل|السوق|استصعب|امر يسره|امر يكرهه/.test(plain)) {
    return "work";
  }
  if (
    /العطاس|السلام|المجلس|المعروف|احبك|بارك الله|مدح|زكي|سببته|الاداب/.test(
      plain,
    )
  ) {
    return "etiquette";
  }
  return "daily";
}

function normalizeCatalog(
  raw: readonly RawDuaCategory[],
  frenchCatalog: readonly RawFrenchDua[] = [],
): DuaCategory[] {
  const frenchIndex = createFrenchCatalogIndex(frenchCatalog);
  return raw
    .filter(
      (category) =>
        Number.isFinite(category.id) &&
        typeof category.category === "string" &&
        Array.isArray(category.array),
    )
    .map((category) => {
      const title = frenchTitle(category.category.trim());
      const section = classifyDuaCategory(category.category);
      const explanationOnlyCategory = /^(فضل|كيف كان|من انواع)/.test(
        stripArabicMarks(category.category),
      );
      const items = category.array
        .filter((item) => typeof item.text === "string" && item.text.trim())
        .map((item): DuaItem | null => {
          const focused = extractFocusedDua(item.text);
          if (explanationOnlyCategory && !focused.learnable) return null;
          const official = findOfficialFrenchDua(category.id, item.id);
          const verified = findVerifiedFrench(focused.arabic, frenchIndex);
          const meaning = official?.french
            ? { text: official.french, isSummary: false }
            : verified?.translation?.fr?.trim()
            ? { text: verified.translation.fr.trim(), isSummary: false }
            : frenchMeaning(focused.arabic, title, section);
          const canUseLearningAudio = focused.learnable && Boolean(item.audio);
          return {
            id: `${category.id}:${item.id}`,
            order: item.id,
            arabic: focused.arabic,
            phonetic:
              verified?.transliteration?.trim() ||
              phoneticFromArabic(focused.arabic),
            french: meaning.text,
            frenchIsSummary: meaning.isSummary,
            repetitions: Math.max(
              1,
              Number(item.count) || Number(verified?.repeat) || 1,
            ),
            audioUrl: canUseLearningAudio ? resolveUrl(item.audio) : undefined,
            audioStartRatio: focused.audioStartRatio,
            audioEndRatio: focused.audioEndRatio,
            audioStartOffsetSeconds: canUseLearningAudio
              ? focused.hasNarration
                ? 0.95
                : 0.18
              : 0,
            audioEndOffsetSeconds: canUseLearningAudio ? 0.28 : 0,
            source: official
              ? "La Citadelle du musulman — édition française"
              : verified?.reference?.trim() || "Hisn al-Muslim",
            sourceUrl: official?.sourceUrl || verified?.verify_url,
          };
        })
        .filter((item): item is DuaItem => Boolean(item));

      return {
        id: category.id,
        arabicTitle: category.category.trim(),
        frenchTitle: title,
        section,
        audioUrl: resolveUrl(category.audio),
        items,
      };
    })
    .filter((category) => category.items.length > 0);
}


const FALLBACK_CATALOG: readonly RawDuaCategory[] = [
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

const CURATED_DUA_CATEGORIES: readonly DuaCategory[] = [
  {
    id: -1001,
    arabicTitle: "دُعَاءُ العِلْمِ وَالتَّيْسِيرِ",
    frenchTitle: "Examens, études et concentration",
    section: "work",
    items: [
      {
        id: "guided:study:1",
        order: 1,
        arabic:
          "فَتَعَالَى اللَّهُ الْمَلِكُ الْحَقُّ، وَلَا تَعْجَلْ بِالْقُرْآنِ مِنْ قَبْلِ أَنْ يُقْضَى إِلَيْكَ وَحْيُهُ، وَقُلْ رَبِّ زِدْنِي عِلْمًا",
        phonetic:
          "Fa-ta‘āla-Llāhu-l-Maliku-l-Haqq. Wa lā ta‘jal bil-Qur’āni min qabli an yuqdā ilayka wahyuh, wa qul Rabbi zidnī ‘ilmā",
        french:
          "Exalté soit Allah, le Souverain véritable. Ne te hâte pas de réciter avant que la révélation ne soit achevée, et dis : Seigneur, augmente-moi en savoir.",
        repetitions: 1,
        audioSource: STUDY_20_114_AUDIO,
        source: "Coran 20:114",
        sourceUrl: "https://quran.com/20/114",
      },
      {
        id: "guided:study:2",
        order: 2,
        arabic:
          "قَالَ رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي، يَفْقَهُوا قَوْلِي",
        phonetic:
          "Rabbi-shrah lī sadrī, wa yassir lī amrī, wa-hlul ‘uqdatan min lisānī, yafqahū qawlī",
        french:
          "Seigneur, ouvre-moi la poitrine, facilite ma mission et dénoue ma langue afin que l’on comprenne mes paroles.",
        repetitions: 1,
        audioSource: STUDY_20_25_28_AUDIO,
        source: "Coran 20:25-28",
        sourceUrl: "https://quran.com/20/25-28",
      },
    ],
  },
  {
    id: -1002,
    arabicTitle: "دُعَاءُ الزَّوَاجِ وَالأُسْرَةِ",
    frenchTitle: "Mariage, couple et famille",
    section: "family",
    items: [
      {
        id: "guided:marriage:1",
        order: 1,
        arabic:
          "وَالَّذِينَ يَقُولُونَ رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
        phonetic:
          "Rabbanā hab lanā min azwājinā wa dhurriyyātinā qurrata a‘yunin, wa-j‘alnā lil-muttaqīna imāmā",
        french:
          "Et ceux qui disent : Seigneur, accorde-nous en nos épouses, époux et descendants la joie des yeux, et fais de nous des modèles pour les pieux.",
        repetitions: 1,
        audioSource: FAMILY_25_74_AUDIO,
        source: "Coran 25:74",
        sourceUrl: "https://quran.com/25/74",
      },
      {
        id: "guided:marriage:2",
        order: 2,
        arabic:
          "بَارَكَ اللَّهُ لَكَ، وَبَارَكَ عَلَيْكَ، وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ",
        phonetic:
          "Bāraka-Llāhu laka, wa bāraka ‘alayka, wa jama‘a baynakumā fī khayr",
        french:
          "Qu’Allah te bénisse, répande Sa bénédiction sur toi et vous réunisse tous deux dans le bien.",
        repetitions: 1,
        audioSource: NEWLYWEDS_AUDIO,
        source: "Jāmi‘ at-Tirmidhi 1091",
        sourceUrl: "https://sunnah.com/tirmidhi:1091",
      },
    ],
  },
  {
    id: -1003,
    arabicTitle: "دُعَاءُ المَرَضِ وَالشِّفَاءِ",
    frenchTitle: "Maladie, douleur et guérison",
    section: "health",
    items: [
      {
        id: "guided:illness:1",
        order: 1,
        arabic:
          "اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِهِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا",
        phonetic:
          "Allāhumma Rabba-n-nās, adhhibi-l-ba’s, ishfihi wa Anta-sh-Shāfī, lā shifā’a illā shifā’uk, shifā’an lā yughādiru saqamā",
        french:
          "Ô Allah, Seigneur des hommes, éloigne le mal et guéris. Tu es Celui qui guérit ; il n’est de guérison que la Tienne, une guérison ne laissant aucune maladie.",
        repetitions: 1,
        source: "Sahih al-Bukhari 5743",
        sourceUrl: "https://sunnah.com/bukhari:5743",
      },
      {
        id: "guided:illness:2",
        order: 2,
        arabic:
          "أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ",
        phonetic: "As’alu-Llāha-l-‘Azīm, Rabba-l-‘Arshi-l-‘Azīm, an yashfiyak",
        french:
          "Je demande à Allah l’Immense, Seigneur du Trône immense, de te guérir.",
        repetitions: 7,
        audioSource: HEALING_SEVEN_AUDIO,
        source: "Sunan Abi Dawud 3106",
        sourceUrl: "https://sunnah.com/abudawud:3106",
      },
      {
        id: "guided:illness:3",
        order: 3,
        arabic:
          "بِسْمِ اللَّهِ. أَعُوذُ بِعِزَّةِ اللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ",
        phonetic:
          "Bismi-Llāh. A‘ūdhu bi-‘izzati-Llāhi wa qudratihi min sharri mā ajidu wa uhādhir",
        french:
          "Au nom d’Allah. Je cherche refuge auprès de la puissance et du pouvoir d’Allah contre le mal que je ressens et que je redoute.",
        repetitions: 7,
        source: "Sahih Muslim 2202",
        sourceUrl: "https://sunnah.com/muslim:2202",
      },
    ],
  },
];

function addGuidedCategories(catalog: readonly DuaCategory[]) {
  return [...CURATED_DUA_CATEGORIES, ...catalog];
}

export async function loadDuaCatalog(): Promise<readonly DuaCategory[]> {
  const [cachedRaw, cachedFrench] = await Promise.all([
    storageService.get<readonly RawDuaCategory[]>(RAW_CACHE_KEY).catch(() => null),
    storageService.get<readonly RawFrenchDua[]>(FRENCH_CACHE_KEY).catch(() => null),
  ]);

  try {
    const [rawResult, frenchResult] = await Promise.allSettled([
      cachedRaw?.length
        ? Promise.resolve(cachedRaw)
        : fetch(CATALOG_URL).then(async (response) => {
            if (!response.ok) throw new Error(`Dua catalog ${response.status}`);
            return (await response.json()) as readonly RawDuaCategory[];
          }),
      cachedFrench?.length
        ? Promise.resolve(cachedFrench)
        : fetch(FRENCH_CATALOG_URL).then(async (response) => {
            if (!response.ok) throw new Error(`French dua catalog ${response.status}`);
            return (await response.json()) as readonly RawFrenchDua[];
          }),
    ]);

    const raw =
      rawResult.status === "fulfilled" ? rawResult.value : cachedRaw ?? FALLBACK_CATALOG;
    const french =
      frenchResult.status === "fulfilled" ? frenchResult.value : cachedFrench ?? [];
    const normalized = normalizeCatalog(raw, french);
    if (normalized.length < 4) throw new Error("Incomplete dua catalog");

    if (!cachedRaw?.length && raw.length > 4) {
      void storageService.set(RAW_CACHE_KEY, raw).catch(() => undefined);
    }
    if (!cachedFrench?.length && french.length > 4) {
      void storageService.set(FRENCH_CACHE_KEY, french).catch(() => undefined);
    }
    return addGuidedCategories(normalized);
  } catch {
    return addGuidedCategories(
      normalizeCatalog(FALLBACK_CATALOG, cachedFrench ?? []),
    );
  }
}

export const DUA_GUIDES: ReadonlyArray<{
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  imageSource: number;
  categoryId?: number;
  query?: string;
  section?: DuaSectionId;
}> = [
  {
    id: "study",
    label: "Examens & études",
    subtitle: "Savoir, concentration, facilité",
    icon: "school-outline",
    imageSource: require("../../assets/images/dua/guides/study.jpg"),
    categoryId: -1001,
  },
  {
    id: "marriage",
    label: "Mariage & famille",
    subtitle: "Couple, bénédiction, foyer",
    icon: "heart-outline",
    imageSource: require("../../assets/images/dua/guides/marriage.jpg"),
    categoryId: -1002,
  },
  {
    id: "illness",
    label: "Maladie & guérison",
    subtitle: "Douleur, visite, protection",
    icon: "medkit-outline",
    imageSource: require("../../assets/images/dua/guides/illness.jpg"),
    categoryId: -1003,
  },
  {
    id: "anxiety",
    label: "Stress & tristesse",
    subtitle: "Angoisse, difficulté, colère",
    icon: "leaf-outline",
    imageSource: require("../../assets/images/dua/guides/stress.jpg"),
    section: "protection",
  },
  {
    id: "protection",
    label: "Protection",
    subtitle: "Peur, mauvais œil, tentations",
    icon: "shield-checkmark-outline",
    imageSource: require("../../assets/images/dua/guides/protection.jpg"),
    section: "protection",
  },
  {
    id: "food",
    label: "Repas",
    subtitle: "Avant et après avoir mangé",
    icon: "restaurant-outline",
    imageSource: require("../../assets/images/dua/guides/food.jpg"),
    section: "food",
  },
  {
    id: "travel",
    label: "Voyage",
    subtitle: "Départ, transport, retour",
    icon: "airplane-outline",
    imageSource: require("../../assets/images/dua/guides/travel.jpg"),
    section: "travel",
  },
  {
    id: "sleep",
    label: "Sommeil",
    subtitle: "Dormir, réveil et rêves",
    icon: "moon-outline",
    imageSource: require("../../assets/images/dua/guides/sleep.jpg"),
    section: "sleep",
  },
  {
    id: "work",
    label: "Travail & projets",
    subtitle: "Facilité, réussite, décision",
    icon: "briefcase-outline",
    imageSource: require("../../assets/images/dua/guides/work.jpg"),
    section: "work",
  },
  {
    id: "debt",
    label: "Dette & finances",
    subtitle: "Dette, subsistance, marché",
    icon: "wallet-outline",
    imageSource: require("../../assets/images/dua/guides/debt.jpg"),
    section: "work",
  },
  {
    id: "grief",
    label: "Décès & deuil",
    subtitle: "Défunt, condoléances, cimetière",
    icon: "flower-outline",
    imageSource: require("../../assets/images/dua/guides/grief.jpg"),
    section: "health",
  },
  {
    id: "prayer",
    label: "Autour de la prière",
    subtitle: "Ablutions, mosquée, salāt",
    icon: "business-outline",
    imageSource: require("../../assets/images/dua/guides/prayer.jpg"),
    section: "prayer",
  },
  {
    id: "home",
    label: "Maison & quotidien",
    subtitle: "Entrer, sortir, s’habiller",
    icon: "home-outline",
    imageSource: require("../../assets/images/dua/guides/home.jpg"),
    section: "home",
  },
  {
    id: "weather",
    label: "Pluie & météo",
    subtitle: "Pluie, vent, nouvelle lune",
    icon: "rainy-outline",
    imageSource: require("../../assets/images/dua/guides/weather.jpg"),
    section: "nature",
  },
];

export const DUA_SECTIONS: ReadonlyArray<{
  id: DuaSectionId;
  label: string;
  subtitle: string;
  icon: string;
  imageSource: number;
}> = [
  {
    id: "morning-evening",
    label: "Matin & soir",
    subtitle: "Adhkār quotidiens et protection",
    icon: "sunny-outline",
    imageSource: require("../../assets/images/dua/guides/protection.jpg"),
  },
  {
    id: "sleep",
    label: "Sommeil & réveil",
    subtitle: "Coucher, réveil et rêves",
    icon: "moon-outline",
    imageSource: require("../../assets/images/dua/guides/sleep.jpg"),
  },
  {
    id: "prayer",
    label: "Prière & mosquée",
    subtitle: "Ablutions, adhān et salāt",
    icon: "business-outline",
    imageSource: require("../../assets/images/dua/guides/prayer.jpg"),
  },
  {
    id: "home",
    label: "Maison & quotidien",
    subtitle: "Entrer, sortir et s’habiller",
    icon: "home-outline",
    imageSource: require("../../assets/images/dua/guides/home.jpg"),
  },
  {
    id: "family",
    label: "Couple & famille",
    subtitle: "Mariage, enfants et foyer",
    icon: "heart-outline",
    imageSource: require("../../assets/images/dua/guides/marriage.jpg"),
  },
  {
    id: "food",
    label: "Repas & jeûne",
    subtitle: "Manger, boire et rompre le jeûne",
    icon: "restaurant-outline",
    imageSource: require("../../assets/images/dua/guides/food.jpg"),
  },
  {
    id: "protection",
    label: "Protection & apaisement",
    subtitle: "Peur, anxiété et tentations",
    icon: "shield-checkmark-outline",
    imageSource: require("../../assets/images/dua/guides/stress.jpg"),
  },
  {
    id: "health",
    label: "Santé, épreuves & deuil",
    subtitle: "Maladie, douleur et condoléances",
    icon: "medkit-outline",
    imageSource: require("../../assets/images/dua/guides/illness.jpg"),
  },
  {
    id: "travel",
    label: "Voyage & déplacements",
    subtitle: "Départ, trajet et retour",
    icon: "airplane-outline",
    imageSource: require("../../assets/images/dua/guides/travel.jpg"),
  },
  {
    id: "work",
    label: "Études, travail & finances",
    subtitle: "Savoir, décisions et dettes",
    icon: "briefcase-outline",
    imageSource: require("../../assets/images/dua/guides/study.jpg"),
  },
  {
    id: "nature",
    label: "Pluie & nature",
    subtitle: "Vent, tonnerre et nouvelle lune",
    icon: "rainy-outline",
    imageSource: require("../../assets/images/dua/guides/weather.jpg"),
  },
  {
    id: "etiquette",
    label: "Relations & bonnes paroles",
    subtitle: "Salutations, gratitude et assemblées",
    icon: "people-outline",
    imageSource: require("../../assets/images/dua/guides/home.jpg"),
  },
  {
    id: "hajj",
    label: "Hajj & ‘Umrah",
    subtitle: "Rites et lieux saints",
    icon: "location-outline",
    imageSource: require("../../assets/images/dua/guides/prayer.jpg"),
  },
  {
    id: "daily",
    label: "Autres occasions",
    subtitle: "Invocations complémentaires",
    icon: "sparkles-outline",
    imageSource: require("../../assets/images/dua/guides/work.jpg"),
  },
];
