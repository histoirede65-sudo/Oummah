import { getActiveLanguage } from '../../i18n';
import { TAHAJJUD_EN } from './tahajjudEnglish';

type Values = readonly (string | number)[];

const fill = (text: string, values?: Values) =>
  values ? text.replace(/\{(\d+)\}/g, (match, index) => (values[Number(index)] !== undefined ? String(values[Number(index)]) : match)) : text;

/**
 * Tahajjud texts are written in French; the English text is looked up by the French one (tahajjudEnglish.ts).
 * Edge spaces are kept so JSX fragments around expressions still read correctly. {0}, {1}… are replaced by values.
 */
export function tx(french: string, values?: Values): string {
  if (getActiveLanguage() !== 'en') return fill(french, values);
  const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(french);
  const [, before, core, after] = match ?? ['', '', french, ''];
  return fill(`${before}${TAHAJJUD_EN[core] ?? core}${after}`, values);
}

/** Singular or plural form, both written in French with {0} for the count. */
export function txCount(count: number, one: string, many: string, values: Values = []): string {
  return tx(count > 1 ? many : one, [count, ...values]);
}

/** Locale used for dates and times in the Tahajjud screens. */
export function tahajjudLocale(): string {
  return getActiveLanguage() === 'en' ? 'en-GB' : 'fr-FR';
}
