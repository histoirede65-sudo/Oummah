import type { VersePlaybackEngine } from './VersePlaybackEngine';
import type { VerseHighlightState, VersePlaybackState } from './VerseState';

export type VerseHighlightListener = (state: VerseHighlightState) => void;
export type ActiveVerseListener = (verseId: number | null) => void;

/** Fans engine updates out only to verse rows whose visual state changed. */
export class VerseHighlightController {
  private readonly listeners = new Map<number, Set<VerseHighlightListener>>();
  private readonly activeVerseListeners = new Set<ActiveVerseListener>();
  private readonly unsubscribeEngine: () => void;

  constructor(private readonly engine: VersePlaybackEngine) {
    this.unsubscribeEngine = engine.subscribe((state, previous) => this.receive(state, previous));
  }

  getVerseState(verseId: number) {
    return this.snapshot(verseId, this.engine.getState());
  }

  subscribe(verseId: number, listener: VerseHighlightListener) {
    const listeners = this.listeners.get(verseId) ?? new Set<VerseHighlightListener>();
    listeners.add(listener);
    this.listeners.set(verseId, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.listeners.delete(verseId);
    };
  }

  /** A virtualized list can use this signal to center the active row in focus mode. */
  subscribeActiveVerse(listener: ActiveVerseListener) {
    this.activeVerseListeners.add(listener);
    return () => { this.activeVerseListeners.delete(listener); };
  }

  destroy() {
    this.unsubscribeEngine();
    this.listeners.clear();
    this.activeVerseListeners.clear();
  }

  private receive(state: VersePlaybackState, previous: VersePlaybackState) {
    if (state.highlightMode !== previous.highlightMode) {
      this.listeners.forEach((_, verseId) => this.notify(verseId, state));
      return;
    }
    if (state.verseId !== previous.verseId) {
      this.activeVerseListeners.forEach((listener) => listener(state.verseId));
      if (previous.verseId !== null) this.notify(previous.verseId, state);
      if (state.verseId !== null) this.notify(state.verseId, state);
      return;
    }
    if (state.verseId !== null && state.progress !== previous.progress) this.notify(state.verseId, state);
  }

  private notify(verseId: number, state: VersePlaybackState) {
    const snapshot = this.snapshot(verseId, state);
    this.listeners.get(verseId)?.forEach((listener) => listener(snapshot));
  }

  private snapshot(verseId: number, state: VersePlaybackState): VerseHighlightState {
    const isActive = state.verseId === verseId;
    return {
      verseId,
      isActive,
      isDimmed: state.highlightMode === 'focus' && !isActive,
      progress: isActive ? state.progress : 0,
      highlightMode: state.highlightMode,
    };
  }
}
