import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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
const LANGUAGE_STORAGE_KEY = '@oummah/language/v1';

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
  const [language, setStoredLanguage] = useState<LanguageCode>(initialLanguage ?? deviceLanguage);
  const definition = languages[language];

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((storedLanguage) => {
        if (active && storedLanguage && storedLanguage in languages) {
          setStoredLanguage(storedLanguage as LanguageCode);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    setStoredLanguage(nextLanguage);
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage).catch(() => undefined);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const isRTL = definition.direction === 'rtl';
    return {
      language,
      direction: definition.direction,
      isRTL,
      setLanguage,
      t: (key, values) => {
        const message = definition.catalog[key] ?? fr[key];
        return interpolate(typeof message === 'string' ? message : String(key), values);
      },
      rowStyle: { flexDirection: isRTL ? 'row-reverse' : 'row' },
      textStyle: { textAlign: isRTL ? 'right' : 'left', writingDirection: definition.direction },
    };
  }, [definition, language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider.');
  return context;
}
