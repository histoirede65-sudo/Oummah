import { resumeRepository, type ResumeRepository } from './ResumeRepository';
import type { ListeningSnapshot, ListeningSnapshotInput } from './ListeningSnapshot';

const SAVE_DELAY_MS = 750;

/** Debounces progress writes and supports an immediate lifecycle flush. */
export class ResumeService {
  private pending: ListeningSnapshot | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly repository: ResumeRepository = resumeRepository,
    private readonly saveDelayMs = SAVE_DELAY_MS,
  ) {}

  restore() {
    return this.repository.load();
  }

  snapshot(input: ListeningSnapshotInput): ListeningSnapshot {
    return {
      ...input,
      version: 1,
      updatedAt: new Date().toISOString(),
      positionSeconds: Math.max(0, input.positionSeconds),
      durationSeconds: Math.max(0, input.durationSeconds),
    };
  }

  schedule(input: ListeningSnapshotInput): ListeningSnapshot {
    const snapshot = this.snapshot(input);
    this.pending = snapshot;
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.timer = null;
        void this.flush().catch(() => undefined);
      }, this.saveDelayMs);
    }
    return snapshot;
  }

  async flush(input?: ListeningSnapshotInput): Promise<ListeningSnapshot | null> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const snapshot = input ? this.snapshot(input) : this.pending;
    this.pending = null;
    if (!snapshot) return null;
    try {
      await this.enqueue(() => this.repository.save(snapshot));
      return snapshot;
    } catch (error) {
      if (!this.pending) this.pending = snapshot;
      throw error;
    }
  }

  async clear() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.pending = null;
    await this.enqueue(() => this.repository.clear());
    this.pending = null;
  }

  private enqueue(operation: () => Promise<void>) {
    const queued = this.writeQueue.then(operation, operation);
    this.writeQueue = queued.catch(() => undefined);
    return queued;
  }
}

export const resumeService = new ResumeService();
