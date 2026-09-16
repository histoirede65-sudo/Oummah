import { FIQH_TOPICS } from "./fiqhData";
import type { FiqhTopic } from "./fiqhTypes";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’']/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function searchFiqhTopics(query: string): FiqhTopic[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (!terms.length) return FIQH_TOPICS.filter((topic) => topic.publicationStatus !== "coming_soon" && topic.publicationStatus !== "blocked");
  return FIQH_TOPICS.filter((topic) => topic.publicationStatus !== "coming_soon" && topic.publicationStatus !== "blocked").map((topic) => {
    const haystack = normalize([topic.title, topic.arabicTerm, ...topic.aliases, topic.summary].filter(Boolean).join(" "));
    const score = terms.reduce((total, term) => total + (haystack.includes(term) ? (topic.title.toLowerCase().includes(term) ? 3 : 1) : 0), 0);
    return { topic, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).map(({ topic }) => topic);
}
