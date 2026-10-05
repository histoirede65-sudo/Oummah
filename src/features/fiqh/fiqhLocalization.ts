import type { LanguageCode } from "../../i18n";
import { FIQH_BOOK_INTROS } from "./fiqhBooks";
import { categoryById, chapterById, topicById } from "./fiqhData";
import { FIQH_EN } from "./fiqhEnglish";
import type { FiqhCategory, FiqhChapter, FiqhPosition, FiqhSource, FiqhTopic } from "./fiqhTypes";

// The Fiqh content is written in French. In English, each displayed text is replaced by its line in
// FIQH_EN (same path as in the French data); a missing line keeps the French text.

const SCHOOLS_EN: Record<FiqhPosition["label"], string> = {
  Hanafite: "Hanafi",
  Malikite: "Maliki",
  "Shafi‘ite": "Shafi‘i",
  Hanbalite: "Hanbali",
  "Avis documenté": "Documented view",
};

const AUTHENTICITY_EN: Record<string, string> = {
  "Sahîh": "Sahîh",
  "Sahîh selon al-Albânî": "Sahîh according to al-Albânî",
  "Hasan sahîh selon al-Albânî": "Hasan sahîh according to al-Albânî",
  "Hasan selon al-Albânî": "Hasan according to al-Albânî",
};

function en(key: string, french: string): string;
function en(key: string, french: string | undefined): string | undefined;
function en(key: string, french: string | undefined) {
  return french === undefined ? undefined : FIQH_EN[key] ?? french;
}

const topics = new Map<string, FiqhTopic>();
const sources = new Map<string, FiqhSource>();

function englishTopic(topic: FiqhTopic): FiqhTopic {
  const k = `topic.${topic.id}`;
  const lesson = topic.lesson;
  return {
    ...topic,
    title: en(`${k}.title`, topic.title),
    summary: lesson ? topic.summary : en(`${k}.summary`, topic.summary),
    link: topic.link ? { ...topic.link, label: en(`${k}.link`, topic.link.label) } : undefined,
    differences: topic.differences.map((difference, i) => ({
      ...difference,
      question: en(`${k}.diff.${i}.question`, difference.question),
      established: en(`${k}.diff.${i}.established`, difference.established),
      practicalNote: en(`${k}.diff.${i}.practicalNote`, difference.practicalNote),
      positions: difference.positions.map((position, j) => ({
        ...position,
        label: (SCHOOLS_EN[position.label] ?? position.label) as FiqhPosition["label"],
        position: en(`${k}.diff.${i}.pos.${j}.position`, position.position),
        consequence: en(`${k}.diff.${i}.pos.${j}.consequence`, position.consequence),
      })),
    })),
    lesson: lesson && {
      ...lesson,
      short: en(`${k}.short`, lesson.short),
      rules: lesson.rules.map((point, i) => ({ ...point, text: en(`${k}.rules.${i}`, point.text) })),
      steps: lesson.steps?.map((point, i) => ({ ...point, text: en(`${k}.steps.${i}`, point.text) })),
      cases: lesson.cases?.map((item, i) => ({ ...item, q: en(`${k}.cases.${i}.q`, item.q), a: en(`${k}.cases.${i}.a`, item.a) })),
      avoid: lesson.avoid?.map((text, i) => en(`${k}.avoid.${i}`, text)),
      note: lesson.note?.map((text, i) => en(`${k}.note.${i}`, text)),
    },
  };
}

/** The topic in the reading language (built once per topic in English). */
export function localizeTopic(topic: FiqhTopic, language: LanguageCode): FiqhTopic {
  if (language === "fr") return topic;
  let value = topics.get(topic.id);
  if (!value) {
    value = englishTopic(topic);
    topics.set(topic.id, value);
  }
  return value;
}

export function topicIn(id: string | undefined, language: LanguageCode) {
  const topic = id ? topicById.get(id) : undefined;
  return topic ? localizeTopic(topic, language) : undefined;
}

export function localizeCategory(category: FiqhCategory, language: LanguageCode): FiqhCategory {
  if (language === "fr") return category;
  return {
    ...category,
    title: en(`cat.${category.id}.title`, category.title),
    summary: en(`cat.${category.id}.summary`, category.summary),
    chapters: category.chapters?.map((chapter) => localizeChapter(chapter, language)),
  };
}

export function categoryIn(id: string | undefined, language: LanguageCode) {
  const category = id ? categoryById.get(id) : undefined;
  return category ? localizeCategory(category, language) : undefined;
}

export function localizeChapter(chapter: FiqhChapter, language: LanguageCode): FiqhChapter {
  return language === "fr" ? chapter : { ...chapter, title: en(`chap.${chapter.id}.title`, chapter.title) };
}

export function chapterIn(id: string | undefined, language: LanguageCode) {
  const chapter = id ? chapterById.get(id) : undefined;
  return chapter ? localizeChapter(chapter, language) : undefined;
}

/** One-sentence presentation of a book. */
export function bookIntro(category: FiqhCategory, language: LanguageCode) {
  const intro = FIQH_BOOK_INTROS[category.id];
  if (!intro) return localizeCategory(category, language).summary;
  return language === "fr" ? intro : en(`intro.${category.id}`, intro);
}

export function localizeSource(source: FiqhSource, language: LanguageCode): FiqhSource {
  if (language === "fr") return source;
  let value = sources.get(source.id);
  if (!value) {
    const k = `src.${source.id}`;
    value = {
      ...source,
      reference: en(`${k}.reference`, source.reference),
      scope: en(`${k}.scope`, source.scope),
      limits: en(`${k}.limits`, source.limits),
      authenticity: source.authenticity ? AUTHENTICITY_EN[source.authenticity] ?? source.authenticity : undefined,
    };
    sources.set(source.id, value);
  }
  return value;
}
