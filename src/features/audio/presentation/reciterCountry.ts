import type { LanguageCode } from '../../../i18n';

const ENGLISH_COUNTRIES: Readonly<Record<string, string>> = {
  'Arabie saoudite': 'Saudi Arabia',
  'Égypte': 'Egypt',
  'Koweït': 'Kuwait',
  'Somalie': 'Somalia',
  'Yémen': 'Yemen',
};

export function localizeReciterCountry(country: string, language: LanguageCode) {
  return language === 'en' ? ENGLISH_COUNTRIES[country] ?? country : country;
}
