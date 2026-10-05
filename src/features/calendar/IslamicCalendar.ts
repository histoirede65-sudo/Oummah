import { getActiveLanguage, type LanguageCode } from "../../i18n";

export type HijriMethod = "country" | "astronomical" | "manual";
export type CalendarCountry =
  | "france"
  | "algeria"
  | "morocco"
  | "tunisia"
  | "saudi-arabia"
  | "turkey"
  | "other";

export const CALENDAR_COUNTRIES: readonly {
  id: CalendarCountry;
  label: string;
  labelEn: string;
}[] = [
  { id: "france", label: "France", labelEn: "France" },
  { id: "algeria", label: "Algérie", labelEn: "Algeria" },
  { id: "morocco", label: "Maroc", labelEn: "Morocco" },
  { id: "tunisia", label: "Tunisie", labelEn: "Tunisia" },
  { id: "saudi-arabia", label: "Arabie saoudite", labelEn: "Saudi Arabia" },
  { id: "turkey", label: "Turquie", labelEn: "Turkey" },
  { id: "other", label: "Autre pays", labelEn: "Other country" },
];

export type HijriDate = {
  day: number;
  month: number;
  monthName: string;
  year: number;
};

export type IslamicEventKind =
  | "celebration"
  | "recommended-fast"
  | "important-period";

export type IslamicEventDefinition = {
  id: string;
  title: string;
  shortTitle: string;
  kind: IslamicEventKind;
  summary: string;
  actions: readonly string[];
  sources: readonly { label: string; url: string }[];
  importance: number;
  estimated?: boolean;
  matches: (date: HijriDate) => boolean;
  /** Version anglaise ; les libellés de sources suivent le même ordre. */
  en: {
    title: string;
    shortTitle: string;
    summary: string;
    actions: readonly string[];
    sourceLabels: readonly string[];
  };
};

export const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabî‘ al-Awwal",
  "Rabî‘ ath-Thânî",
  "Jumâdâ al-Ûlâ",
  "Jumâdâ ath-Thâniya",
  "Rajab",
  "Sha‘bân",
  "Ramadan",
  "Shawwâl",
  "Dhul-Qa‘da",
  "Dhul-Hijja",
] as const;

export const HIJRI_MONTHS_EN = [
  "Muharram",
  "Safar",
  "Rabi‘ al-Awwal",
  "Rabi‘ al-Thani",
  "Jumada al-Ula",
  "Jumada al-Thaniya",
  "Rajab",
  "Sha‘ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qa‘dah",
  "Dhu al-Hijjah",
] as const;

export function hijriMonthName(month: number, language: LanguageCode = getActiveLanguage()) {
  const index = Math.max(1, Math.min(12, month)) - 1;
  return language === "fr" ? HIJRI_MONTHS[index] : HIJRI_MONTHS_EN[index];
}

const DAY_MS = 86_400_000;

function shiftedDate(date: Date, adjustment: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + adjustment);
  return next;
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(date: Date, days: number) {
  return shiftedDate(date, days);
}

export function getHijriDate(
  date: Date,
  method: HijriMethod = "country",
  adjustment = 0,
  country: CalendarCountry = "france",
): HijriDate {
  const calendar =
    method === "astronomical"
      ? "islamic-civil"
      : country === "saudi-arabia"
        ? "islamic-umalqura"
        : country === "turkey"
          ? "islamic-civil"
          : "islamic";
  const target = shiftedDate(date, adjustment);
  const formatter = new Intl.DateTimeFormat(`en-US-u-ca-${calendar}`, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const parts = formatter.formatToParts(target);
  const value = (type: "day" | "month" | "year") =>
    Number(parts.find((part) => part.type === type)?.value.replace(/\D/g, ""));
  const month = Math.max(1, Math.min(12, value("month") || 1));
  return {
    day: value("day") || 1,
    month,
    monthName: HIJRI_MONTHS[month - 1],
    year: value("year") || 1448,
  };
}

export function formatHijri(date: HijriDate, language: LanguageCode = getActiveLanguage()) {
  return `${date.day} ${hijriMonthName(date.month, language)} ${date.year}`;
}

export function formatGregorian(
  date: Date,
  long = true,
  language: LanguageCode = getActiveLanguage(),
) {
  return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-GB", {
    weekday: long ? "long" : undefined,
    day: "numeric",
    month: long ? "long" : "short",
    year: "numeric",
  }).format(date);
}

export const ISLAMIC_EVENTS: readonly IslamicEventDefinition[] = [
  {
    id: "hijri-new-year",
    title: "Nouvel an hégirien",
    shortTitle: "Nouvel an hégirien",
    kind: "important-period",
    summary:
      "Le premier jour de Muharram ouvre une nouvelle année du calendrier hégirien.",
    actions: [
      "Faire le bilan de son année",
      "Formuler une intention sincère",
      "Découvrir l’histoire de l’Hégire",
    ],
    sources: [
      { label: "Coran 9:36 — les douze mois", url: "https://quran.com/9/36" },
    ],
    importance: 4,
    estimated: true,
    en: {
      title: "Islamic New Year",
      shortTitle: "Islamic New Year",
      summary:
        "The first day of Muharram opens a new year of the Hijri calendar.",
      actions: ["Reflect on the past year", "Make a sincere intention", "Learn the story of the Hijrah"],
      sourceLabels: ["Quran 9:36 — the twelve months"],
    },
    matches: (date) => date.month === 1 && date.day === 1,
  },
  {
    id: "ashura",
    title: "Jour de ‘Âshûrâ’",
    shortTitle: "‘Âshûrâ’",
    kind: "recommended-fast",
    summary:
      "Le dixième jour de Muharram. Son jeûne est recommandé et constitue une grande occasion de gratitude.",
    actions: [
      "Jeûner le 10 Muharram",
      "Y associer le 9 ou le 11",
      "Multiplier le dhikr et la gratitude",
    ],
    sources: [
      {
        label: "Sahih Muslim 1162 — jeûne de ‘Âshûrâ’",
        url: "https://sunnah.com/muslim:1162b",
      },
    ],
    importance: 5,
    estimated: true,
    en: {
      title: "Day of ‘Ashura",
      shortTitle: "‘Ashura",
      summary:
        "The tenth day of Muharram. Fasting it is recommended and a great occasion for gratitude.",
      actions: ["Fast on 10 Muharram", "Add the 9th or the 11th", "Increase dhikr and gratitude"],
      sourceLabels: ["Sahih Muslim 1162 — fasting ‘Ashura"],
    },
    matches: (date) => date.month === 1 && date.day === 10,
  },
  {
    id: "ramadan-start",
    title: "Début prévisionnel de Ramadan",
    shortTitle: "Ramadan",
    kind: "important-period",
    summary:
      "Le mois du jeûne et de la révélation du Coran. La date finale dépend de l’annonce officielle de votre pays.",
    actions: [
      "Préparer son intention",
      "Planifier sa lecture du Coran",
      "Organiser ses objectifs avec mesure",
    ],
    sources: [
      {
        label: "Coran 2:185 — le mois de Ramadan",
        url: "https://quran.com/2/185",
      },
    ],
    importance: 5,
    estimated: true,
    en: {
      title: "Expected start of Ramadan",
      shortTitle: "Ramadan",
      summary:
        "The month of fasting and of the revelation of the Quran. The final date depends on your country’s official announcement.",
      actions: ["Prepare your intention", "Plan your Quran reading", "Set balanced goals"],
      sourceLabels: ["Quran 2:185 — the month of Ramadan"],
    },
    matches: (date) => date.month === 9 && date.day === 1,
  },
  {
    id: "laylat-al-qadr",
    title: "Nuits où rechercher Laylat al-Qadr",
    shortTitle: "Laylat al-Qadr",
    kind: "important-period",
    summary:
      "Laylat al-Qadr se recherche dans les nuits impaires des dix dernières nuits de Ramadan, sans la réduire avec certitude à une seule date.",
    actions: [
      "Prier et invoquer pendant les nuits impaires",
      "Lire et méditer le Coran",
      "Demander pardon avec sincérité",
    ],
    sources: [
      { label: "Coran — sourate Al-Qadr", url: "https://quran.com/97" },
      {
        label: "Sahih al-Bukhari 2017 — nuits impaires",
        url: "https://sunnah.com/bukhari:2017",
      },
    ],
    importance: 5,
    estimated: true,
    en: {
      title: "Nights to seek Laylat al-Qadr",
      shortTitle: "Laylat al-Qadr",
      summary:
        "Laylat al-Qadr is sought in the odd nights of the last ten nights of Ramadan, without fixing it with certainty to a single date.",
      actions: ["Pray and supplicate during the odd nights", "Read and reflect on the Quran", "Seek forgiveness sincerely"],
      sourceLabels: ["Quran — Surah Al-Qadr", "Sahih al-Bukhari 2017 — the odd nights"],
    },
    matches: (date) =>
      date.month === 9 &&
      date.day >= 21 &&
      date.day <= 29 &&
      date.day % 2 === 1,
  },
  {
    id: "eid-al-fitr",
    title: "Aïd al-Fitr — date prévisionnelle",
    shortTitle: "Aïd al-Fitr",
    kind: "celebration",
    summary:
      "La fête qui marque l’achèvement du jeûne de Ramadan. Sa date doit être confirmée selon l’annonce officielle locale.",
    actions: [
      "Accomplir la prière de l’Aïd",
      "S’acquitter de Zakât al-Fitr à temps",
      "Partager la joie avec ses proches",
    ],
    sources: [
      {
        label: "Sahih al-Bukhari — les deux fêtes",
        url: "https://sunnah.com/bukhari/13",
      },
    ],
    importance: 5,
    estimated: true,
    en: {
      title: "Eid al-Fitr — expected date",
      shortTitle: "Eid al-Fitr",
      summary:
        "The celebration marking the end of the Ramadan fast. Its date must be confirmed by the local official announcement.",
      actions: ["Attend the Eid prayer", "Pay Zakat al-Fitr on time", "Share the joy with your loved ones"],
      sourceLabels: ["Sahih al-Bukhari — the two Eids"],
    },
    matches: (date) => date.month === 10 && date.day === 1,
  },
  {
    id: "dhul-hijjah-start",
    title: "Dix premiers jours de Dhul-Hijja",
    shortTitle: "Dhul-Hijja",
    kind: "important-period",
    summary:
      "Le début d’une période particulièrement précieuse pour les œuvres vertueuses et le rappel d’Allah.",
    actions: [
      "Multiplier les bonnes œuvres",
      "Augmenter le dhikr",
      "Se préparer au jour de ‘Arafat",
    ],
    sources: [
      {
        label: "Sahih al-Bukhari 969 — bonnes œuvres",
        url: "https://sunnah.com/bukhari:969",
      },
    ],
    importance: 5,
    estimated: true,
    en: {
      title: "First ten days of Dhu al-Hijjah",
      shortTitle: "Dhu al-Hijjah",
      summary:
        "The start of an especially precious time for good deeds and the remembrance of Allah.",
      actions: ["Increase good deeds", "Increase dhikr", "Prepare for the day of ‘Arafah"],
      sourceLabels: ["Sahih al-Bukhari 969 — good deeds"],
    },
    matches: (date) => date.month === 12 && date.day === 1,
  },
  {
    id: "arafah",
    title: "Jour de ‘Arafat",
    shortTitle: "‘Arafat",
    kind: "recommended-fast",
    summary:
      "Le neuvième jour de Dhul-Hijja. Pour la personne qui n’accomplit pas le Hajj, son jeûne est fortement recommandé.",
    actions: [
      "Jeûner si vous n’êtes pas pèlerin",
      "Multiplier les invocations",
      "Renouveler son repentir",
    ],
    sources: [
      {
        label: "Sahih Muslim 1162 — jeûne de ‘Arafat",
        url: "https://sunnah.com/muslim:1162b",
      },
    ],
    importance: 5,
    estimated: true,
    en: {
      title: "Day of ‘Arafah",
      shortTitle: "‘Arafah",
      summary:
        "The ninth day of Dhu al-Hijjah. For those not performing Hajj, fasting it is strongly recommended.",
      actions: ["Fast if you are not a pilgrim", "Increase supplication", "Renew your repentance"],
      sourceLabels: ["Sahih Muslim 1162 — fasting ‘Arafah"],
    },
    matches: (date) => date.month === 12 && date.day === 9,
  },
  {
    id: "eid-al-adha",
    title: "Aïd al-Adha — date prévisionnelle",
    shortTitle: "Aïd al-Adha",
    kind: "celebration",
    summary:
      "La fête du sacrifice, célébrée le dixième jour de Dhul-Hijja. La date finale suit l’annonce officielle.",
    actions: [
      "Accomplir la prière de l’Aïd",
      "Faire vivre les liens familiaux",
      "Partager et prendre soin des personnes dans le besoin",
    ],
    sources: [
      {
        label: "Coran 108:2 — prière et sacrifice",
        url: "https://quran.com/108/2",
      },
    ],
    importance: 5,
    estimated: true,
    en: {
      title: "Eid al-Adha — expected date",
      shortTitle: "Eid al-Adha",
      summary:
        "The feast of sacrifice, celebrated on the tenth day of Dhu al-Hijjah. The final date follows the official announcement.",
      actions: ["Attend the Eid prayer", "Strengthen family ties", "Share with and care for those in need"],
      sourceLabels: ["Quran 108:2 — prayer and sacrifice"],
    },
    matches: (date) => date.month === 12 && date.day === 10,
  },
  {
    id: "tashriq",
    title: "Jours de Tachrîq",
    shortTitle: "Tachrîq",
    kind: "important-period",
    summary:
      "Les 11, 12 et 13 Dhul-Hijja sont des jours de nourriture, de boisson et de rappel d’Allah.",
    actions: [
      "Multiplier le rappel d’Allah",
      "Profiter de ces jours avec gratitude",
      "Ne pas programmer de jeûne volontaire",
    ],
    sources: [
      {
        label: "Sahih Muslim 1141 — jours de Tachrîq",
        url: "https://sunnah.com/muslim:1141a",
      },
    ],
    importance: 4,
    estimated: true,
    en: {
      title: "Days of Tashriq",
      shortTitle: "Tashriq",
      summary:
        "The 11th, 12th and 13th of Dhu al-Hijjah are days of eating, drinking and remembrance of Allah.",
      actions: ["Increase the remembrance of Allah", "Enjoy these days with gratitude", "Do not plan a voluntary fast"],
      sourceLabels: ["Sahih Muslim 1141 — the days of Tashriq"],
    },
    matches: (date) => date.month === 12 && date.day >= 11 && date.day <= 13,
  },
];

export const WHITE_DAYS_EVENT: IslamicEventDefinition = {
  id: "white-days",
  title: "Jours blancs",
  shortTitle: "Jour blanc",
  kind: "recommended-fast",
  summary:
    "Les 13e, 14e et 15e jours de chaque mois hégirien sont des jours de jeûne recommandé.",
  actions: [
    "Préparer son jeûne",
    "Adapter le rappel à sa situation",
    "Conserver une intention sincère et discrète",
  ],
  sources: [
    {
      label: "Jami‘ at-Tirmidhi 761 — 13, 14 et 15",
      url: "https://sunnah.com/tirmidhi:761",
    },
  ],
  importance: 2,
  estimated: true,
  en: {
    title: "White days",
    shortTitle: "White day",
    summary:
      "The 13th, 14th and 15th days of each Hijri month are days of recommended fasting.",
    actions: ["Prepare your fast", "Adapt the reminder to your situation", "Keep a sincere and discreet intention"],
    sourceLabels: ["Jami‘ at-Tirmidhi 761 — 13th, 14th and 15th"],
  },
  matches: (date) => date.day >= 13 && date.day <= 15,
};

/** Textes de l'événement dans la langue de l'app. */
export function localizeEvent(
  event: IslamicEventDefinition,
  language: LanguageCode = getActiveLanguage(),
) {
  if (language === "fr") {
    return {
      title: event.title,
      shortTitle: event.shortTitle,
      summary: event.summary,
      actions: event.actions,
      sources: event.sources,
    };
  }
  return {
    title: event.en.title,
    shortTitle: event.en.shortTitle,
    summary: event.en.summary,
    actions: event.en.actions,
    sources: event.sources.map((source, index) => ({
      ...source,
      label: event.en.sourceLabels[index] ?? source.label,
    })),
  };
}

export function countryLabel(id: CalendarCountry, language: LanguageCode = getActiveLanguage()) {
  const country = CALENDAR_COUNTRIES.find((item) => item.id === id);
  if (!country) return undefined;
  return language === "fr" ? country.label : country.labelEn;
}

export function getEventsForDate(date: HijriDate) {
  const fixed = ISLAMIC_EVENTS.filter((event) => event.matches(date));
  return WHITE_DAYS_EVENT.matches(date) ? [...fixed, WHITE_DAYS_EVENT] : fixed;
}

export function getEventDefinition(id: string) {
  return id === WHITE_DAYS_EVENT.id
    ? WHITE_DAYS_EVENT
    : ISLAMIC_EVENTS.find((event) => event.id === id);
}

export function findNextEvent(
  from: Date,
  method: HijriMethod,
  adjustment: number,
  country: CalendarCountry = "france",
) {
  for (let offset = 0; offset <= 430; offset += 1) {
    const date = addDays(from, offset);
    const hijri = getHijriDate(date, method, adjustment, country);
    const events = getEventsForDate(hijri)
      .filter((event) => event.importance >= 3)
      .sort((a, b) => b.importance - a.importance);
    if (events[0]) return { date, days: offset, event: events[0], hijri };
  }
  return undefined;
}

export function daysBetween(from: Date, to: Date) {
  const start = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
  ).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((end - start) / DAY_MS);
}

export function isRecommendedFastDay(date: Date, hijri: HijriDate) {
  const weekday = date.getDay();
  // Jeûne interdit le jour de l'Aïd al-Fitr, de l'Aïd al-Adha et pendant Tachrîq ;
  // pendant Ramadan le jeûne est obligatoire, pas seulement recommandé.
  if (hijri.month === 10 && hijri.day === 1) return false;
  if (hijri.month === 12 && hijri.day >= 10 && hijri.day <= 13) return false;
  if (hijri.month === 9) return false;
  return (
    weekday === 1 ||
    weekday === 4 ||
    WHITE_DAYS_EVENT.matches(hijri) ||
    (hijri.month === 1 && hijri.day === 10) ||
    (hijri.month === 12 && hijri.day === 9)
  );
}
