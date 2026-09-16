import { ar } from './ar';
import { en } from './en';
import { fr, type TranslationKey } from './fr';

export type LanguageCode = 'fr' | 'en' | 'ar' | 'tr' | 'es';
export type TextDirection = 'ltr' | 'rtl';
export type TranslationCatalog = Partial<Record<TranslationKey, string>>;

export interface LanguageDefinition {
  code: LanguageCode;
  nativeName: string;
  direction: TextDirection;
  catalog: TranslationCatalog;
}

export const defaultLanguage: LanguageCode = 'fr';

export const languages: Record<LanguageCode, LanguageDefinition> = {
  fr: { code: 'fr', nativeName: 'Français', direction: 'ltr', catalog: fr },
  en: { code: 'en', nativeName: 'English', direction: 'ltr', catalog: en },
  ar: { code: 'ar', nativeName: 'العربية', direction: 'rtl', catalog: ar },
  tr: { code: 'tr', nativeName: 'Türkçe', direction: 'ltr', catalog: {} },
  es: { code: 'es', nativeName: 'Español', direction: 'ltr', catalog: {} },
};

export function resolveLanguage(locale?: string | null): LanguageCode {
  const code = locale?.split(/[-_]/)[0]?.toLowerCase();
  return code && code in languages ? code as LanguageCode : defaultLanguage;
}
