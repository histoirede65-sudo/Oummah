import { WordTimeline, type WordTimelineEntry } from './WordTimeline';

export interface WordState {
  currentWord: WordTimelineEntry | null;
  nextWord: WordTimelineEntry | null;
  progress: number;
  remainingTime: number;
}

const EMPTY_WORD_STATE: Readonly<WordState> = {
  currentWord: null,
  nextWord: null,
  progress: 0,
  remainingTime: 0,
};

/** Word-level calculator already usable when precise timings become available. */
export class WordSyncEngine {
  private timeline: WordTimeline;

  constructor(timeline: WordTimeline = new WordTimeline()) {
    this.timeline = timeline;
  }

  setTimeline(timeline: WordTimeline) {
    this.timeline = timeline;
  }

  synchronize(positionSeconds: number): WordState {
    const cursor = this.timeline.at(positionSeconds);
    if (!cursor.current && !cursor.next) return EMPTY_WORD_STATE;
    return {
      currentWord: cursor.current,
      nextWord: cursor.next,
      progress: cursor.progress,
      remainingTime: cursor.remainingTime,
    };
  }
}
