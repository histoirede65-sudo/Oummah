import type { MuslimName } from './types';

export function normalizeNameSearch(value: string) {
  return value
    .toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘'ʿʾ]/g, '')
    .trim();
}

export function matchesNameSearch(item: MuslimName, query: string) {
  const normalized = normalizeNameSearch(query);
  if (!normalized) return true;
  return [
    item.name,
    item.arabic,
    item.transliteration,
    item.meaning,
    item.origin.join(' '),
    item.variants.join(' '),
  ].some((value) => normalizeNameSearch(value).includes(normalized));
}
