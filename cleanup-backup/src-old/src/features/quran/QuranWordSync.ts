export type AudioSourceMode = 'full-surah' | 'single-verse';

export function getSyncPositionMs(
  playerPositionMs: number,
  verseTimestampFromMs: number,
  mode: AudioSourceMode,
) {
  return mode === 'single-verse'
    ? playerPositionMs + verseTimestampFromMs
    : playerPositionMs;
}

export type VerseTimestamp = {
  verseId: number;
  startSeconds: number;
  endSeconds: number;
};

export type WordTimestamp = {
  verseId: number;
  wordPosition: number;
  startMs: number;
  endMs: number;
};

function verseNumberFromKey(verseKey?: string) {
  const value = Number(verseKey?.split(':')[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function normalizeSecond(value: number, duration: number) {
  if (!Number.isFinite(value)) return 0;
  if (value >= 1000) return value / 1000;
  if (duration > 0 && value > duration * 1.5) return value / 1000;
  return value;
}

function normalizeMillisecond(value: number, duration: number) {
  if (!Number.isFinite(value)) return 0;
  if (value >= 1000) return value;
  if (duration > 0 && value > duration + 5) return value;
  return value * 1000;
}

function identity(record: Record<string, unknown>, fallbackVerseId?: number) {
  return verseNumberFromKey(String(record.verseKey ?? record.verse_key ?? ''))
    ?? Number(record.verseId ?? record.verse_id ?? record.ayah ?? record.verseNumber ?? record.verse_number ?? fallbackVerseId);
}

function bounds(record: Record<string, unknown>) {
  const start = Number(record.timestampFrom ?? record.timestamp_from ?? record.startTime ?? record.start_time ?? record.start);
  const end = Number(record.timestampTo ?? record.timestamp_to ?? record.endTime ?? record.end_time ?? record.end);
  const milliseconds = record.timestampFrom !== undefined
    || record.timestamp_from !== undefined
    || record.timestampTo !== undefined
    || record.timestamp_to !== undefined;
  return { start, end, milliseconds };
}

export function normalizeVerseTimestamps(raw: unknown, duration: number): readonly VerseTimestamp[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): VerseTimestamp[] => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const verseId = identity(record);
    const { start, end, milliseconds } = bounds(record);
    if (!Number.isFinite(verseId) || verseId <= 0 || !Number.isFinite(start) || !Number.isFinite(end)) return [];
    return [{
      verseId,
      startSeconds: milliseconds ? start / 1000 : normalizeSecond(start, duration),
      endSeconds: milliseconds ? end / 1000 : normalizeSecond(end, duration),
    }];
  }).filter((item) => item.endSeconds > item.startSeconds)
    .sort((left, right) => left.startSeconds - right.startSeconds);
}

export function normalizeWordTimestamps(raw: unknown, duration: number): readonly WordTimestamp[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): WordTimestamp[] => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const nested = record.words ?? record.segments ?? record.timestamps;
    if (Array.isArray(nested)) {
      const parentVerseId = identity(record);
      return nested.flatMap((child): WordTimestamp[] => {
        if (Array.isArray(child)) {
          const wordPosition = Number(child[0]);
          const start = Number(child[1]);
          const end = Number(child[2]);
          if (!Number.isFinite(parentVerseId) || parentVerseId <= 0 || !Number.isFinite(wordPosition) || wordPosition <= 0 || !Number.isFinite(start) || !Number.isFinite(end)) return [];
          return [{ verseId: parentVerseId, wordPosition, startMs: start, endMs: end }];
        }
        if (!child || typeof child !== 'object') return [];
        const childRecord = child as Record<string, unknown>;
        const verseId = identity(childRecord, parentVerseId);
        const wordPosition = Number(childRecord.wordPosition ?? childRecord.word_position ?? childRecord.position ?? childRecord.word ?? childRecord.wordIndex ?? childRecord.word_index);
        const { start, end, milliseconds } = bounds(childRecord);
        if (!Number.isFinite(verseId) || verseId <= 0 || !Number.isFinite(wordPosition) || wordPosition <= 0 || !Number.isFinite(start) || !Number.isFinite(end)) return [];
        return [{
          verseId,
          wordPosition,
          startMs: milliseconds ? start : normalizeMillisecond(start, duration),
          endMs: milliseconds ? end : normalizeMillisecond(end, duration),
        }];
      });
    }
    const verseId = identity(record);
    const wordPosition = Number(record.wordPosition ?? record.word_position ?? record.position ?? record.word ?? record.wordIndex ?? record.word_index);
    const { start, end, milliseconds } = bounds(record);
    if (!Number.isFinite(verseId) || verseId <= 0 || !Number.isFinite(wordPosition) || wordPosition <= 0 || !Number.isFinite(start) || !Number.isFinite(end)) return [];
    return [{
      verseId,
      wordPosition,
      startMs: milliseconds ? start : normalizeMillisecond(start, duration),
      endMs: milliseconds ? end : normalizeMillisecond(end, duration),
    }];
  }).filter((item) => item.endMs > item.startMs)
    .sort((left, right) => left.startMs - right.startMs);
}

export function audioPositionMilliseconds(positionSeconds: number) {
  return Math.round(positionSeconds * 1000);
}

export function activeVerseAt(timestamps: readonly VerseTimestamp[], positionSeconds: number) {
  if (timestamps.length === 0) return null;
  const active = timestamps.find((item) => positionSeconds >= item.startSeconds && positionSeconds < item.endSeconds);
  if (active) return active.verseId;
  const next = timestamps.find((item) => positionSeconds < item.startSeconds);
  return next?.verseId ?? timestamps[timestamps.length - 1].verseId;
}

export function getWordSyncState({
  positionMs,
  verseTimeline,
}: {
  positionMs: number;
  verseTimeline: readonly WordTimestamp[];
}) {
  const activeWordPosition = getActiveWordTimestamp(positionMs, verseTimeline)?.wordPosition ?? null;
  const completedWordPositions = verseTimeline
    .filter((word) => positionMs >= word.endMs)
    .map((word) => word.wordPosition);
  return { activeWordPosition, completedWordPositions };
}

export function getActiveWordTimestamp(positionMs: number, timestamps: readonly WordTimestamp[]) {
  return timestamps.find(
    (word) => positionMs >= word.startMs && positionMs < word.endMs,
  );
}
