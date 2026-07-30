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
};

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
  };
}

function mergeExpansions(
  staticExpansion: IslamicQueryExpansion | null,
  modelExpansion: IslamicQueryExpansion | null,
): IslamicQueryExpansion | null {
  if (!staticExpansion) return modelExpansion;
  if (!modelExpansion) return staticExpansion;

  return {
    isIslamicEntity: true,
    entityType: staticExpansion.entityType,
    canonicalName: staticExpansion.canonicalName,
    arabicName: staticExpansion.arabicName || modelExpansion.arabicName,
    aliases: uniqueTerms([
      ...staticExpansion.aliases,
      ...modelExpansion.aliases,
      modelExpansion.canonicalName,
    ], 10),
    quranSearchTerms: uniqueTerms([
      ...staticExpansion.quranSearchTerms,
      ...modelExpansion.quranSearchTerms,
      modelExpansion.arabicName,
      modelExpansion.canonicalName,
      ...modelExpansion.aliases,
    ]),
  };
}

async function requestModelExpansion(
  question: string,
): Promise<IslamicQueryExpansion | null> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  const model = Deno.env.get("WASIL_MODEL_STANDARD") ?? "gpt-5.6-luna";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

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
        max_output_tokens: 220,
        instructions:
          "Tu normalises une requête islamique pour un moteur de recherche coranique. Ne réponds pas à la question. Identifie l'entité ou le thème religieux visé, même si le nom est biblique, francisé, translittéré ou mal orthographié. Pour un thème général, transforme la demande en concepts documentaires précis et fournis des mots-clés coraniques utiles en arabe, français et translittération. Produis uniquement le JSON demandé. Ne demande jamais de clarification.",
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
                  items: { type: "string" },
                },
              },
              required: [
                "isIslamicEntity",
                "entityType",
                "canonicalName",
                "arabicName",
                "aliases",
                "quranSearchTerms",
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
    const quranSearchTerms = uniqueTerms([
      parsed.arabicName,
      parsed.canonicalName,
      ...(parsed.aliases ?? []),
      ...(parsed.quranSearchTerms ?? []),
    ]);

    if (!parsed.isIslamicEntity || quranSearchTerms.length === 0) return null;
    return {
      ...parsed,
      aliases: uniqueTerms(parsed.aliases ?? [], 10),
      quranSearchTerms,
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
  const modelExpansion = await requestModelExpansion(question);
  const expansion = mergeExpansions(staticExpansion, modelExpansion);

  if (expansion) {
    console.log("WASIL_ISLAMIC_QUERY_EXPANSION", {
      canonicalName: expansion.canonicalName,
      entityType: expansion.entityType,
      usedStaticTopic: Boolean(staticExpansion),
      quranSearchTerms: expansion.quranSearchTerms,
    });
  }

  return expansion;
}
