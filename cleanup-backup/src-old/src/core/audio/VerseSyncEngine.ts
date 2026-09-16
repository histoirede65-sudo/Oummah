export type VerseTimestamp = {
  verseId: number;
  startTime: number; // secondes
  endTime: number; // secondes
};

export type VerseSyncState = {
  currentVerse: number;
  previousVerse: number | null;
  nextVerse: number | null;
  verseProgress: number; // 0 -> 1
};

export class VerseSyncEngine {
  private readonly timestamps: VerseTimestamp[];

  constructor(timestamps: VerseTimestamp[]) {
    this.timestamps = [...timestamps].sort(
      (a, b) => a.startTime - b.startTime,
    );
  }

  getState(currentTime: number): VerseSyncState {
    if (this.timestamps.length === 0) {
      return {
        currentVerse: 1,
        previousVerse: null,
        nextVerse: null,
        verseProgress: 0,
      };
    }

    let index = this.timestamps.findIndex(
      (verse) =>
        currentTime >= verse.startTime &&
        currentTime < verse.endTime,
    );

    if (index === -1) {
      if (currentTime < this.timestamps[0].startTime) {
        index = 0;
      } else {
        index = this.timestamps.length - 1;
      }
    }

    const current = this.timestamps[index];

    const duration = Math.max(
      0.001,
      current.endTime - current.startTime,
    );

    const progress = Math.min(
      1,
      Math.max(
        0,
        (currentTime - current.startTime) / duration,
      ),
    );

    return {
      currentVerse: current.verseId,
      previousVerse:
        index > 0
          ? this.timestamps[index - 1].verseId
          : null,
      nextVerse:
        index < this.timestamps.length - 1
          ? this.timestamps[index + 1].verseId
          : null,
      verseProgress: progress,
    };
  }
}