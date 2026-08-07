import type { TadabburExtensionPoint, TadabburModeState, TadabburVerseCompletion, TadabburVerseState } from './TadabburMode';
import { DEFAULT_TADABBUR_SETTINGS, TADABBUR_PAUSE_OPTIONS, type TadabburPauseSeconds } from './TadabburSettings';

type TadabburListener = () => void;

const INITIAL_STATE: TadabburModeState = {
  isActive: false,
  settings: { ...DEFAULT_TADABBUR_SETTINGS },
  verse: null,
};

/** Owns Tadabbur state without knowing React, navigation, UI, or the audio engine. */
export class TadabburController {
  private state: TadabburModeState = INITIAL_STATE;
  private readonly listeners = new Set<TadabburListener>();
  private readonly extensions = new Map<string, TadabburExtensionPoint>();

  getSnapshot = () => this.state;

  subscribe = (listener: TadabburListener) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  activate() {
    if (!this.state.isActive) this.publish({ ...this.state, isActive: true });
  }

  deactivate() {
    if (this.state.isActive) this.publish({ ...this.state, isActive: false, verse: null });
  }

  toggle() {
    if (this.state.isActive) this.deactivate();
    else this.activate();
  }

  setPauseAfterVerse(seconds: TadabburPauseSeconds) {
    if (this.state.settings.pauseAfterVerseSeconds === seconds) return;
    this.publish({ ...this.state, settings: { ...this.state.settings, pauseAfterVerseSeconds: seconds } });
  }

  cyclePauseAfterVerse() {
    const current = TADABBUR_PAUSE_OPTIONS.indexOf(this.state.settings.pauseAfterVerseSeconds);
    this.setPauseAfterVerse(TADABBUR_PAUSE_OPTIONS[(current + 1) % TADABBUR_PAUSE_OPTIONS.length]);
  }

  updateVerse(verse: TadabburVerseState) {
    const previous = this.state.verse;
    if (previous?.surahId === verse.surahId && previous.verseId === verse.verseId && previous.progress === verse.progress) return;
    this.publish({ ...this.state, verse });
  }

  completeVerse(verse: TadabburVerseState): TadabburVerseCompletion {
    return {
      verse,
      pauseMilliseconds: this.state.settings.pauseAfterVerseSeconds * 1000,
      extensions: [...this.extensions.values()],
    };
  }

  registerExtension(extension: TadabburExtensionPoint) {
    this.extensions.set(extension.id, extension);
    return () => { this.extensions.delete(extension.id); };
  }

  private publish(state: TadabburModeState) {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
}

export const tadabburController = new TadabburController();
