import { PlaybackClock } from './PlaybackClock';
import { WordSyncEngine, type WordState } from './WordSyncEngine';
import type { WordTimeline } from './WordTimeline';

export type WordStateListener = (state: WordState, previous: WordState) => void;

/** Optional word-level service using the same clock as verse synchronization. */
export class WordSyncService {
  private state: WordState;
  private readonly listeners = new Set<WordStateListener>();
  private readonly unsubscribeClock: () => void;

  constructor(
    private readonly engine: WordSyncEngine,
    private readonly clock: PlaybackClock,
  ) {
    this.state = engine.synchronize(clock.getPosition());
    this.unsubscribeClock = clock.subscribe((position) => this.update(position));
  }

  getState() {
    return this.state;
  }

  setTimeline(timeline: WordTimeline) {
    this.engine.setTimeline(timeline);
    this.update(this.clock.getPosition());
  }

  subscribe(listener: WordStateListener) {
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
