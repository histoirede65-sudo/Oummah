import { storageService } from '../../core/storage';

export type ReadingTheme = 'dark' | 'light' | 'sepia';
export type ReadingMode = 'arabic' | 'arabic-translation' | 'arabic-transliteration' | 'translation' | 'mushaf';

export interface ReadingPreferences {
  mode: ReadingMode;
  theme: ReadingTheme;
  arabicSize: number;
  translationSize: number;
  lineSpacing: number;
  columnWidth: 'comfortable' | 'wide';
  showTransliteration: boolean;
}

export const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  mode: 'arabic-translation',
  theme: 'dark',
  arabicSize: 38,
  translationSize: 16,
  lineSpacing: 1.85,
  columnWidth: 'comfortable',
  showTransliteration: false,
};

const KEY = 'oummah:quran:reading-preferences:v2';

export const readingPreferencesStore = {
  async load() {
    return { ...DEFAULT_READING_PREFERENCES, ...await storageService.get<Partial<ReadingPreferences>>(KEY) };
  },
  save(value: ReadingPreferences) {
    return storageService.set(KEY, value);
  },
};
