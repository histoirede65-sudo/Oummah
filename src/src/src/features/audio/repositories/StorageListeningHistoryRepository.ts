import type { ListeningHistoryEntry, ListeningHistoryRepository } from '../../../core/repositories';
import { storageService, type StorageServiceContract } from '../../../core/storage';

const KEY = 'oummah:audio:history:v3';
const MAX_ENTRIES = 20;

export class StorageListeningHistoryRepository implements ListeningHistoryRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}

  async getLast() {
    return (await this.getAll())[0] ?? null;
  }

  async getAll() {
    return await this.storage.get<readonly ListeningHistoryEntry[]>(KEY) ?? [];
  }

  async save(entry: ListeningHistoryEntry) {
    const history = await this.getAll();
    const next = [entry, ...history.filter((item) => item.trackId !== entry.trackId)]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, MAX_ENTRIES);
    await this.storage.set(KEY, next);
  }

  clear() {
    return this.storage.remove(KEY);
  }
}
