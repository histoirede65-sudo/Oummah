import { VerseTimeline, type VerseTimelineEntry } from './VerseTimeline';
import { WordSyncEngine, type WordState } from './WordSyncEngine';
import { WordTimeline } from './WordTimeline';

export interface VerseState {
  positionSeconds: number;
  currentVerse: VerseTimelineEntry | null;
  nextVerse: VerseTimelineEntry | null;
  progress: number;
  remainingTime: number;
  currentWord: WordState['currentWord'];
  wordState: WordState;
}

/** Pure position-to-state engine. It never knows React, animations, or audio APIs. */
export class VerseSyncEngine {
  private activeWordVerseId: number | null = null;

  constructor(
    private timeline: VerseTimeline = new VerseTimeline(),
    private readonly words = new WordSyncEngine(),
  ) {}

  setTimeline(timeline: VerseTimeline) {
    this.timeline = timeline;
    this.activeWordVerseId = null;
    this.words.setTimeline(new WordTimeline());
  }

  synchronize(positionSeconds: number): VerseState {
    const position = Number.isFinite(positionSeconds) ? Math.max(0, positionSeconds) : 0;
    const cursor = this.timeline.at(position);
    if (cursor.current?.verseId !== this.activeWordVerseId) {
      this.activeWordVerseId = cursor.current?.verseId ?? null;
      this.words.setTimeline(new WordTimeline(cursor.current?.words ?? []));
    }
    const wordState = this.words.synchronize(position);
    return {
      positionSeconds: position,
      currentVerse: cursor.current,
      nextVerse: cursor.next,
      progress: cursor.progress,
      remainingTime: cursor.remainingTime,
      currentWord: wordState.currentWord,
      wordState,
    };
  }
}
