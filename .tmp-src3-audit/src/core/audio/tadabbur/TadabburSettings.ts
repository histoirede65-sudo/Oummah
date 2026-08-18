export const TADABBUR_PAUSE_OPTIONS = [0, 2, 5, 10] as const;
export type TadabburPauseSeconds = typeof TADABBUR_PAUSE_OPTIONS[number];

export interface TadabburSettings {
  pauseAfterVerseSeconds: TadabburPauseSeconds;
}

/** Mock preference until settings persistence is connected. */
export const DEFAULT_TADABBUR_SETTINGS: Readonly<TadabburSettings> = {
  pauseAfterVerseSeconds: 2,
};
