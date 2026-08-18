import type { TadabburSettings } from './TadabburSettings';

export type TadabburExtensionId = 'tafsir' | 'dalil' | 'favorite' | 'note';

export interface TadabburExtensionContext {
  surahId: number;
  verseId: number;
}

/** Future post-verse actions register here. No extension is rendered in this sprint. */
export interface TadabburExtensionPoint {
  id: TadabburExtensionId;
  run(context: TadabburExtensionContext): Promise<void>;
}

export interface TadabburVerseState {
  surahId: number;
  verseId: number;
  progress: number;
}

export interface TadabburModeState {
  isActive: boolean;
  settings: TadabburSettings;
  verse: TadabburVerseState | null;
}

export interface TadabburVerseCompletion {
  verse: TadabburVerseState;
  pauseMilliseconds: number;
  extensions: readonly TadabburExtensionPoint[];
}
