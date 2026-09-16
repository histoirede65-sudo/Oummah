import type { MuslimName } from './types';

const GENERIC_STORY_MARKERS = [
  'documenté dans les répertoires de prénoms',
  'oummah retient ici un sens français court',
  'fiche catalogue',
];

export function getNameStory(item: MuslimName) {
  const raw = (item.story ?? '').trim();
  const lower = raw.toLocaleLowerCase('fr');
  const isGeneric = !raw || GENERIC_STORY_MARKERS.some((marker) => lower.includes(marker));

  if (!isGeneric) return raw;

  if (item.historicalRole) {
    return `${item.historicalRole} Son sens principal retenu dans cette fiche est : « ${stripFinalPunctuation(item.meaning)} ».`;
  }

  if (item.quranReference) {
    return `Ce prénom possède un repère coranique indiqué plus bas dans la fiche. Son sens principal retenu est : « ${stripFinalPunctuation(item.meaning)} ».`;
  }

  if (item.tags.includes('compagnon')) {
    return `Prénom connu dans l’histoire des premières générations musulmanes. Il est aujourd’hui apprécié notamment pour son sens : « ${stripFinalPunctuation(item.meaning)} ».`;
  }

  if (item.tags.includes('sahabiyya')) {
    return `Prénom féminin connu dans l’histoire des premières générations musulmanes. Son sens principal retenu est : « ${stripFinalPunctuation(item.meaning)} ».`;
  }

  const origin = item.origin.length ? item.origin.join(' / ') : 'culturelle';
  const variants = getReadableVariants(item);
  const variantsText = variants.length
    ? ` On le rencontre aussi sous les formes ${variants.slice(0, 3).join(', ')}.`
    : '';
  return `Prénom d’origine ${origin.toLocaleLowerCase('fr')} dont le sens principal retenu par OUMMAH est : « ${stripFinalPunctuation(item.meaning)} ».${variantsText}`;
}

export function getNameCardContext(item: MuslimName) {
  const story = getNameStory(item);
  if (item.historicalRole) return item.historicalRole;
  if (item.quranReference && !story.toLocaleLowerCase('fr').includes('repère coranique')) {
    return `${story} Repère coranique : ${item.quranReference}.`;
  }
  return story;
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

function stripFinalPunctuation(value: string) {
  return value.trim().replace(/[.!?;:,]+$/g, '');
}
