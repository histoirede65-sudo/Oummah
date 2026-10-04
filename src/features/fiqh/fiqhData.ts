import { CATALOG_CATEGORIES, CATALOG_CHAPTERS, CATALOG_TOPICS } from "./fiqhCatalog";
import type { FiqhCategory, FiqhTopic } from "./fiqhTypes";
import { FIQH_LESSONS } from "./lessons";

export const FIQH_CATEGORIES: FiqhCategory[] = CATALOG_CATEGORIES.map((category) => ({
  ...category,
  chapters: CATALOG_CHAPTERS.filter((chapter) => chapter.categoryId === category.id),
}));

// A lesson written for a topic that is not in the catalogue yet creates it in the chapter it names.
const newTopics: FiqhTopic[] = [];
for (const [id, entry] of Object.entries(FIQH_LESSONS)) {
  if (CATALOG_TOPICS.some((topic) => topic.id === id) || !entry.chapter || !entry.title) continue;
  const chapter = CATALOG_CHAPTERS.find((item) => item.id === entry.chapter);
  if (!chapter) continue;
  chapter.topicIds.push(id);
  FIQH_CATEGORIES.find((category) => category.id === chapter.categoryId)?.topicIds.push(id);
  newTopics.push({
    id, categoryId: chapter.categoryId, title: entry.title, summary: entry.summary ?? entry.short,
    aliases: entry.aliases ?? [], badge: "REPÈRES ESSENTIELS", sourceIds: entry.sourceIds ?? [], differences: [],
  });
}

export const FIQH_TOPICS: FiqhTopic[] = [...CATALOG_TOPICS, ...newTopics].map((topic) => {
  const entry = FIQH_LESSONS[topic.id];
  if (!entry) return topic;
  const { title, arabic, summary, chapter: _chapter, aliases, sensitive, ...lesson } = entry;
  return {
    ...topic,
    lesson,
    ...(title ? { title } : {}),
    ...(arabic ? { arabicTerm: arabic } : {}),
    summary: summary ?? topic.summary,
    aliases: Array.from(new Set([...topic.aliases, ...(aliases ?? [])])),
    ...(sensitive !== undefined ? { sensitive } : {}),
  };
});

export const topicById = new Map(FIQH_TOPICS.map((topic) => [topic.id, topic]));
export const categoryById = new Map(FIQH_CATEGORIES.map((category) => [category.id, category]));
export const chapterById = new Map(CATALOG_CHAPTERS.map((chapter) => [chapter.id, chapter]));

/** Lessons of a book in reading order: chapter after chapter, as in the table of contents. */
export function bookOrder(categoryId: string): string[] {
  const category = categoryById.get(categoryId);
  if (!category) return [];
  const ordered = (category.chapters ?? []).flatMap((chapter) => chapter.topicIds);
  const rest = category.topicIds.filter((id) => !ordered.includes(id));
  return [...ordered, ...rest].filter((id, index, list) => list.indexOf(id) === index && topicById.has(id));
}
