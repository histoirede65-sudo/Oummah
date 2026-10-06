// Translation without React or React Native, so plain services (and their Node tests) can use it.
import { en } from './en/index';
import { fr, type TranslationKey } from './fr/index';

export type { TranslationKey };
export type TranslationValues = Record<string, string | number>;
type ActiveLanguage = 'fr' | 'en';

const catalogs: Record<ActiveLanguage, Partial<Record<TranslationKey, string>>> = { fr, en };

// Language of the mounted provider, for code that runs outside components
// (services building replies, notifications).
let activeLanguage: ActiveLanguage = 'fr';

export function setActiveLanguage(language: ActiveLanguage) {
  activeLanguage = language;
}

export function getActiveLanguage(): ActiveLanguage {
  return activeLanguage;
}

export function interpolate(message: string, values?: TranslationValues): string {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (match, name: string) => (
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
  ));
}

/** Same as useI18n().t, usable outside React components. */
export function translate(key: TranslationKey, values?: TranslationValues): string {
  const message = catalogs[activeLanguage][key] ?? fr[key];
  return interpolate(typeof message === 'string' ? message : String(key), values);
}

/**
 * Label table whose values are read in the active language at access time,
 * so module-level maps (`LABELS[status]`) stay usable as plain strings.
 */
export function localizedRecord<K extends string>(keys: Record<K, TranslationKey>): Record<K, string> {
  const record = {} as Record<K, string>;
  for (const key of Object.keys(keys) as K[]) {
    Object.defineProperty(record, key, { enumerable: true, get: () => translate(keys[key]) });
  }
  return record;
}
