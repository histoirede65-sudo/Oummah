import type { LanguageCode } from "../../i18n";
import { FIQH_TOPICS } from "./fiqhData";
import { localizeTopic } from "./fiqhLocalization";
import type { FiqhTopic } from "./fiqhTypes";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Lessons matching the query, in the reading language (French aliases stay searchable). */
export function searchFiqhTopics(query: string, language: LanguageCode = "fr"): FiqhTopic[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  const topics = FIQH_TOPICS.map((topic) => localizeTopic(topic, language));
  if (!terms.length) return topics;
  return topics.map((topic) => {
    const haystack = normalize([topic.title, topic.arabicTerm, ...topic.aliases, topic.summary, topic.lesson?.short].filter(Boolean).join(" "));
    const score = terms.reduce((total, term) => total + (haystack.includes(term) ? (topic.title.toLowerCase().includes(term) ? 3 : 1) : 0), 0);
    return { topic, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).map(({ topic }) => topic);
}
