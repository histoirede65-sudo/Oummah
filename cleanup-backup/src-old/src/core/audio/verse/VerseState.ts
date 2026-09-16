export const VERSE_HIGHLIGHT_MODES = ['reading', 'study', 'focus'] as const;
export type VerseHighlightMode = typeof VERSE_HIGHLIGHT_MODES[number];

export interface WordTiming {
  id: string;
  wordIndex: number;
  startSeconds: number;
  endSeconds: number;
}

export interface VerseTiming {
  verseId: number;
  startSeconds: number;
  endSeconds: number;
  words?: readonly WordTiming[];
}

export interface ActiveWordState {
  id: string;
  wordIndex: number;
  progress: number;
}

export interface VerseProgressState {
  verseId: number | null;
  progress: number;
  activeWord: ActiveWordState | null;
}

export interface VersePlaybackState extends VerseProgressState {
  positionSeconds: number;
  highlightMode: VerseHighlightMode;
}

export interface VerseHighlightState {
  verseId: number;
  isActive: boolean;
  isDimmed: boolean;
  progress: number;
  highlightMode: VerseHighlightMode;
}

export const INITIAL_VERSE_PLAYBACK_STATE: Readonly<VersePlaybackState> = {
  positionSeconds: 0,
  verseId: null,
  progress: 0,
  activeWord: null,
  highlightMode: 'reading',
};
