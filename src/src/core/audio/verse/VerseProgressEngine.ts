import type { ActiveWordState, VerseProgressState, VerseTiming, WordTiming } from './VerseState';

function percent(position: number, start: number, end: number) {
  if (end <= start) return position >= end ? 100 : 0;
  return Math.min(100, Math.max(0, ((position - start) / (end - start)) * 100));
}

/** Pure timeline calculator. It has no player, framework or API dependency. */
export class VerseProgressEngine {
  private timeline: readonly VerseTiming[];

  constructor(timeline: readonly VerseTiming[] = []) {
    this.timeline = this.normalize(timeline);
  }

  setTimeline(timeline: readonly VerseTiming[]) {
    this.timeline = this.normalize(timeline);
  }

  getTimeline() {
    return this.timeline;
  }

  calculate(positionSeconds: number): VerseProgressState {
    const position = Math.max(0, positionSeconds);
    const verse = this.timeline.find((item) => position >= item.startSeconds && position < item.endSeconds)
      ?? (this.timeline.length > 0 && position >= this.timeline[this.timeline.length - 1].endSeconds ? this.timeline[this.timeline.length - 1] : null);
    if (!verse) return { verseId: null, progress: 0, activeWord: null };
    return {
      verseId: verse.verseId,
      progress: percent(position, verse.startSeconds, verse.endSeconds),
      activeWord: this.activeWord(verse.words, position),
    };
  }

  private activeWord(words: readonly WordTiming[] | undefined, position: number): ActiveWordState | null {
    const word = words?.find((item) => position >= item.startSeconds && position < item.endSeconds);
    return word ? { id: word.id, wordIndex: word.wordIndex, progress: percent(position, word.startSeconds, word.endSeconds) } : null;
  }

  private normalize(timeline: readonly VerseTiming[]) {
    return [...timeline]
      .filter((item) => item.endSeconds >= item.startSeconds)
      .sort((left, right) => left.startSeconds - right.startSeconds);
  }
}

/** Mock timings only. Replace this factory, not the engine, when real timings arrive. */
export function createMockVerseTimeline(verseIds: readonly number[], secondsPerVerse = 8): readonly VerseTiming[] {
  return verseIds.map((verseId, index) => ({
    verseId,
    startSeconds: index * secondsPerVerse,
    endSeconds: (index + 1) * secondsPerVerse,
  }));
}
