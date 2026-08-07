import { PlaybackTimeline } from './PlaybackTimeline';
import type { WordTimelineEntry } from './WordTimeline';

export interface VerseTimelineEntry {
  id: string;
  verseId: number;
  verseKey?: `${number}:${number}`;
  startSeconds: number;
  endSeconds: number;
  words?: readonly WordTimelineEntry[];
}

export class VerseTimeline extends PlaybackTimeline<VerseTimelineEntry> {}

/** Mock verse data only. Real provider timings will use the same entry shape. */
export function createMockSyncVerseTimeline(verseIds: readonly number[], secondsPerVerse = 8) {
  return new VerseTimeline(verseIds.map((verseId, index) => ({
    id: `mock-verse:${verseId}`,
    verseId,
    startSeconds: index * secondsPerVerse,
    endSeconds: (index + 1) * secondsPerVerse,
  })));
}

export const MOCK_AL_FATIHA_TIMELINE = createMockSyncVerseTimeline([1, 2, 3, 4, 5, 6, 7]);
