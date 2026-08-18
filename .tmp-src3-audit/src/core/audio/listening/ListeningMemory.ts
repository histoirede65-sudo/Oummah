import { storageService, type StorageServiceContract } from '../../storage';
import type { ListeningState } from './ListeningState';

const CURRENT_KEY = 'oummah:listening:current:v1';
const HISTORY_KEY = 'oummah:listening:history:v1';
const MAX_LOCAL_HISTORY = 40;

export interface ListeningMemoryRepository {
  loadCurrent(): Promise<ListeningState | null>;
  saveCurrent(state: ListeningState): Promise<void>;
  clearCurrent(): Promise<void>;
  history(): Promise<readonly ListeningState[]>;
}

/** Local-first memory. A Supabase implementation can later replace this port. */
export class ListeningMemory implements ListeningMemoryRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}

  loadCurrent() {
    return this.storage.get<ListeningState>(CURRENT_KEY);
  }

  async saveCurrent(state: ListeningState) {
    const history = await this.history();
    const withoutSameStop = history.filter((item) => item.stoppedAt !== state.stoppedAt);
    await Promise.all([
      this.storage.set(CURRENT_KEY, state),
      this.storage.set(HISTORY_KEY, [state, ...withoutSameStop].slice(0, MAX_LOCAL_HISTORY)),
    ]);
  }

  clearCurrent() {
    return this.storage.remove(CURRENT_KEY);
  }

  async history() {
    return await this.storage.get<readonly ListeningState[]>(HISTORY_KEY) ?? [];
  }
}

export const listeningMemory = new ListeningMemory();
