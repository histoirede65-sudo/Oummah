import type { MuslimName, NameSource } from './types';
import { VERIFIED_NAME_SOURCES } from './verified-sources';

/**
 * Sources shown on a fiche. Only what was checked is listed: the Quran reference, the hadiths and Ibn ‘Uthaymîn cited
 * in the fiche, hand-written sources with a precise link, and the Muslim Names Dataset / Behind the Name entries that
 * were found for this name (verified-sources.ts). Generic entries attached to every fiche and OUMMAH's own notes are
 * not sources and are not shown.
 */
export function getNameSources(item: MuslimName): NameSource[] {
  const sources: NameSource[] = [];

  if (item.quranReference) {
    sources.push({
      kind: 'quran',
      label: 'Coran',
      reference: item.quranReference,
      url: 'https://quran.com',
      supports: ['repère coranique', 'personne ou terme mentionné'],
      note: 'La présence dans le Coran ne constitue pas, à elle seule, une recommandation de porter le prénom.',
    });
  }

  if (item.sourceNote && !item.sourceNote.includes('synthèse éditoriale OUMMAH')) {
    const lower = item.sourceNote.toLocaleLowerCase('fr');
    const isHadith = lower.includes('sahih') || lower.includes('hadith') || lower.includes('muslim') || lower.includes('bukhari');
    const isIbnUthaymin = item.sourceNote.includes('Ibn ‘Uthaymîn');
    sources.push({
      kind: isHadith ? 'hadith' : 'editorial',
      label: isHadith ? 'Hadith' : isIbnUthaymin ? 'Ibn ‘Uthaymîn · al-Qawâ‘id al-Muthlâ' : 'Référence',
      reference: item.sourceNote,
      url: isIbnUthaymin ? 'https://shamela.ws/book/8874/19' : undefined,
      supports: [isIbnUthaymin ? 'Nom d’Allah établi par le Coran ou la Sunna' : 'statut ou repère indiqué dans la fiche'],
    });
  }

  for (const source of item.sources ?? []) {
    if (source.kind === 'quran' || source.kind === 'hadith' || isPreciseLink(source.url)) sources.push(source);
  }

  const verified = VERIFIED_NAME_SOURCES[item.id];
  if (verified?.dataset) {
    sources.push({
      kind: 'catalogue',
      label: 'Muslim Names Dataset (CC0)',
      reference: `Entrée « ${verified.dataset} » · base de 14 585 prénoms issue de muslimnames.com`,
      supports: ['écriture latine', 'genre'],
      note: 'Le sens de la fiche est une reformulation française ; la base n’est pas un avis religieux.',
    });
  }
  if (verified?.behindTheName && !sources.some((source) => source.url?.includes('behindthename.com/name/'))) {
    sources.push({
      kind: 'linguistic',
      label: 'Behind the Name',
      reference: `Page « ${item.name} »`,
      url: verified.behindTheName,
      supports: ['origine', 'variantes'],
      note: 'Source linguistique ; elle ne donne pas de statut religieux.',
    });
  }

  return dedupeSources(sources);
}

/** A link to a precise page (not a generic list or a dataset home page). */
function isPreciseLink(url?: string) {
  if (!url) return false;
  return !/behindthename\.com\/names\/usage|huggingface\.co/.test(url);
}

function dedupeSources(sources: NameSource[]) {
  const seen = new Set<string>();
  return sources.filter(source => {
    const key = `${source.label}|${source.reference ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
