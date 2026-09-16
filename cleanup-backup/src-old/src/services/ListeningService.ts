import type { OfflineRepository, ListeningPosition } from '../core/offline';
import type { AudioQuery, AudioRepository } from '../core/repositories';

export class ListeningService {
  constructor(
    private readonly audio: AudioRepository,
    private readonly offline: OfflineRepository,
  ) {}

  getTrack(surahId: number, query?: AudioQuery) {
    return this.audio.getTrack(surahId, query);
  }

  getReciters(language?: string) {
    return this.audio.getReciters(language);
  }

  resume() {
    return this.offline.getLastListening();
  }

  saveProgress(position: ListeningPosition) {
    return this.offline.saveLastListening(position);
  }
}
