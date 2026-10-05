import type { MuslimName, NameStatus } from './types';

// Stories produced from a template (they only repeat the meaning or an unsourced generality): not shown.
const GENERIC_STORY_MARKERS = [
  'documenté dans les répertoires de prénoms',
  'oummah retient ici un sens français court',
  'fiche catalogue',
  'la fiche retient ici son sens lexical',
  'son sens principal retenu ici est',
];

/**
 * Religious status shown to the user. Only « Recommandé » is backed by a text (Muslim 2132 for Abdullah and
 * Abd ar-Rahman, prophets and people named in the Quran, Companions); the other statuses were generic verdicts
 * without a source, so no verdict is shown for them.
 */
export function getShownStatus(item: MuslimName): NameStatus | null {
  return item.status === 'recommended' ? item.status : null;
}

export function getNameStory(item: MuslimName): string | null {
  const raw = (item.story ?? '').trim();
  const lower = raw.toLocaleLowerCase('fr');
  const isGeneric = !raw || GENERIC_STORY_MARKERS.some((marker) => lower.includes(marker));
  return isGeneric ? null : raw;
}

export function getNameCardContext(item: MuslimName) {
  if (item.historicalRole) return item.historicalRole;
  const story = getNameStory(item);
  if (story) return story;
  return item.quranReference ? `Repère coranique : ${item.quranReference}.` : null;
}

export function getReadableVariants(item: MuslimName) {
  const seen = new Set<string>();
  return [item.name, ...item.variants]
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeVariant(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter((value) => normalizeVariant(value) !== normalizeVariant(item.name));
}

export function isExternalSourceClickable(url?: string) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    // Les pages de dataset servent de provenance éditoriale, pas de destination utile dans l'app.
    if (parsed.hostname === 'huggingface.co') return false;
    return true;
  } catch {
    return false;
  }
}

function normalizeVariant(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ʿʾ’‘'`-]/g, '')
    .replace(/\s+/g, '')
    .toLocaleLowerCase('fr');
}
