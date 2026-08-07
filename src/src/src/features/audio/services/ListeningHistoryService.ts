import type { ListeningHistoryEntry, ListeningHistoryRepository } from '../../../core/repositories';

export class ListeningHistoryService {
  constructor(private readonly repository: ListeningHistoryRepository) {}

  restore() {
    return this.repository.getLast();
  }

  list() {
    return this.repository.getAll();
  }

  save(entry: ListeningHistoryEntry) {
    return this.repository.save(entry);
  }

  clear() {
    return this.repository.clear();
  }
}
