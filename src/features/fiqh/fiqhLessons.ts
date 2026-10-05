import type { LanguageCode } from "../../i18n";
import { localizeSource } from "./fiqhLocalization";
import { sourceById } from "./fiqhSources";
import type { FiqhLesson, FiqhTopic } from "./fiqhTypes";

/** Reading text of a topic; a topic without a written lesson shows its summary. */
export function lessonOf(topic: FiqhTopic): FiqhLesson {
  return topic.lesson ?? { short: topic.summary, rules: [] };
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
export function sourceShortLabel(id: string, language: LanguageCode = "fr") {
  const quran = /^quran-(\d+)-(\d+)$/.exec(id);
  if (quran) return `${language === "fr" ? "Coran" : "Quran"} ${quran[1]}:${quran[2]}`;
  for (const [pattern, name] of COLLECTIONS) {
    const match = pattern.exec(id);
    if (match) return `${name} ${match[1].replace(/-/g, "–")}`;
  }
  for (const [pattern, name] of BOOK_LABELS) if (pattern.test(id)) return name;
  const found = sourceById.get(id);
  const source = found && localizeSource(found, language);
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
