import { SURAHS } from "../../data/surahs";

export type WasilFreeAction = {
  kind: "navigation";
  href: string;
  reciterId?: string;
};

export type WasilReciterOption = {
  id: string;
  name: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

const MODULES: ReadonlyArray<{ terms: string[]; href: string }> = [
  { terms: ["coran", "quran"], href: "/quran" },
  { terms: ["qibla"], href: "/qibla" },
  { terms: ["hadith", "hadiths"], href: "/hadith" },
  {
    terms: ["doua", "dou a", "dua", "du a", "invocation", "invocations"],
    href: "/dua",
  },
  { terms: ["dhikr", "tasbih"], href: "/dhikr" },
  { terms: ["objectif", "objectifs"], href: "/daily-goals" },
  { terms: ["calendrier"], href: "/calendar" },
  { terms: ["mosquee", "mosquees"], href: "/mosques" },
  { terms: ["memorisation", "hifz"], href: "/hifz" },
  { terms: ["recitateur", "recitateurs"], href: "/listen/reciters" },
  { terms: ["profil", "mon compte"], href: "/profile" },
];

const ACTION_TERMS = [
  "ouvre",
  "ouvrir",
  "affiche",
  "montre",
  "va sur",
  "emmene moi",
  "lance",
  "ecoute",
  "ecouter",
  "joue",
  "lis",
  "lire",
  "change",
  "changer",
  "mets",
  "mettre",
  "selectionne",
  "selectionner",
];

const LISTEN_TERMS = ["lance", "ecoute", "ecouter", "joue", "recitation"];

const RECITER_ALIAS_GROUPS: ReadonlyArray<{
  reciterTerms: string[];
  userTerms: string[];
}> = [
  {
    reciterTerms: ["mishary", "afasy", "alafasi"],
    userTerms: [
      "mishary",
      "mishari",
      "afasy",
      "al afasy",
      "alafasy",
      "alafasi",
    ],
  },
  {
    reciterTerms: ["abdul basit", "abdulbasit"],
    userTerms: ["abdul basit", "abdel basit", "abdulbasit", "abdelbasit"],
  },
  {
    reciterTerms: ["maher", "muaiqly", "muaiqli"],
    userTerms: ["maher", "muaiqly", "muaiqli", "al muaiqly", "al muaiqli"],
  },
  {
    reciterTerms: ["saad", "ghamdi"],
    userTerms: ["saad al ghamdi", "saad ghamdi", "al ghamdi", "ghamdi"],
  },
  {
    reciterTerms: ["yasser", "dosari", "dossari"],
    userTerms: [
      "yasser",
      "yaser",
      "dosari",
      "dossari",
      "al dosari",
      "al dossari",
    ],
  },
  {
    reciterTerms: ["minshawi", "menshawi"],
    userTerms: ["minshawi", "menshawi", "al minshawi", "al menshawi"],
  },
  {
    reciterTerms: ["husary", "hussary"],
    userTerms: ["husary", "hussary", "al husary", "al hussary"],
  },
  {
    reciterTerms: ["sudais"],
    userTerms: ["sudais", "soudais", "al sudais", "as sudais"],
  },
  {
    reciterTerms: ["shuraim"],
    userTerms: ["shuraim", "chouraim", "ash shuraim"],
  },
  {
    reciterTerms: ["ali jaber", "ali jabir"],
    userTerms: ["ali jaber", "ali jabir"],
  },
  {
    reciterTerms: ["abu bakr", "shatri"],
    userTerms: ["abu bakr", "abou bakr", "shatri", "al shatri", "ash shatri"],
  },
  {
    reciterTerms: ["ajmi"],
    userTerms: ["ajmi", "al ajmi"],
  },
  {
    reciterTerms: ["rifai"],
    userTerms: ["rifai", "ar rifai", "al rifai"],
  },
  {
    reciterTerms: ["balila"],
    userTerms: ["balila", "bandar balila"],
  },
  {
    reciterTerms: ["hudhaify", "hudaifi", "houdaifi"],
    userTerms: ["hudhaify", "hudaifi", "houdaifi", "al hudhaify"],
  },
];

function containsTerm(value: string, term: string) {
  const normalizedTerm = normalize(term);
  return (
    ` ${value} `.includes(` ${normalizedTerm} `) ||
    compact(value).includes(compact(normalizedTerm))
  );
}

/**
 * Détecte un terme uniquement lorsqu'il correspond à un ou plusieurs mots
 * complets. Cette variante stricte est réservée aux commandes de navigation :
 * elle empêche par exemple « lIslam » d'être interprété comme « lis ».
 */
function containsStandaloneTerm(value: string, term: string) {
  const normalizedValue = normalize(value).replace(/-/g, " ");
  const normalizedTerm = normalize(term).replace(/-/g, " ");
  return ` ${normalizedValue} `.includes(` ${normalizedTerm} `);
}

const DOCUMENTARY_QUESTION_STARTERS = [
  "que dit",
  "qu est ce",
  "qu est-ce",
  "pourquoi",
  "comment",
  "quel",
  "quelle",
  "quels",
  "quelles",
  "selon",
];

function isDocumentaryQuestion(value: string) {
  const normalizedValue = normalize(value);
  return DOCUMENTARY_QUESTION_STARTERS.some(
    (starter) =>
      normalizedValue === normalize(starter) ||
      normalizedValue.startsWith(`${normalize(starter)} `),
  );
}

function findReciter(
  question: string,
  reciters: readonly WasilReciterOption[],
) {
  const normalizedQuestion = normalize(question);
  const compactQuestion = compact(question);

  const fullNameMatch = [...reciters]
    .sort(
      (left, right) => compact(right.name).length - compact(left.name).length,
    )
    .find((reciter) => {
      const normalizedName = normalize(reciter.name);
      const compactName = compact(reciter.name);
      return (
        normalizedName.length >= 4 &&
        (normalizedQuestion.includes(normalizedName) ||
          compactQuestion.includes(compactName))
      );
    });
  if (fullNameMatch) return fullNameMatch;

  for (const group of RECITER_ALIAS_GROUPS) {
    if (!group.userTerms.some((term) => containsTerm(normalizedQuestion, term)))
      continue;
    const matchingReciter = reciters.find((reciter) => {
      const normalizedName = normalize(reciter.name);
      return group.reciterTerms.some((term) =>
        containsTerm(normalizedName, term),
      );
    });
    if (matchingReciter) return matchingReciter;
  }

  return null;
}

function findSurah(question: string) {
  const numbered = question.match(/(?:sourate|surah)\s+(\d{1,3})\b/);
  if (numbered) {
    const id = Number(numbered[1]);
    if (id >= 1 && id <= 114) return SURAHS[id - 1];
  }

  const compactQuestion = compact(question);
  return [...SURAHS]
    .sort(
      (left, right) =>
        compact(right.transliteration).length -
        compact(left.transliteration).length,
    )
    .find((surah) => {
      const aliases = [
        compact(surah.transliteration),
        compact(surah.frenchName),
        compact(
          surah.transliteration.replace(/^(al|an|ar|as|at|ash|az)-?/i, ""),
        ),
      ].filter((alias) => alias.length >= 3);
      return aliases.some((alias) => compactQuestion.includes(alias));
    });
}

export function resolveWasilFreeAction(
  rawQuestion: string,
  reciters: readonly WasilReciterOption[] = [],
): WasilFreeAction | null {
  const question = normalize(rawQuestion);

  // Une question documentaire doit toujours être envoyée à Wasil, même si elle
  // contient les mots « Coran », « lire », etc. Seule une commande explicite
  // peut être transformée localement en navigation.
  if (isDocumentaryQuestion(question)) return null;
  if (!ACTION_TERMS.some((term) => containsStandaloneTerm(question, term))) {
    return null;
  }

  const surah = findSurah(question);
  const reciter = findReciter(question, reciters);
  if (surah) {
    const shouldListen = LISTEN_TERMS.some((term) =>
      containsStandaloneTerm(question, term),
    );
    return {
      kind: "navigation",
      href:
        shouldListen || reciter
          ? `/listen/${surah.id}?${reciter ? `reciterId=${encodeURIComponent(reciter.id)}&` : ""}autoplay=1`
          : `/surah/${surah.id}`,
      reciterId: reciter?.id,
    };
  }

  if (reciter) {
    return {
      kind: "navigation",
      href: `/listen/reciter/${encodeURIComponent(reciter.id)}`,
      reciterId: reciter.id,
    };
  }

  const module = MODULES.find((candidate) =>
    candidate.terms.some((term) => containsStandaloneTerm(question, term)),
  );
  return module ? { kind: "navigation", href: module.href } : null;
}
