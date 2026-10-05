import { MUSLIM_NAMES, VERIFIED_NAMES, isAbdName } from './data';
import type { MuslimName, NameTag } from './types';

export type NameCollection = {
  id: string;
  title: string;
  titleEn: string;
  tag?: NameTag;
  /** Custom membership test when a tag is not enough. */
  test?: (item: MuslimName) => boolean;
};

export const NAME_COLLECTIONS: NameCollection[] = [
  { id:'prophets', title:'Prophètes', titleEn:'Prophets', tag:'prophete' },
  { id:'companions', title:'Compagnons', titleEn:'Companions', tag:'compagnon' },
  { id:'sahabiyyat', title:'Compagnonnes', titleEn:'Women Companions', tag:'sahabiyya' },
  { id:'abd', title:'ʿAbd + Nom d’Allah', titleEn:'ʿAbd + Name of Allah', test:isAbdName },
  { id:'quran', title:'Dans le Coran', titleEn:'In the Quran', tag:'coranique' },
  { id:'short', title:'Courts', titleEn:'Short', tag:'court' },
  { id:'rare', title:'Rares', titleEn:'Rare', tag:'rare' },
  { id:'france', title:'Faciles en français', titleEn:'Easy in French', tag:'facile-france' },
];

export function inCollection(collection: NameCollection, item: MuslimName) {
  if (collection.test) return collection.test(item);
  return collection.tag ? item.tags.includes(collection.tag) : true;
}

export function namesForCollection(collection: NameCollection): MuslimName[] {
  return MUSLIM_NAMES.filter((item) => inCollection(collection, item));
}

export function relatedNames(item: MuslimName, limit = 4) {
  const pool = item.editorialLevel === 'catalogue' ? MUSLIM_NAMES : VERIFIED_NAMES;
  return pool
    .filter((candidate) => candidate.id !== item.id && candidate.gender === item.gender)
    .map((candidate) => ({ candidate, score: candidate.tags.filter((tag) => item.tags.includes(tag)).length }))
    .sort((a,b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name, 'fr'))
    .filter((entry) => entry.score > 0)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
