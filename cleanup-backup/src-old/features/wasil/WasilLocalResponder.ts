import { OFFICIAL_FRENCH_DUAS } from "../dua/OfficialFrenchDuaCatalog";
import { HADITH_CATALOG } from "../hadith/data/hadithCatalog";

export type WasilReply = {
  kind: "answer" | "unsupported-religious" | "out-of-scope";
  title: string;
  body: string;
  reference?: string;
  sourceUrl?: string;
  sourceId?: string;
  quranReferences?: Array<{
    surah: number;
    verseStart: number;
    verseEnd?: number | null;
  }>;
  hadithReferences?: Array<{
    id?: string | null;
    collection: string;
    reference: string;
    title: string;
    grade?: string | null;
    searchQuery: string;
  }>;
  webReferences?: Array<{
    title: string;
    url: string;
  }>;
  action?: {
    label: string;
    route: string;
  };
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function includesOneOf(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(term));
}

function duaReply(
  key: string,
  title: string,
  introduction: string,
): WasilReply {
  const dua = OFFICIAL_FRENCH_DUAS[key];

  return {
    kind: "answer",
    title,
    body: dua
      ? `${introduction}\n\n${dua.french}`
      : "Cette invocation est disponible dans le répertoire Dou‘ā d’OUMMAH.",
    reference: "Traduction vérifiée · La Citadelle du musulman",
    sourceId: `dua:${key}`,
    sourceUrl: dua?.sourceUrl,
    action: {
      label: "Ouvrir les dou‘as",
      route: "/dua",
    },
  };
}

function hadithReply(id: string): WasilReply {
  const hadith = HADITH_CATALOG.find((entry) => entry.id === id);

  if (!hadith) {
    return {
      kind: "unsupported-religious",
      title: "Réponse bientôt disponible",
      body: "Je préfère ne pas formuler de réponse sans référence vérifiée. Cette question sera ajoutée à mon répertoire sourcé.",
    };
  }

  return {
    kind: "answer",
    title: hadith.title,
    body: `${hadith.text}\n\n${hadith.lesson}`,
    reference: hadith.source,
    sourceId: `hadith:${hadith.id}`,
    action: {
      label: "Ouvrir les hadiths",
      route: "/hadith",
    },
  };
}

const RELIGIOUS_TERMS = [
  "allah",
  "islam",
  "musulman",
  "musulmane",
  "coran",
  "quran",
  "verset",
  "sourate",
  "hadith",
  "doua",
  "dua",
  "invocation",
  "priere",
  "salat",
  "salah",
  "ablution",
  "wudu",
  "woudou",
  "dhikr",
  "istighfar",
  "ramadan",
  "zakat",
  "jeune",
  "mosquee",
  "qibla",
  "hajj",
  "omra",
  "halal",
  "haram",
  "imam",
  "rakat",
  "spirituel",
];

export function getWasilLocalReply(prompt: string): WasilReply {
  const question = normalize(prompt);

  if (includesOneOf(question, ["apres les ablutions", "apres ablution"])) {
    return duaReply(
      "7:1",
      "Invocation après les ablutions",
      "Après les ablutions, vous pouvez dire :",
    );
  }

  if (includesOneOf(question, ["ablution", "wudu", "woudou"])) {
    return {
      kind: "answer",
      title: "Les ablutions",
      body: "Le Coran mentionne de laver le visage et les mains jusqu’aux coudes, de passer les mains mouillées sur la tête, puis de laver les pieds jusqu’aux chevilles. Les détails de certaines situations peuvent varier selon les écoles juridiques ; pour un cas personnel précis, demandez conseil à une personne compétente de votre référence.",
      reference: "Coran 5:6 · Sahih Muslim n°223",
      sourceId: "guide:ablutions",
      action: {
        label: "Voir les dou‘as des ablutions",
        route: "/dua",
      },
    };
  }

  if (
    includesOneOf(question, [
      "comment prier",
      "faire la priere",
      "faire salat",
      "faire salah",
      "preparer ma priere",
      "preparer a la priere",
    ])
  ) {
    return {
      kind: "answer",
      title: "Commencer la prière",
      body: "Vérifiez l’entrée de l’heure, accomplissez les ablutions si nécessaire, orientez-vous vers la Qibla et formulez l’intention intérieure. La prière suit ensuite ses gestes et récitations connus. Les détails peuvent varier selon les écoles juridiques : Wasil ne tranche pas entre les avis reconnus.",
      reference: "Coran 4:103 · Sahih al-Bukhari n°631",
      sourceId: "guide:prayer-preparation",
      action: {
        label: "Ouvrir la Qibla",
        route: "/qibla",
      },
    };
  }

  if (
    includesOneOf(question, ["explique-moi ce verset", "expliquer un verset"])
  ) {
    return {
      kind: "unsupported-religious",
      title: "Quel verset souhaitez-vous étudier ?",
      body: "Indiquez la référence sous la forme sourate:verset, par exemple 2:255. L’explication détaillée sera ajoutée lorsque le tafsir vérifié sera relié à Wasil.",
      action: {
        label: "Ouvrir le Coran",
        route: "/quran",
      },
    };
  }

  if (
    includesOneOf(question, ["organiser ma journee", "journee spirituelle"])
  ) {
    return {
      kind: "answer",
      title: "Votre journée spirituelle",
      body: "Votre programme est déjà préparé dans Objectifs du jour. Wasil peut vous y conduire sans utiliser de crédit.",
      action: {
        label: "Ouvrir mes objectifs",
        route: "/daily-goals",
      },
    };
  }

  if (
    includesOneOf(question, [
      "voyage",
      "voyager",
      "transport",
      "avion",
      "train",
    ])
  ) {
    return duaReply(
      "95:1",
      "Invocation du voyage",
      "En montant dans un moyen de transport, vous pouvez dire :",
    );
  }

  if (includesOneOf(question, ["manger", "repas", "nourriture", "mange"])) {
    return duaReply(
      "69:1",
      "Invocation avant de manger",
      "Avant de manger, vous pouvez dire :",
    );
  }

  if (includesOneOf(question, ["matin", "adhkar du matin"])) {
    return duaReply(
      "1:3",
      "Dhikr du matin",
      "Parmi les invocations du matin disponibles dans OUMMAH :",
    );
  }

  if (
    includesOneOf(question, [
      "maison",
      "sortir de chez moi",
      "sortir de la maison",
    ])
  ) {
    return duaReply(
      "8:1",
      "Invocation en sortant de chez soi",
      "En sortant de chez vous, vous pouvez dire :",
    );
  }

  if (includesOneOf(question, ["intention", "niyya", "niyyah"])) {
    return hadithReply("intentions-bukhari-1-muslim-1907");
  }

  if (includesOneOf(question, ["hadith du jour", "regularite", "régularité"])) {
    return hadithReply("regular-deeds-bukhari-6464-muslim-783");
  }

  if (includesOneOf(question, RELIGIOUS_TERMS)) {
    return {
      kind: "unsupported-religious",
      title: "Réponse à compléter",
      body: "Cette première version de Wasil ne couvre pas encore cette question avec suffisamment de sources vérifiées. Je préfère vous le dire plutôt que de risquer une réponse imprécise.",
      action:
        question.includes("coran") || question.includes("verset")
          ? { label: "Ouvrir le Coran", route: "/quran" }
          : question.includes("hadith")
            ? { label: "Ouvrir les hadiths", route: "/hadith" }
            : question.includes("doua") || question.includes("invocation")
              ? { label: "Ouvrir les dou‘as", route: "/dua" }
              : undefined,
    };
  }

  return {
    kind: "out-of-scope",
    title: "Wasil est dédié à l’islam",
    body: "Je peux vous accompagner sur les questions religieuses et les contenus d’OUMMAH : Coran, hadiths, dou‘as, prière, Qibla et apprentissage.",
  };
}
