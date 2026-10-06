import type { TranslationKey } from "../../../i18n";
import type { DailyGoal } from "../domain/DailyGoal";

type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

// Program goals are stored with their French wording; they are shown in the
// app language from their id. Personal goals keep the text the user wrote.
const PROGRAM_TEXT: Record<string, { title: TranslationKey; subtitle: TranslationKey }> = {
  "program-quran-reading": { title: "goals.quranReading", subtitle: "goals.quranReadingSub" },
  "program-dhikr": { title: "goals.dhikr", subtitle: "goals.dhikrSub" },
  "program-hifz": { title: "goals.hifz", subtitle: "goals.hifzSub" },
  "program-prayers": { title: "goals.prayers", subtitle: "goals.prayersSub" },
  "program-dua": { title: "goals.dua", subtitle: "goals.duaSub" },
  "program-hadith": { title: "goals.hadith", subtitle: "goals.hadithSub" },
  "program-prophets": { title: "goals.prophets", subtitle: "goals.prophetsSub" },
  "program-quran-listening": { title: "goals.listening", subtitle: "goals.listeningSub" },
};

export function goalTitle(goal: DailyGoal, t: Translate) {
  const text = PROGRAM_TEXT[goal.id];
  return text ? t(text.title, { count: goal.progress.target }) : goal.title;
}

export function goalSubtitle(goal: DailyGoal, t: Translate) {
  const text = PROGRAM_TEXT[goal.id];
  return text ? t(text.subtitle) : goal.subtitle;
}
