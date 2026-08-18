export interface PlaybackTimelineSegment {
  id: string;
  startSeconds: number;
  endSeconds: number;
}

export interface PlaybackTimelineCursor<T extends PlaybackTimelineSegment> {
  current: T | null;
  next: T | null;
  progress: number;
  remainingTime: number;
}

function normalizePosition(positionSeconds: number) {
  return Number.isFinite(positionSeconds) ? Math.max(0, positionSeconds) : 0;
}

/** Sorted, validated timeline with logarithmic position lookup. */
export class PlaybackTimeline<T extends PlaybackTimelineSegment> {
  private entries: readonly T[] = [];

  constructor(entries: readonly T[] = []) {
    this.replace(entries);
  }

  replace(entries: readonly T[]) {
    this.entries = [...entries]
      .filter((entry) => (
        Number.isFinite(entry.startSeconds)
        && Number.isFinite(entry.endSeconds)
        && entry.startSeconds >= 0
        && entry.endSeconds > entry.startSeconds
      ))
      .sort((left, right) => left.startSeconds - right.startSeconds);
  }

  all() {
    return this.entries;
  }

  at(positionSeconds: number): PlaybackTimelineCursor<T> {
    const position = normalizePosition(positionSeconds);
    let low = 0;
    let high = this.entries.length - 1;
    let candidate = -1;

    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (this.entries[middle].startSeconds <= position) {
        candidate = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    const possible = candidate >= 0 ? this.entries[candidate] : null;
    const current = possible && position < possible.endSeconds ? possible : null;
    const nextIndex = candidate + 1;
    const next = this.entries[nextIndex] ?? null;
    if (!current) return { current: null, next, progress: 0, remainingTime: 0 };

    const duration = current.endSeconds - current.startSeconds;
    return {
      current,
      next,
      progress: Math.min(100, Math.max(0, ((position - current.startSeconds) / duration) * 100)),
      remainingTime: Math.max(0, current.endSeconds - position),
    };
  }
}
