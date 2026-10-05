import type { LanguageCode } from "../../i18n";
import type { ProphetStory } from "./allProphetsData";
import type { ProphetAudioEpisode } from "./audio/prophetAudioData";
import { PROPHETS_EN } from "./prophetsEnglish";
import type { ProphetChapter } from "./prophetsData";

// The stories are written in French; English replaces each text by its line in PROPHETS_EN and falls back to French.
const en = (key: string, fr: string) => PROPHETS_EN[key] ?? fr;

const chapterCache = new Map<string, ProphetChapter[]>();

export function localizeChapters(storyId: string, chapters: ProphetChapter[], language: LanguageCode): ProphetChapter[] {
  if (language !== "en") return chapters;
  const cached = chapterCache.get(storyId);
  if (cached) return cached;
  const localized = chapters.map((chapter) => {
    const k = `story.${storyId}.${chapter.id}`;
    return {
      ...chapter,
      title: en(`${k}.title`, chapter.title),
      subtitle: en(`${k}.subtitle`, chapter.subtitle),
      atmosphere: en(`${k}.atmosphere`, chapter.atmosphere),
      paragraphs: chapter.paragraphs.map((text, i) => en(`${k}.p.${i}`, text)),
      lessons: chapter.lessons.map((text, i) => en(`${k}.lesson.${i}`, text)),
      references: chapter.references.map((reference, i) => ({
        ...reference,
        label: en(`${k}.ref.${i}.label`, reference.label),
        note: en(`${k}.ref.${i}.note`, reference.note),
      })),
    };
  });
  chapterCache.set(storyId, localized);
  return localized;
}

export function localizeStory(story: ProphetStory, language: LanguageCode): ProphetStory {
  if (language !== "en") return story;
  return {
    ...story,
    epithet: en(`story.${story.id}.epithet`, story.epithet),
    summary: en(`story.${story.id}.summary`, story.summary),
    chapters: localizeChapters(story.id, story.chapters, language),
  };
}

export function localizeAudioEpisode(episode: ProphetAudioEpisode, language: LanguageCode): ProphetAudioEpisode {
  if (language !== "en") return episode;
  const k = `audio.${episode.prophetId}`;
  return {
    ...episode,
    title: en(`${k}.title`, episode.title),
    subtitle: en(`${k}.subtitle`, episode.subtitle),
    sourceLabels: episode.sourceLabels.map((label, i) => en(`${k}.source.${i}`, label)),
  };
}
