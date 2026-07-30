import type { PlaybackSnapshot } from '../domain/audio';
import type { PlaybackStateRepository } from '../ports/PlaybackStateRepository';

export class PlaybackPersistenceService {
  constructor(private readonly repository: PlaybackStateRepository) {}

  restore() {
    return this.repository.load();
  }

  persist(snapshot: PlaybackSnapshot) {
    return this.repository.save(snapshot);
  }

  clear() {
    return this.repository.clear();
  }
}
