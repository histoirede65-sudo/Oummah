import type { MuslimName, NameSource } from './types';

const DATASET_URL = 'https://huggingface.co/datasets/wpacademy/muslim-names-dataset';
const BTN_ARABIC = 'https://www.behindthename.com/names/usage/arabic';
const BTN_PERSIAN = 'https://www.behindthename.com/names/usage/persian';
const BTN_TURKISH = 'https://www.behindthename.com/names/usage/turkish';
const BTN_URDU = 'https://www.behindthename.com/names/usage/urdu';

export function getNameSources(item: MuslimName): NameSource[] {
  if (item.sources?.length) return dedupeSources(item.sources);
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

  if (item.sourceNote) {
    const lower = item.sourceNote.toLocaleLowerCase('fr');
    sources.push({
      kind: lower.includes('sahih') || lower.includes('hadith') ? 'hadith' : 'editorial',
      label: lower.includes('sahih') || lower.includes('hadith') ? 'Hadith / repère textuel' : 'Repère éditorial OUMMAH',
      reference: item.sourceNote,
      supports: ['statut, usage historique ou repère indiqué dans la fiche'],
    });
  }

  // Chaque fiche dispose d'un repère de provenance linguistique, même lorsqu'un texte religieux
  // n'est pas pertinent pour établir le sens du prénom.
  sources.push({
    kind: 'catalogue',
    label: 'Muslim Names Dataset (CC0)',
    reference: `Recherche de la forme « ${item.name} » dans le répertoire de 14 585 noms issu de muslimnames.com`,
    supports: ['comparaison de l’écriture latine', 'écriture arabe', 'sens lexical de départ', 'genre'],
    note: 'Cette base est un point de départ culturel. OUMMAH reformule le sens en français et ne transforme jamais cette présence en verdict religieux.',
  });

  sources.push({
    kind: 'linguistic',
    label: linguisticLabel(item),
    reference: `Contrôle d’origine et de variantes pour « ${item.name} » lorsque l’entrée est documentée`,
    url: linguisticUrl(item),
    supports: ['origine linguistique', 'variantes de transcription', 'étymologie lorsque documentée'],
    note: 'Le répertoire linguistique sert de contrepoint à la base culturelle. Une étymologie incertaine reste signalée comme telle dans la fiche.',
  });

  if (item.historicalRole && !item.sourceNote) {
    sources.push({
      kind: 'historical',
      label: 'Repère historique OUMMAH',
      reference: item.historicalRole,
      supports: ['identification du personnage ou de l’usage historique'],
      note: 'Ce repère historique explique l’usage du nom ; il ne crée pas à lui seul une recommandation religieuse.',
    });
  }

  return dedupeSources(sources);
}

export function getMeaningReliability(item: MuslimName) {
  if (item.meaningConfidence) return item.meaningConfidence;
  if (item.editorialLevel === 'catalogue') return 'to-review' as const;
  return item.editorialLevel === 'sourced' ? 'high' as const : 'medium' as const;
}

export function getLanguageAndCulture(item: MuslimName) {
  const language = item.language?.length ? item.language : inferLanguage(item.origin);
  const culture = item.culture?.length ? item.culture : inferCulture(item.origin);
  return { language, culture };
}

function linguisticUrl(item: MuslimName) {
  const values = item.origin.map(value => value.toLocaleLowerCase('fr'));
  if (values.some(value => value.includes('pers'))) return BTN_PERSIAN;
  if (values.some(value => value.includes('tur'))) return BTN_TURKISH;
  if (values.some(value => value.includes('ourdou') || value.includes('urdu'))) return BTN_URDU;
  return BTN_ARABIC;
}

function linguisticLabel(item: MuslimName) {
  const values = item.origin.map(value => value.toLocaleLowerCase('fr'));
  if (values.some(value => value.includes('pers'))) return 'Behind the Name · noms persans';
  if (values.some(value => value.includes('tur'))) return 'Behind the Name · noms turcs';
  if (values.some(value => value.includes('ourdou') || value.includes('urdu'))) return 'Behind the Name · noms ourdous';
  return 'Behind the Name · noms arabes et usages associés';
}

function inferLanguage(origin: string[]) {
  const values = origin.map(value => value.toLocaleLowerCase('fr'));
  const result: string[] = [];
  if (values.some(value => value.includes('arabe'))) result.push('Arabe');
  if (values.some(value => value.includes('perse'))) result.push('Persan');
  if (values.some(value => value.includes('tur'))) result.push('Turc');
  if (values.some(value => value.includes('amaz') || value.includes('berb'))) result.push('Amazigh');
  if (values.some(value => value.includes('ourdou') || value.includes('urdu'))) result.push('Ourdou');
  if (values.some(value => value.includes('hébra') || value.includes('sémit'))) result.push('Langue sémitique ancienne / forme arabisée');
  return result.length ? result : ['Usage culturel à préciser'];
}

function inferCulture(origin: string[]) {
  if (!origin.length) return ['Usage culturel à préciser'];
  return origin.map(value => value === 'Usage arabe' ? 'Tradition arabophone' : value);
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
