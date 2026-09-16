import { PlaybackTimeline } from './PlaybackTimeline';

export interface WordTimelineEntry {
  id: string;
  verseId: number;
  wordIndex: number;
  text?: string;
  startSeconds: number;
  endSeconds: number;
}

export class WordTimeline extends PlaybackTimeline<WordTimelineEntry> {}

/** Mock word data proves the contract without depending on a Quran API. */
export function createMockWordTimeline(verseId: number, startSeconds: number, words: readonly string[], secondsPerWord = 0.8) {
  return new WordTimeline(words.map((text, wordIndex) => ({
    id: `${verseId}:${wordIndex + 1}`,
    verseId,
    wordIndex,
    text,
    startSeconds: startSeconds + wordIndex * secondsPerWord,
    endSeconds: startSeconds + (wordIndex + 1) * secondsPerWord,
  })));
}
