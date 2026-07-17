import { storageService, type StorageServiceContract } from '../../../core/storage';
import type { PlaybackSnapshot } from '../domain/audio';
import type { PlaybackStateRepository } from '../ports/PlaybackStateRepository';

const STORAGE_KEY = 'oummah.audio.playback.v1';

export class SQLitePlaybackStateRepository implements PlaybackStateRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}

  async load() {
    const serialized = await this.storage.getString(STORAGE_KEY);
    if (!serialized) return null;
    try {
      const snapshot = JSON.parse(serialized) as PlaybackSnapshot;
      return snapshot.version === 1 ? snapshot : null;
    } catch {
      return null;
    }
  }

  async save(snapshot: PlaybackSnapshot) {
    await this.storage.setString(STORAGE_KEY, JSON.stringify(snapshot));
  }

  async clear() {
    await this.storage.remove(STORAGE_KEY);
  }
}
