import type { QuranFoundationVerse } from "../quranfoundation/QuranFoundationTypes";
import { sanitizeTranslationText } from "./TranslationText";
import { isQuranicPauseMark } from "./QuranWordSync";

export type SelectableQuranWord = {
  text: string;
  wordPosition: number | null;
  translation?: string;
};

function normalizedArabicWord(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/gu, "")
    .replace(/[^\u0621-\u06D3]/gu, "");
}

function normalizedLanguageName(value?: string) {
  return value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .trim()
    .toLowerCase();
}

function translationMatchesLanguage(
  translation: NonNullable<NonNullable<QuranFoundationVerse["words"]>[number]["translation"]>,
  language: "fr" | "en",
) {
  const sourceLanguage = normalizedLanguageName(
    translation.languageName ?? translation.language_name,
  );
  if (language === "fr") {
    return sourceLanguage === "fr" || sourceLanguage === "french" || sourceLanguage === "francais";
  }
  return sourceLanguage === "en" || sourceLanguage === "english" || sourceLanguage === "anglais";
}

/**
 * Builds tap targets without guessing: a word meaning is exposed only when the
 * displayed Arabic token matches the Arabic word returned by Quran Foundation.
 */
export function buildSelectableQuranWords(
  verse: QuranFoundationVerse,
  language: "fr" | "en",
): SelectableQuranWord[] {
  const tokens = verse.textUthmani.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const apiWords = (verse.words ?? []).filter(
    (word) => (word.charTypeName ?? word.char_type_name ?? "word") === "word",
  );
  let wordIndex = 0;

  return tokens.map((text) => {
    if (isQuranicPauseMark(text)) return { text, wordPosition: null };

    const wordPosition = wordIndex + 1;
    const apiWord = apiWords[wordIndex];
    wordIndex += 1;
    if (!apiWord) return { text, wordPosition };

    const apiArabic = apiWord.textUthmani ?? apiWord.text_uthmani ?? apiWord.text ?? "";
    const displayedArabic = normalizedArabicWord(text);
    const sourceArabic = normalizedArabicWord(apiArabic);
    if (!displayedArabic || displayedArabic !== sourceArabic) {
      return { text, wordPosition };
    }

    const translation = apiWord.translation && translationMatchesLanguage(apiWord.translation, language)
      ? sanitizeTranslationText(apiWord.translation.text)
      : undefined;
    return translation
      ? { text, wordPosition, translation }
      : { text, wordPosition };
  });
}
