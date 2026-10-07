import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
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

const isLanguage = (value: string | null): value is LanguageCode => value !== null && value in languages;

/**
 * Langue enregistrée, lue dès le chargement du module : notifications et widgets l'attendent
 * avant de se synchroniser, pour ne pas être programmés en français chez un utilisateur anglais.
 */
/**
 * Langue du téléphone au premier lancement : anglais seulement si la première langue choisie dans les
 * réglages du téléphone est l'anglais. (Intl ne convient pas : sur iPhone, il donne la langue que iOS
 * attribue à l'app, l'anglais par défaut, même sur un téléphone en français.)
 */
function deviceLanguage(): LanguageCode {
  try {
    return getLocales()[0]?.languageCode === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

// Un choix déjà enregistré (dont « fr » chez tous les utilisateurs actuels) l'emporte toujours ;
// la langue du téléphone ne sert qu'à une première installation.
export const languageReady: Promise<LanguageCode> = AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
  .then((stored) => (isLanguage(stored) ? stored : deviceLanguage()))
  .catch(() => 'fr' as LanguageCode)
  .then((stored) => {
    setActiveLanguage(stored);
    return stored;
  });

const languageChangeListeners = new Set<(language: LanguageCode) => void>();

/** Appelé quand l'utilisateur change de langue (pas au démarrage). */
export function subscribeLanguageChange(listener: (language: LanguageCode) => void) {
  languageChangeListeners.add(listener);
  return () => {
    languageChangeListeners.delete(listener);
  };
}

export function I18nProvider({ children }: { children: ReactNode; initialLanguage?: LanguageCode }) {
  const [language, setStoredLanguage] = useState<LanguageCode>('fr');
  const definition = languages[language];

  useEffect(() => {
    setActiveLanguage(language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    void languageReady.then((stored) => {
      if (!cancelled) setStoredLanguage(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    // Active la langue tout de suite pour les services, avant le prochain rendu.
    setActiveLanguage(nextLanguage);
    setStoredLanguage(nextLanguage);
    void AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
      .catch(() => undefined)
      .then(() => languageChangeListeners.forEach((listener) => listener(nextLanguage)));
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
