import { MUSLIM_NAMES, VERIFIED_NAMES } from './data';
import type { MuslimName, NameGender, NameTag } from './types';

export type NameCollection = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gender?: NameGender;
  tag?: NameTag;
  ids?: string[];
};

export const NAME_COLLECTIONS: NameCollection[] = [
  { id:'prophets', title:'Noms de prophètes', subtitle:'Des noms au précédent noble', icon:'sparkles-outline', gender:'boy', tag:'prophete' },
  { id:'companions', title:'Compagnons', subtitle:'Des figures des premières générations', icon:'people-outline', gender:'boy', tag:'compagnon' },
  { id:'sahabiyyat', title:'Sahabiyyat', subtitle:'Des femmes au parcours marquant', icon:'flower-outline', gender:'girl', tag:'sahabiyya' },
  { id:'short', title:'Prénoms courts', subtitle:'Simples à dire et à retenir', icon:'flash-outline', tag:'court' },
  { id:'france', title:'Faciles en français', subtitle:'Prononciation naturelle au quotidien', icon:'chatbubble-ellipses-outline', tag:'facile-france' },
  { id:'faith', title:'Autour de la foi', subtitle:'Sens et associations spirituelles', icon:'moon-outline', tag:'foi' },
  { id:'rare', title:'Plus rares', subtitle:'Des choix moins courants', icon:'diamond-outline', tag:'rare' },
  { id:'soft', title:'Sens doux', subtitle:'Paix, douceur et belles qualités', icon:'heart-outline', tag:'doux' },
];

export function namesForCollection(collection: NameCollection): MuslimName[] {
  return MUSLIM_NAMES.filter((item) => {
    if (collection.ids && !collection.ids.includes(item.id)) return false;
    if (collection.gender && item.gender !== collection.gender) return false;
    if (collection.tag && !item.tags.includes(collection.tag)) return false;
    return true;
  });
}

export function getDailyName(date = new Date()) {
  const stamp = Number(`${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`);
  return VERIFIED_NAMES[stamp % VERIFIED_NAMES.length];
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
