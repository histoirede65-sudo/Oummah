import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager, type FlexStyle, type TextStyle } from 'react-native';

import { languages, type LanguageCode, type TextDirection } from './config';
import { fr, type TranslationKey } from './fr';
import { interpolate, setActiveLanguage, type TranslationValues } from './translate';

export { getActiveLanguage, localizedRecord, translate } from './translate';

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

I18nManager.allowRTL(true);
I18nManager.swapLeftAndRightInRTL?.(true);

export function I18nProvider({ children }: { children: ReactNode; initialLanguage?: LanguageCode }) {
  // Version française uniquement : l'anglais reste dans le code pour une réactivation future,
  // mais ne peut plus être sélectionné ni restauré depuis un ancien réglage.
  const [language, setStoredLanguage] = useState<LanguageCode>('fr');
  const definition = languages[language];

  useEffect(() => {
    setActiveLanguage(language);
  }, [language]);

  useEffect(() => {
    // Réinitialise aussi les utilisateurs qui avaient déjà enregistré "en".
    setStoredLanguage('fr');
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr').catch(() => undefined);
  }, []);

  const setLanguage = useCallback((_nextLanguage: LanguageCode) => {
    // Garde volontairement l'API existante pour ne rien casser ailleurs.
    setStoredLanguage('fr');
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr').catch(() => undefined);
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
