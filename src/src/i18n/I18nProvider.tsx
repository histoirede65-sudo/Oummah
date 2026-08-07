import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { I18nManager, type FlexStyle, type TextStyle } from 'react-native';

import { defaultLanguage, languages, resolveLanguage, type LanguageCode, type TextDirection } from './config';
import { fr, type TranslationKey } from './fr';

type TranslationValues = Record<string, string | number>;

export interface I18nContextValue {
  language: LanguageCode;
  direction: TextDirection;
  isRTL: boolean;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  rowStyle: Pick<FlexStyle, 'flexDirection'>;
  textStyle: Pick<TextStyle, 'textAlign' | 'writingDirection'>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function deviceLanguage(): LanguageCode {
  try {
    return resolveLanguage(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return defaultLanguage;
  }
}

function interpolate(message: string, values?: TranslationValues): string {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (match, name: string) => (
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
  ));
}

I18nManager.allowRTL(true);
I18nManager.swapLeftAndRightInRTL?.(true);

export function I18nProvider({ children, initialLanguage }: { children: ReactNode; initialLanguage?: LanguageCode }) {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage ?? deviceLanguage);
  const definition = languages[language];

  const value = useMemo<I18nContextValue>(() => {
    const isRTL = definition.direction === 'rtl';
    return {
      language,
      direction: definition.direction,
      isRTL,
      setLanguage,
      t: (key, values) => interpolate(definition.catalog[key] ?? fr[key], values),
      rowStyle: { flexDirection: isRTL ? 'row-reverse' : 'row' },
      textStyle: { textAlign: isRTL ? 'right' : 'left', writingDirection: definition.direction },
    };
  }, [definition, language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider.');
  return context;
}
