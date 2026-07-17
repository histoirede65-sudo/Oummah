import type { AudioSessionState } from './types';

export interface AudioSessionRepository {
  load(): Promise<AudioSessionState | null>;
  save(session: AudioSessionState): Promise<void>;
  clear(): Promise<void>;
}

export class AudioSession {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pendingState: AudioSessionState | null = null;

  constructor(private readonly repository: AudioSessionRepository, private readonly saveIntervalMs = 500) {}

  restore() {
    return this.repository.load();
  }

  schedule(state: AudioSessionState) {
    this.pendingState = state;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      const pending = this.pendingState;
      this.pendingState = null;
      if (pending) void this.repository.save(pending).catch(() => undefined);
    }, this.saveIntervalMs);
  }

  async flush(state: AudioSessionState) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pendingState = null;
    await this.repository.save(state);
  }

  clear() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pendingState = null;
    return this.repository.clear();
  }
}
