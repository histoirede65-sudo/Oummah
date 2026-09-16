export type PlaybackClockListener = (positionSeconds: number) => void;

/** Receives time from any future player adapter; it never polls Expo Audio. */
export class PlaybackClock {
  private positionSeconds = 0;
  private readonly listeners = new Set<PlaybackClockListener>();

  getPosition() {
    return this.positionSeconds;
  }

  update(positionSeconds: number) {
    const position = Number.isFinite(positionSeconds) ? Math.max(0, positionSeconds) : 0;
    if (position === this.positionSeconds) return;
    this.positionSeconds = position;
    this.listeners.forEach((listener) => listener(position));
  }

  reset() {
    this.update(0);
  }

  subscribe(listener: PlaybackClockListener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  clear() {
    this.listeners.clear();
  }
}
