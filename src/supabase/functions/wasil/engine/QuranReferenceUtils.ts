export type QuranReference = {
  surah: number;
  verseStart: number;
  verseEnd: number | null;
};

export function parseQuranReference(value: string): QuranReference | null {
  const match = value.match(
    /(?:coran\s*)?(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?/iu,
  );
  if (!match) return null;

  const surah = Number(match[1]);
  const verseStart = Number(match[2]);
  const parsedVerseEnd = match[3] ? Number(match[3]) : null;
  if (
    !Number.isInteger(surah) || surah < 1 || surah > 114 ||
    !Number.isInteger(verseStart) || verseStart < 1 ||
    (parsedVerseEnd !== null &&
      (!Number.isInteger(parsedVerseEnd) || parsedVerseEnd < verseStart))
  ) {
    return null;
  }

  return { surah, verseStart, verseEnd: parsedVerseEnd };
}

export function quranReferenceKey(reference: QuranReference): string {
  return `${reference.surah}:${reference.verseStart}:${reference.verseEnd ?? reference.verseStart}`;
}

export function quranReferenceSpan(reference: QuranReference): number {
  return (reference.verseEnd ?? reference.verseStart) - reference.verseStart + 1;
}

export function quranReferenceContains(
  container: QuranReference,
  candidate: QuranReference,
): boolean {
  if (container.surah !== candidate.surah) return false;
  const containerEnd = container.verseEnd ?? container.verseStart;
  const candidateEnd = candidate.verseEnd ?? candidate.verseStart;
  return container.verseStart <= candidate.verseStart &&
    containerEnd >= candidateEnd;
}

export function deduplicateQuranReferences(
  references: QuranReference[],
): QuranReference[] {
  const normalizedReferences: QuranReference[] = [];

  for (const rawReference of references) {
    const surah = Number(rawReference.surah);
    const verseStart = Number(rawReference.verseStart);
    const rawVerseEnd = rawReference.verseEnd;
    const verseEnd = rawVerseEnd == null ? null : Number(rawVerseEnd);

    if (
      !Number.isInteger(surah) || surah < 1 || surah > 114 ||
      !Number.isInteger(verseStart) || verseStart < 1 ||
      (verseEnd !== null &&
        (!Number.isInteger(verseEnd) || verseEnd < verseStart))
    ) {
      continue;
    }

    normalizedReferences.push({
      surah,
      verseStart,
      verseEnd: verseEnd === verseStart ? null : verseEnd,
    });
  }

  // Prefer the most precise passage when another selected reference fully
  // contains it (for example 113:5 instead of both 113:1-5 and 113:5).
  const sorted = normalizedReferences.sort((a, b) => {
    const spanDelta = quranReferenceSpan(a) - quranReferenceSpan(b);
    if (spanDelta !== 0) return spanDelta;
    if (a.surah !== b.surah) return a.surah - b.surah;
    return a.verseStart - b.verseStart;
  });

  const retained: QuranReference[] = [];
  for (const candidate of sorted) {
    if (retained.some((existing) => quranReferenceContains(candidate, existing))) {
      continue;
    }
    if (!retained.some((existing) =>
      quranReferenceKey(existing) === quranReferenceKey(candidate)
    )) {
      retained.push(candidate);
    }
  }
  return retained;
}

export function deduplicateSelectedQuranSourceIds<T extends { reference: string }>(
  sourceIds: string[],
  requestSources: Record<string, T>,
): string[] {
  const uniqueSourceIds = [...new Set(sourceIds)];
  const quranEntries = uniqueSourceIds
    .map((sourceId) => ({
      sourceId,
      reference: requestSources[sourceId]
        ? parseQuranReference(requestSources[sourceId].reference)
        : null,
    }))
    .filter((entry): entry is { sourceId: string; reference: QuranReference } =>
      Boolean(entry.reference)
    )
    .sort((a, b) => quranReferenceSpan(a.reference) - quranReferenceSpan(b.reference));

  const retainedQuranEntries: typeof quranEntries = [];
  for (const candidate of quranEntries) {
    if (retainedQuranEntries.some(({ reference }) =>
      quranReferenceKey(reference) === quranReferenceKey(candidate.reference) ||
      quranReferenceContains(candidate.reference, reference)
    )) {
      continue;
    }
    retainedQuranEntries.push(candidate);
  }
  const retainedQuranIds = new Set(
    retainedQuranEntries.map(({ sourceId }) => sourceId),
  );

  return uniqueSourceIds.filter((sourceId) => {
    const source = requestSources[sourceId];
    const reference = source ? parseQuranReference(source.reference) : null;
    return !reference || retainedQuranIds.has(sourceId);
  });
}
