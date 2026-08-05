import { buildHadithSearchTerms, buildQuranSearchTerms, extractSalientTerms, normalizeIntentText } from "./UniversalIntent.ts";

export type IslamicQueryExpansion = {
  isIslamicEntity: boolean;
  entityType:
    | "prophet"
    | "companion"
    | "quranic_person"
    | "place"
    | "concept"
    | "event"
    | "unknown";
  canonicalName: string;
  arabicName: string;
  aliases: string[];
  quranSearchTerms: string[];
  hadithSearchTerms: string[];
  evidenceTerms: string[];
  relatedTerms: string[];
  directEvidenceDescription: string;
};


const PROPHET_BIOGRAPHY_EXPANSIONS: Array<{
  canonicalName: string;
  arabicName: string;
  aliases: string[];
  searchTerms: string[];
}> = [
  { canonicalName: "Âdam", arabicName: "آدم", aliases: ["adam", "âdam"], searchTerms: ["Adam", "آدم"] },
  { canonicalName: "Idrîs", arabicName: "إدريس", aliases: ["idris", "idriss", "idrîs"], searchTerms: ["Idris", "إدريس"] },
  { canonicalName: "Nûh", arabicName: "نوح", aliases: ["nouh", "nuh", "noe", "noé"], searchTerms: ["Nuh", "Noé", "نوح"] },
  { canonicalName: "Hûd", arabicName: "هود", aliases: ["houd", "hud", "hûd"], searchTerms: ["Hud", "هود"] },
  { canonicalName: "Sâlih", arabicName: "صالح", aliases: ["salih", "saleh", "sâlih"], searchTerms: ["Salih", "صالح"] },
  { canonicalName: "Ibrâhîm", arabicName: "إبراهيم", aliases: ["ibrahim", "ibrâhîm", "abraham"], searchTerms: ["Ibrahim", "Abraham", "إبراهيم"] },
  { canonicalName: "Lût", arabicName: "لوط", aliases: ["lout", "lut", "loth", "lût"], searchTerms: ["Lut", "Loth", "لوط"] },
  { canonicalName: "Ismâ‘îl", arabicName: "إسماعيل", aliases: ["ismail", "ismael", "ismaël", "ismâ‘îl"], searchTerms: ["Ismail", "Ismaël", "إسماعيل"] },
  { canonicalName: "Ishâq", arabicName: "إسحاق", aliases: ["ishaq", "ishak", "isaac", "ishâq"], searchTerms: ["Ishaq", "Isaac", "إسحاق"] },
  { canonicalName: "Ya‘qûb", arabicName: "يعقوب", aliases: ["yaqub", "yacoub", "jacob", "ya‘qûb"], searchTerms: ["Yaqub", "Jacob", "يعقوب"] },
  { canonicalName: "Yûsuf", arabicName: "يوسف", aliases: ["yusuf", "youssouf", "joseph", "yûsuf"], searchTerms: ["Yusuf", "Joseph", "يوسف"] },
  { canonicalName: "Shu‘ayb", arabicName: "شعيب", aliases: ["chouayb", "shuayb", "shuaib"], searchTerms: ["Shuayb", "شعيب"] },
  { canonicalName: "Ayyûb", arabicName: "أيوب", aliases: ["ayoub", "ayyub", "job", "ayyûb"], searchTerms: ["Ayyub", "Job", "أيوب"] },
  { canonicalName: "Dhûl-Kifl", arabicName: "ذو الكفل", aliases: ["dhu al kifl", "dhul kifl", "doul kifl"], searchTerms: ["Dhul-Kifl", "ذو الكفل"] },
  { canonicalName: "Mûsâ", arabicName: "موسى", aliases: ["moussa", "musa", "moise", "moïse", "mûsâ"], searchTerms: ["Musa", "Moïse", "موسى"] },
  { canonicalName: "Hârûn", arabicName: "هارون", aliases: ["haroun", "harun", "aaron", "hârûn"], searchTerms: ["Harun", "Aaron", "هارون"] },
  { canonicalName: "Dâwûd", arabicName: "داود", aliases: ["daoud", "dawud", "david", "dâwûd"], searchTerms: ["Dawud", "David", "داود"] },
  { canonicalName: "Sulaymân", arabicName: "سليمان", aliases: ["souleymane", "souleiman", "suleyman", "sulayman", "salomon"], searchTerms: ["Sulayman", "Salomon", "سليمان"] },
  { canonicalName: "Ilyâs", arabicName: "إلياس", aliases: ["ilyas", "elias", "élie", "ilyâs"], searchTerms: ["Ilyas", "Élie", "إلياس"] },
  { canonicalName: "Al-Yasa‘", arabicName: "اليسع", aliases: ["alyasa", "al yasa", "elisee", "élisée"], searchTerms: ["Al-Yasa", "Élisée", "اليسع"] },
  { canonicalName: "Yûnus", arabicName: "يونس", aliases: ["younes", "younous", "yunus", "jonas", "yûnus"], searchTerms: ["Yunus", "Jonas", "يونس"] },
  { canonicalName: "Zakariyyâ", arabicName: "زكريا", aliases: ["zakaria", "zakariya", "zakariyya", "zacharie"], searchTerms: ["Zakariya", "Zacharie", "زكريا"] },
  { canonicalName: "Yahyâ", arabicName: "يحيى", aliases: ["yahya", "yahia", "jean baptiste", "jean-baptiste"], searchTerms: ["Yahya", "Jean-Baptiste", "يحيى"] },
  { canonicalName: "‘Îsâ", arabicName: "عيسى", aliases: ["issa", "isa", "jesus", "jésus", "‘îsâ"], searchTerms: ["Isa", "Jésus", "عيسى"] },
  { canonicalName: "Muhammad ﷺ", arabicName: "محمد", aliases: ["muhammad", "mohammed", "mohamed", "prophete muhammad", "prophète muhammad"], searchTerms: ["Muhammad", "محمد"] },
];

function normalizeProphetLookup(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildProphetBiographyExpansion(
  question: string,
): IslamicQueryExpansion | null {
  const normalized = normalizeProphetLookup(question);
  const prophet = PROPHET_BIOGRAPHY_EXPANSIONS.find((entry) =>
    entry.aliases.some((alias) => {
      const normalizedAlias = normalizeProphetLookup(alias);
      return new RegExp(`(?:^|\\s)${normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`).test(normalized);
    })
  );
  if (!prophet) return null;

  const cleanTerms = uniqueTerms([
    prophet.canonicalName,
    ...prophet.searchTerms,
    ...prophet.aliases.slice(0, 3),
    `prophète ${prophet.canonicalName}`,
    `histoire de ${prophet.canonicalName}`,
  ], 8);

  const expansion: IslamicQueryExpansion = {
    isIslamicEntity: true,
    entityType: "prophet",
    canonicalName: prophet.canonicalName,
    arabicName: prophet.arabicName,
    aliases: uniqueTerms(prophet.aliases, 8),
    quranSearchTerms: cleanTerms,
    hadithSearchTerms: cleanTerms,
    evidenceTerms: uniqueTerms([prophet.canonicalName, ...prophet.searchTerms], 6),
    relatedTerms: [],
    directEvidenceDescription:
      `Passages qui racontent directement l’histoire du prophète ${prophet.canonicalName}.`,
  };

  console.log("WASIL_ISLAMIC_QUERY_EXPANSION", {
    canonicalName: expansion.canonicalName,
    entityType: expansion.entityType,
    expansionMode: "deterministic-prophet-biography",
    quranSearchTerms: expansion.quranSearchTerms,
    hadithSearchTerms: expansion.hadithSearchTerms,
    evidenceTerms: expansion.evidenceTerms,
  });

  return expansion;
}


const COMPANION_BIOGRAPHY_EXPANSIONS: Array<{
  canonicalName: string;
  arabicName: string;
  aliases: string[];
}> = [
  { canonicalName: "Abû Bakr as-Siddîq", arabicName: "أبو بكر الصديق", aliases: ["abu bakr", "abou bakr", "abu bakr as siddiq", "abou bakr as siddiq"] },
  { canonicalName: "‘Umar ibn al-Khattâb", arabicName: "عمر بن الخطاب", aliases: ["umar", "omar", "umar ibn al khattab", "omar ibn al khattab"] },
  { canonicalName: "‘Uthmân ibn ‘Affân", arabicName: "عثمان بن عفان", aliases: ["uthman", "othman", "osman", "uthman ibn affan", "othman ibn affan"] },
  { canonicalName: "‘Alî ibn Abî Tâlib", arabicName: "علي بن أبي طالب", aliases: ["ali", "ali ibn abi talib", "ali ibn abou talib"] },
  { canonicalName: "Bilâl ibn Rabâh", arabicName: "بلال بن رباح", aliases: ["bilal", "bilal ibn rabah"] },
  { canonicalName: "Khâlid ibn al-Walîd", arabicName: "خالد بن الوليد", aliases: ["khalid", "khaled", "khalid ibn al walid", "khaled ibn al walid"] },
  { canonicalName: "Salmân al-Fârisî", arabicName: "سلمان الفارسي", aliases: ["salman", "salman al farisi", "salmane al farisi"] },
  { canonicalName: "Abû Hurayra", arabicName: "أبو هريرة", aliases: ["abu hurayra", "abou hourayra", "abu huraira", "abou houreira"] },
  { canonicalName: "‘Â’isha", arabicName: "عائشة", aliases: ["aisha", "aicha", "ayesha"] },
  { canonicalName: "Khadîja", arabicName: "خديجة", aliases: ["khadija", "khadidja"] },
];

export function buildCompanionBiographyExpansion(
  question: string,
  resolvedName?: string | null,
): IslamicQueryExpansion | null {
  const normalizedQuestion = normalizeProphetLookup(`${resolvedName ?? ""} ${question}`);
  const companion = COMPANION_BIOGRAPHY_EXPANSIONS.find((entry) =>
    entry.aliases.some((alias) => {
      const normalizedAlias = normalizeProphetLookup(alias);
      return new RegExp(`(?:^|\\s)${normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`).test(normalizedQuestion);
    })
  );

  const fallbackName = resolvedName?.trim();
  if (!companion && !fallbackName) return null;

  const canonicalName = companion?.canonicalName ?? fallbackName!;
  const arabicName = companion?.arabicName ?? "";
  const aliases = uniqueTerms(companion?.aliases ?? [canonicalName], 8);
  const cleanTerms = uniqueTerms([
    canonicalName,
    arabicName,
    ...aliases,
    `compagnon ${canonicalName}`,
    `biographie ${canonicalName}`,
  ], 8);

  const expansion: IslamicQueryExpansion = {
    isIslamicEntity: true,
    entityType: "companion",
    canonicalName,
    arabicName,
    aliases,
    quranSearchTerms: cleanTerms,
    hadithSearchTerms: cleanTerms,
    evidenceTerms: uniqueTerms([canonicalName, arabicName, ...aliases], 6),
    relatedTerms: [],
    directEvidenceDescription:
      `Sources qui établissent directement la biographie du compagnon ${canonicalName}.`,
  };

  console.log("WASIL_ISLAMIC_QUERY_EXPANSION", {
    canonicalName: expansion.canonicalName,
    entityType: expansion.entityType,
    expansionMode: "deterministic-companion-biography",
    quranSearchTerms: expansion.quranSearchTerms,
    hadithSearchTerms: expansion.hadithSearchTerms,
    evidenceTerms: expansion.evidenceTerms,
  });

  return expansion;
}

type ExpansionPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

type TopicExpansion = {
  id: string;
  canonicalName: string;
  arabicName: string;
  patterns: RegExp[];
  aliases: string[];
  quranSearchTerms: string[];
  hadithSearchTerms?: string[];
  evidenceTerms?: string[];
  relatedTerms?: string[];
  directEvidenceDescription?: string;
};

const TOPIC_EXPANSIONS: TopicExpansion[] = [
  {
    id: "marriage_spousal_rights",
    canonicalName: "Droits et devoirs des époux",
    arabicName: "حقوق الزوجين",
    patterns: [
      /\b(?:droit|droits|devoir|devoirs|responsabilite|responsabilites)\b.*\b(?:epoux|epouse|conjoint|conjointe|mari|femme|couple)\b/u,
      /\b(?:epoux|epouse|conjoint|conjointe|mari|femme|couple)\b.*\b(?:droit|droits|devoir|devoirs|responsabilite|responsabilites)\b/u,
      /\b(?:vie conjugale|relations conjugales|foyer musulman)\b/u,
    ],
    aliases: [
      "mariage",
      "nikah",
      "époux",
      "épouse",
      "droits conjugaux",
      "devoirs conjugaux",
      "vie conjugale",
      "foyer",
    ],
    quranSearchTerms: [
      "الزوجين",
      "الأزواج",
      "بالمعروف",
      "مودة ورحمة",
      "لباس لكم",
      "droits des époux",
      "vie conjugale",
      "bienveillance entre époux",
      "affection et miséricorde",
      "époux",
      "épouse",
      "mariage",
    ],
  },
  {
    id: "marriage_general",
    canonicalName: "Mariage en Islam",
    arabicName: "النكاح",
    patterns: [
      /\b(?:mariage|nikah|nikah|se marier|marier|epoux|epouse|conjoint|conjointe|couple)\b/u,
    ],
    aliases: ["mariage", "nikah", "époux", "épouse", "couple", "foyer"],
    quranSearchTerms: [
      "النكاح",
      "الأزواج",
      "زوج",
      "مودة ورحمة",
      "بالمعروف",
      "mariage",
      "époux",
      "épouse",
      "affection",
      "miséricorde",
    ],
  },
  {
    id: "patience_trials",
    canonicalName: "Patience face aux épreuves",
    arabicName: "الصبر على البلاء",
    patterns: [
      /\b(?:patience|patienter|sabr|epreuve|epreuves|endurance|perseverance)\b/u,
    ],
    aliases: ["patience", "sabr", "épreuve", "endurance", "persévérance"],
    quranSearchTerms: [
      "الصبر",
      "الصابرين",
      "البلاء",
      "patience",
      "patients",
      "épreuve",
      "endurance",
      "persévérance",
      "sabr",
    ],
  },
  {
    id: "faith_increase",
    canonicalName: "Augmenter sa foi",
    arabicName: "زيادة الإيمان",
    patterns: [
      /\b(?:augmenter|renforcer|raffermir|ameliorer)\b.*\b(?:foi|iman)\b/u,
      /\b(?:foi|iman)\b.*\b(?:augmenter|renforcer|raffermir|ameliorer)\b/u,
    ],
    aliases: ["foi", "iman", "augmentation de la foi", "raffermissement"],
    quranSearchTerms: [
      "الإيمان",
      "ازدادوا إيمانا",
      "طمأنينة القلوب",
      "foi",
      "augmentation de la foi",
      "cœurs rassurés",
      "rappel d'Allah",
      "iman",
    ],
  },
  {
    id: "repentance_forgiveness",
    canonicalName: "Repentir et pardon",
    arabicName: "التوبة والمغفرة",
    patterns: [
      /\b(?:repentir|repentance|tawba|tawbah|pardon|pardonner|istighfar|peche|peches)\b/u,
    ],
    aliases: ["repentir", "tawba", "pardon", "istighfar", "péché"],
    quranSearchTerms: [
      "التوبة",
      "المغفرة",
      "استغفروا",
      "repentir",
      "pardon",
      "miséricorde",
      "istighfar",
      "péché",
    ],
  },
  {
    id: "gratitude",
    canonicalName: "Gratitude envers Allah",
    arabicName: "الشكر",
    patterns: [/\b(?:gratitude|reconnaissance|remercier|shukr|choukr)\b/u],
    aliases: ["gratitude", "reconnaissance", "shukr", "remercier Allah"],
    quranSearchTerms: [
      "الشكر",
      "اشكروا",
      "لئن شكرتم",
      "gratitude",
      "reconnaissance",
      "remercier Allah",
      "shukr",
    ],
  },
  {
    id: "prayer",
    canonicalName: "Prière",
    arabicName: "الصلاة",
    patterns: [/\b(?:priere|salat|salah|fajr|dhuhr|dohr|asr|maghrib|isha)\b/u],
    aliases: ["prière", "salat", "salah", "prières obligatoires"],
    quranSearchTerms: [
      "الصلاة",
      "أقيموا الصلاة",
      "حافظوا على الصلوات",
      "prière",
      "salat",
      "prières obligatoires",
    ],
  },
  {
    id: "parents",
    canonicalName: "Bienfaisance envers les parents",
    arabicName: "بر الوالدين",
    patterns: [/\b(?:parents|pere|mere|maman|papa|parental)\b/u],
    aliases: ["parents", "père", "mère", "bienfaisance envers les parents"],
    quranSearchTerms: [
      "الوالدين",
      "بر الوالدين",
      "وبالوالدين إحسانا",
      "parents",
      "père et mère",
      "bienfaisance envers les parents",
    ],
  },
  {
    id: "anxiety_trust",
    canonicalName: "Angoisse et confiance en Allah",
    arabicName: "الطمأنينة والتوكل",
    patterns: [
      /\b(?:angoisse|anxiete|stress|inquietude|peur|tristesse|deprime|depression)\b/u,
      /\b(?:confiance en allah|tawakkul|tawakkol)\b/u,
    ],
    aliases: ["angoisse", "stress", "tristesse", "confiance en Allah", "tawakkul"],
    quranSearchTerms: [
      "التوكل",
      "طمأنينة القلوب",
      "لا تحزن",
      "confiance en Allah",
      "cœurs rassurés",
      "tristesse",
      "angoisse",
      "tawakkul",
    ],
  },
  {
    id: "charity",
    canonicalName: "Aumône et générosité",
    arabicName: "الصدقة والإنفاق",
    patterns: [/\b(?:aumone|charite|sadaqa|sadaqah|don|generosite|depense)\b/u],
    aliases: ["aumône", "sadaqa", "charité", "générosité", "dépense"],
    quranSearchTerms: [
      "الصدقة",
      "الإنفاق",
      "أنفقوا",
      "aumône",
      "charité",
      "générosité",
      "sadaqa",
    ],
  },
];

function normalizeForMatching(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\u0600-\u06ff\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueTerms(values: unknown[], limit = 12) {
  return [...new Set(
    values
      .map((value) => String(value ?? "").trim())
      .filter((value) => value.length >= 2),
  )].slice(0, limit);
}

function extractJson(payload: ExpansionPayload) {
  const direct = payload.output_text?.trim();
  if (direct) return direct;
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text?.trim()) {
        return content.text.trim();
      }
    }
  }
  return "";
}

function findStaticTopicExpansion(question: string): IslamicQueryExpansion | null {
  const normalizedQuestion = normalizeForMatching(question);
  if (!normalizedQuestion) return null;

  const topic = TOPIC_EXPANSIONS.find((candidate) =>
    candidate.patterns.some((pattern) => pattern.test(normalizedQuestion))
  );
  if (!topic) return null;

  return {
    isIslamicEntity: true,
    entityType: "concept",
    canonicalName: topic.canonicalName,
    arabicName: topic.arabicName,
    aliases: uniqueTerms(topic.aliases, 10),
    quranSearchTerms: uniqueTerms([
      ...topic.quranSearchTerms,
      topic.arabicName,
      topic.canonicalName,
      ...topic.aliases,
    ]),
    hadithSearchTerms: uniqueTerms([
      ...(topic.hadithSearchTerms ?? []),
      topic.canonicalName,
      ...topic.aliases,
      ...topic.quranSearchTerms.filter((term) => !/[\u0600-\u06ff]/u.test(term)),
    ]),
    evidenceTerms: uniqueTerms([
      ...(topic.evidenceTerms ?? []),
      topic.canonicalName,
      ...topic.aliases,
    ], 10),
    relatedTerms: uniqueTerms(topic.relatedTerms ?? [], 8),
    directEvidenceDescription:
      topic.directEvidenceDescription?.trim() ||
      `Preuves qui traitent directement de « ${topic.canonicalName} », de sa règle, de ses effets ou de la manière de l'appliquer.`,
  };
}

function looksLikeIslamicRequest(question: string): boolean {
  const normalized = normalizeIntentText(question);
  return /\b(?:allah|islam|musulman|coran|quran|sourate|verset|sunna|sunnah|sounna|hadith|fiqh|halal|haram|dua|doua|priere|salat|zakat|ramadan|hajj|iman|foi)\b/u.test(
    normalized,
  );
}

function buildGenericFallbackExpansion(
  question: string,
): IslamicQueryExpansion | null {
  const salientTerms = extractSalientTerms(question);
  if (!salientTerms.length || !looksLikeIslamicRequest(question)) return null;

  const quranSearchTerms = uniqueTerms(buildQuranSearchTerms(question), 12);
  const hadithSearchTerms = uniqueTerms(buildHadithSearchTerms(question), 12);
  const evidenceTerms = uniqueTerms(salientTerms, 10);
  const canonicalName = evidenceTerms.find((term) => term.includes(" ")) ??
    evidenceTerms[0] ?? "Question islamique";

  return {
    isIslamicEntity: true,
    entityType: "concept",
    canonicalName,
    arabicName: "",
    aliases: uniqueTerms(salientTerms, 10),
    quranSearchTerms,
    hadithSearchTerms,
    evidenceTerms,
    relatedTerms: [],
    directEvidenceDescription:
      `Preuves qui répondent directement à la demande « ${canonicalName} », sans remplacer la cible par un récit, une notion voisine ou son contraire.`,
  };
}

/**
 * The model expansion is authoritative whenever it succeeds. The curated
 * lexicon is only an outage fallback: it may improve resilience, but it must
 * never overwrite a more precise semantic interpretation produced for the
 * actual question.
 */
function chooseExpansion(
  modelExpansion: IslamicQueryExpansion | null,
  staticExpansion: IslamicQueryExpansion | null,
  genericExpansion: IslamicQueryExpansion | null,
): IslamicQueryExpansion | null {
  if (modelExpansion) return modelExpansion;
  if (staticExpansion && genericExpansion) {
    // In outage mode, the user's own wording remains the exact target. The
    // curated lexicon contributes recall terms only and cannot broaden the
    // evidence criterion into a generic theme.
    return {
      ...genericExpansion,
      arabicName: staticExpansion.arabicName,
      quranSearchTerms: uniqueTerms([
        ...genericExpansion.quranSearchTerms,
        ...staticExpansion.quranSearchTerms,
      ], 12),
      hadithSearchTerms: uniqueTerms([
        ...genericExpansion.hadithSearchTerms,
        ...staticExpansion.hadithSearchTerms,
      ], 12),
      relatedTerms: uniqueTerms([
        ...genericExpansion.relatedTerms,
        staticExpansion.canonicalName,
        ...staticExpansion.aliases,
      ], 8),
    };
  }
  return staticExpansion ?? genericExpansion;
}

async function requestModelExpansion(
  question: string,
): Promise<IslamicQueryExpansion | null> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  const model = Deno.env.get("WASIL_MODEL_RETRIEVAL") ??
    Deno.env.get("WASIL_MODEL_STANDARD") ?? "gpt-5.6-luna";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 500);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 420,
        instructions:
          "Tu normalises une requête islamique pour le moteur documentaire de Wasil. Ne réponds jamais à la question. Identifie l'entité ou le thème exact, même si le nom est francisé, translittéré ou mal orthographié. Produis des termes de recherche distincts pour le Coran et les hadiths. evidenceTerms doit contenir uniquement les formulations qui expriment directement la cible demandée (règle, vice, vertu, acte ou situation), et non de simples thèmes voisins ou leur contraire. relatedTerms peut contenir les notions secondaires utiles. directEvidenceDescription décrit en une phrase ce qu'une preuve directement pertinente doit réellement établir. Fournis des variantes françaises, arabes et translittérées lorsque cela aide la recherche. Produis uniquement le JSON demandé et ne demande jamais de clarification.",
        input: question,
        text: {
          format: {
            type: "json_schema",
            name: "islamic_query_expansion",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                isIslamicEntity: { type: "boolean" },
                entityType: {
                  type: "string",
                  enum: [
                    "prophet",
                    "companion",
                    "quranic_person",
                    "place",
                    "concept",
                    "event",
                    "unknown",
                  ],
                },
                canonicalName: { type: "string" },
                arabicName: { type: "string" },
                aliases: {
                  type: "array",
                  items: { type: "string" },
                },
                quranSearchTerms: {
                  type: "array",
                  minItems: 2,
                  maxItems: 12,
                  items: { type: "string" },
                },
                hadithSearchTerms: {
                  type: "array",
                  minItems: 2,
                  maxItems: 12,
                  items: { type: "string" },
                },
                evidenceTerms: {
                  type: "array",
                  minItems: 2,
                  maxItems: 10,
                  items: { type: "string" },
                },
                relatedTerms: {
                  type: "array",
                  maxItems: 8,
                  items: { type: "string" },
                },
                directEvidenceDescription: { type: "string" },
              },
              required: [
                "isIslamicEntity",
                "entityType",
                "canonicalName",
                "arabicName",
                "aliases",
                "quranSearchTerms",
                "hadithSearchTerms",
                "evidenceTerms",
                "relatedTerms",
                "directEvidenceDescription",
              ],
            },
          },
        },
      }),
    });

    if (!response.ok) return null;
    const payload = await response.json() as ExpansionPayload;
    const rawJson = extractJson(payload);
    if (!rawJson) return null;

    const parsed = JSON.parse(rawJson) as IslamicQueryExpansion;
    const aliases = uniqueTerms(parsed.aliases ?? [], 10);
    const quranSearchTerms = uniqueTerms([
      parsed.arabicName,
      parsed.canonicalName,
      ...aliases,
      ...(parsed.quranSearchTerms ?? []),
    ]);
    const hadithSearchTerms = uniqueTerms([
      parsed.canonicalName,
      ...aliases,
      ...(parsed.hadithSearchTerms ?? []),
    ]);
    const evidenceTerms = uniqueTerms([
      ...(parsed.evidenceTerms ?? []),
      parsed.canonicalName,
    ], 10);
    const relatedTerms = uniqueTerms(parsed.relatedTerms ?? [], 8);

    if (
      !parsed.isIslamicEntity ||
      quranSearchTerms.length === 0 ||
      hadithSearchTerms.length === 0 ||
      evidenceTerms.length === 0
    ) return null;
    return {
      ...parsed,
      aliases,
      quranSearchTerms,
      hadithSearchTerms,
      evidenceTerms,
      relatedTerms,
      directEvidenceDescription:
        parsed.directEvidenceDescription?.trim() ||
        `Preuves qui répondent directement à la question sur ${parsed.canonicalName}.`,
    };
  } catch (error) {
    console.warn("WASIL_QUERY_EXPANSION_FAILED", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function expandIslamicQuery(
  question: string,
): Promise<IslamicQueryExpansion | null> {
  const staticExpansion = findStaticTopicExpansion(question);
  const genericExpansion = buildGenericFallbackExpansion(question);
  const modelExpansion = await requestModelExpansion(question);
  const expansion = chooseExpansion(
    modelExpansion,
    staticExpansion,
    genericExpansion,
  );

  if (expansion) {
    console.log("WASIL_ISLAMIC_QUERY_EXPANSION", {
      canonicalName: expansion.canonicalName,
      entityType: expansion.entityType,
      expansionMode: modelExpansion
        ? "semantic-model"
        : staticExpansion && genericExpansion
        ? "curated-plus-generic-fallback"
        : staticExpansion
        ? "curated-fallback"
        : "generic-lexical-fallback",
      quranSearchTerms: expansion.quranSearchTerms,
      hadithSearchTerms: expansion.hadithSearchTerms,
      evidenceTerms: expansion.evidenceTerms,
    });
  }

  return expansion;
}
