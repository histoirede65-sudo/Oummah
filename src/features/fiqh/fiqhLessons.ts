import { EDITORIAL_META } from "./fiqhData";
import { sourceById } from "./fiqhSources";
import type { FiqhLesson, FiqhPoint, FiqhTopic } from "./fiqhTypes";

const GENERIC = new Set(
  Object.values(EDITORIAL_META).flatMap((meta) => [...meta.practice, ...meta.lessons, ...meta.mistakes, ...meta.limits, meta.personal ?? ""]),
);
GENERIC.add("Lorsqu’un point n’est pas documenté dans les sources affichées, OUMMAH ne le présente pas comme établi.");

const GENERATED_QUESTION = /-(essential|practice|limits)$/;

function uniquePoints(points: FiqhPoint[]) {
  const seen = new Set<string>();
  return points.filter((point) => {
    const key = point.text.trim();
    if (!key || seen.has(key) || GENERIC.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Reading version of a topic. Hand-written lessons win; otherwise the documented content is cleaned of generic filler. */
export function lessonOf(topic: FiqhTopic): FiqhLesson {
  if (topic.lesson) return topic.lesson;
  const content = topic.content ?? {};
  // Evidence lines are often short captions (« Membres mentionnés dans le verset. ») : keep only full sentences.
  const rules = uniquePoints([
    ...(content.ceQuiEstEtabli ?? []).map((claim) => ({ text: claim.text, ids: claim.evidenceIds })),
    ...(topic.evidence ?? []).filter((claim) => claim.text.length > 45).map((claim) => ({ text: claim.text, ids: claim.evidenceIds })),
  ]);
  const ruleTexts = new Set(rules.map((point) => point.text));
  const steps = uniquePoints((content.pratique ?? []).map((claim) => ({ text: claim.text, ids: claim.evidenceIds }))).filter((point) => !ruleTexts.has(point.text));
  const cases = (content.questions ?? [])
    .filter((question) => !GENERATED_QUESTION.test(question.id))
    .map((question) => ({ q: question.question, a: question.answer.map((claim) => claim.text).join(" "), ids: Array.from(new Set(question.answer.flatMap((claim) => claim.evidenceIds))) }));
  const avoid = (topic.commonMistakes ?? []).filter((text) => !GENERIC.has(text));
  const note = [...(content.limites ?? []), ...(content.divergences ?? []).map((claim) => claim.text)].filter((text) => !GENERIC.has(text));
  const intro = content.introduction?.split(" Cette leçon « ")[0];
  const short = topic.summary && !topic.summary.endsWith("à partir des preuves affichées.") ? topic.summary : intro ?? topic.title;
  return { short, rules, steps, cases, avoid, note: note.slice(0, 3) };
}

/** Every source id cited by the lesson, in reading order, followed by the topic's other references. */
export function lessonSourceIds(topic: FiqhTopic, lesson: FiqhLesson) {
  const ids = [
    ...lesson.rules.flatMap((point) => point.ids ?? []),
    ...(lesson.steps ?? []).flatMap((point) => point.ids ?? []),
    ...(lesson.cases ?? []).flatMap((item) => item.ids ?? []),
    ...(lesson.sourceIds ?? []),
    ...topic.differences.flatMap((difference) => difference.positions.flatMap((position) => position.sourceIds)),
    ...topic.sourceIds,
  ];
  return Array.from(new Set(ids)).filter((id) => sourceById.has(id));
}

const BOOK_LABELS: [RegExp, string][] = [
  [/^wajiz-/, "Al-Wajîz"],
  [/^fiqh-mughni-/, "Al-Mughnî"],
  [/^fiqh-majmu-/, "Al-Majmû‘"],
  [/^fiqh-badai-/, "Badâ’i‘ as-Sanâ’i‘"],
  [/^fiqh-mawahib-/, "Mawâhib al-Jalîl"],
  [/^fiqh-dusuqi-/, "Hâshiyat ad-Dusûqî"],
  [/^fiqh-zurqani-/, "Sharh az-Zurqânî"],
  [/^fiqh-dhakhira-/, "Adh-Dhakhîra"],
  [/^fiqh-istidhkar-/, "Al-Istidhkâr"],
  [/^fiqh-mudawwana-/, "Al-Mudawwana"],
  [/^fiqh-maliki-/, "Hâshiyat as-Sâwî"],
  [/^(binbaz|scholar-ibn-baz)-/, "Ibn Bâz"],
];

const COLLECTIONS: [RegExp, string][] = [
  [/^bukhari-(.+)$/, "Bukhârî"],
  [/^muslim-(.+)$/, "Muslim"],
  [/^abudawud-(.+)$/, "Abû Dâwûd"],
  [/^tirmidhi-(.+)$/, "Tirmidhî"],
  [/^nasai-(.+)$/, "Nasâ’î"],
  [/^ibnmajah-(.+)$/, "Ibn Mâjah"],
];

/** Short label of a source for inline chips: « Coran 5:6 », « Bukhârî 159 », « Al-Wajîz ». */
export function sourceShortLabel(id: string) {
  const quran = /^quran-(\d+)-(\d+)$/.exec(id);
  if (quran) return `Coran ${quran[1]}:${quran[2]}`;
  for (const [pattern, name] of COLLECTIONS) {
    const match = pattern.exec(id);
    if (match) return `${name} ${match[1].replace(/-/g, "–")}`;
  }
  for (const [pattern, name] of BOOK_LABELS) if (pattern.test(id)) return name;
  const source = sourceById.get(id);
  return source?.author ?? source?.reference.split(/[,—]/)[0] ?? id;
}

const SUNNAH_COLLECTIONS: Record<string, string> = { bukhari: "bukhari", muslim: "muslim", abudawud: "abudawud", tirmidhi: "tirmidhi", nasai: "nasai", ibnmajah: "ibnmajah" };

/** Page of the hadith on sunnah.com (same numbering), to read the full text with its Arabic. */
export function sunnahUrl(id: string) {
  const match = /^(bukhari|muslim|abudawud|tirmidhi|nasai|ibnmajah)-(\d+)([a-z]*)/.exec(id);
  if (!match || sourceById.get(id)?.kind !== "hadith") return null;
  return `https://sunnah.com/${SUNNAH_COLLECTIONS[match[1]]}:${match[2]}${match[3]}`;
}

/** In-app destination of a source when OUMMAH can open it (verse or linked hadith). */
export function sourceRoute(id: string) {
  const source = sourceById.get(id);
  if (!source) return null;
  if (source.target?.type === "hadith" && source.target.hadithId.trim()) return `/hadith/${encodeURIComponent(source.target.hadithId.trim())}`;
  const match = /^quran-(\d+)-(\d+)$/.exec(id);
  return match ? `/surah/${match[1]}?verse=${match[2]}` : null;
}
