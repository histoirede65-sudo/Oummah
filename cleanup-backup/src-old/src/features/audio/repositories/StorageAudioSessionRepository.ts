import type { AudioSessionRepository, AudioSessionState } from '../../../core/audio';
import { storageService, type StorageServiceContract } from '../../../core/storage';

const KEY = 'oummah:audio:engine-session:v1';

export class StorageAudioSessionRepository implements AudioSessionRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}

  load() {
    return this.storage.get<AudioSessionState>(KEY);
  }

  save(session: AudioSessionState) {
    return this.storage.set(KEY, session);
  }

  clear() {
    return this.storage.remove(KEY);
  }
}
