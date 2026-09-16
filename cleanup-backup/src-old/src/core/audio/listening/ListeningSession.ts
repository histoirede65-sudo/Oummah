import type { ListeningMemoryRepository } from './ListeningMemory';
import { listeningMemory } from './ListeningMemory';
import type { ListeningState, ListeningStateInput } from './ListeningState';

/** Coordinates automatic listening memory without knowing React or an audio API. */
export class ListeningSession {
  constructor(private readonly memory: ListeningMemoryRepository = listeningMemory) {}

  restore() {
    return this.memory.loadCurrent();
  }

  history() {
    return this.memory.history();
  }

  async remember(input: ListeningStateInput): Promise<ListeningState> {
    const previous = await this.memory.loadCurrent().catch(() => null);
    const state: ListeningState = {
      ...input,
      version: 1,
      sessionId: input.sessionId ?? previous?.sessionId ?? `listening:${Date.now()}`,
      stoppedAt: new Date().toISOString(),
      positionSeconds: Math.max(0, input.positionSeconds),
    };
    await this.memory.saveCurrent(state);
    return state;
  }

  startNew() {
    return this.memory.clearCurrent();
  }
}

export const listeningSession = new ListeningSession();
