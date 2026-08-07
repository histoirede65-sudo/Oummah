import { VerseProgressEngine } from './VerseProgressEngine';
import { INITIAL_VERSE_PLAYBACK_STATE, type VerseHighlightMode, type VersePlaybackState, type VerseTiming } from './VerseState';

export type VersePlaybackListener = (state: VersePlaybackState, previous: VersePlaybackState) => void;

/** Connects a playback position to verse state without knowing the audio player or React. */
export class VersePlaybackEngine {
  private state: VersePlaybackState = { ...INITIAL_VERSE_PLAYBACK_STATE };
  private readonly listeners = new Set<VersePlaybackListener>();

  constructor(private readonly progressEngine: VerseProgressEngine) {}

  getState() { return this.state; }

  setTimeline(timeline: readonly VerseTiming[]) {
    this.progressEngine.setTimeline(timeline);
    this.updatePosition(this.state.positionSeconds);
  }

  updatePosition(positionSeconds: number) {
    const position = Math.max(0, positionSeconds);
    this.publish({ ...this.state, ...this.progressEngine.calculate(position), positionSeconds: position });
  }

  setHighlightMode(highlightMode: VerseHighlightMode) {
    if (highlightMode !== this.state.highlightMode) this.publish({ ...this.state, highlightMode });
  }

  subscribe(listener: VersePlaybackListener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private publish(next: VersePlaybackState) {
    const previous = this.state;
    const sameWord = previous.activeWord?.id === next.activeWord?.id
      && previous.activeWord?.wordIndex === next.activeWord?.wordIndex
      && previous.activeWord?.progress === next.activeWord?.progress;
    if (previous.positionSeconds === next.positionSeconds && previous.highlightMode === next.highlightMode && previous.verseId === next.verseId && previous.progress === next.progress && sameWord) return;
    this.state = next;
    this.listeners.forEach((listener) => listener(next, previous));
  }
}
