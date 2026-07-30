import { PlaybackClock } from './PlaybackClock';
import { VerseSyncEngine, type VerseState } from './VerseSyncEngine';
import type { VerseTimeline } from './VerseTimeline';

export type VerseStateListener = (state: VerseState, previous: VerseState) => void;

/** The only state exposed to a reader, highlighter, or scroll controller. */
export class VerseSyncService {
  private state: VerseState;
  private readonly listeners = new Set<VerseStateListener>();
  private readonly unsubscribeClock: () => void;

  constructor(
    private readonly engine: VerseSyncEngine,
    private readonly clock: PlaybackClock,
  ) {
    this.state = engine.synchronize(clock.getPosition());
    this.unsubscribeClock = clock.subscribe((position) => this.update(position));
  }

  getState() {
    return this.state;
  }

  setTimeline(timeline: VerseTimeline) {
    this.engine.setTimeline(timeline);
    this.update(this.clock.getPosition());
  }

  subscribe(listener: VerseStateListener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  destroy() {
    this.unsubscribeClock();
    this.listeners.clear();
  }

  private update(positionSeconds: number) {
    const previous = this.state;
    const state = this.engine.synchronize(positionSeconds);
    this.state = state;
    this.listeners.forEach((listener) => listener(state, previous));
  }
}
