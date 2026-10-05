import type { NameSourceId } from './scholar-sources';
import type { MuslimName } from './types';

// Stories produced from a template (they only repeat the meaning or an unsourced generality): not shown.
const GENERIC_STORY_MARKERS = [
  'documenté dans les répertoires de prénoms',
  'oummah retient ici un sens français court',
  'fiche catalogue',
  'la fiche retient ici son sens lexical',
  'son sens principal retenu ici est',
];

export type StatusBasis = { reason: string; sources: NameSourceId[] };

const PROPHET_IDS = new Set(['muhammad', 'ahmad']);

/**
 * Why a name is shown as « Recommandé », with the texts that say so. Only four cases have such a text:
 * Abdullah and Abd ar-Rahman (Muslim 2132), names of servitude to one of Allah's Names (Ibn ‘Uthaymîn),
 * prophets' names (Abû Dâwûd 4950, Ibn ‘Uthaymîn) and names of the women Companions (Ibn Bâz, Ibn ‘Uthaymîn).
 * Every other name gets no verdict.
 */
export function getStatusBasis(item: MuslimName): StatusBasis | null {
  if (item.id === 'abdullah' || item.id === 'abdurrahman') {
    return { reason: '« Les noms les plus aimés d’Allah sont ‘Abdullah et ‘Abd al-Rahman. »', sources: ['muslim2132'] };
  }
  if (item.gender === 'boy' && item.arabic?.startsWith('عبد ')) {
    return { reason: 'Nom rattaché à Allah. Ibn ‘Uthaymîn : « Tout [nom] rattaché à Allah est meilleur que les autres. »', sources: ['uthNaming', 'bazWhenWho'] };
  }
  if (item.tags.includes('prophete') || PROPHET_IDS.has(item.id)) {
    return { reason: 'Nom de prophète. Le Prophète ﷺ : « Appelez-vous par les noms des Prophètes. »', sources: ['abuDawud4950', 'uthNaming'] };
  }
  if (item.tags.includes('sahabiyya') && item.status === 'recommended') {
    return { reason: 'Nom d’une femme des Compagnons. Ibn Bâz : pour les femmes, « ce qui était en usage parmi les femmes des Compagnons ».', sources: ['bazWhenWho', 'uthMalak'] };
  }
  return null;
}

export function getNameStory(item: MuslimName): string | null {
  const raw = (item.story ?? '').trim();
  const lower = raw.toLocaleLowerCase('fr');
  const isGeneric = !raw || GENERIC_STORY_MARKERS.some((marker) => lower.includes(marker));
  return isGeneric ? null : raw;
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
