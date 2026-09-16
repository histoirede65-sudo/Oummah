import type { ListeningPosition, OfflineRepository, ReadingPosition } from '../core/offline';

export class HistoryService {
  constructor(private readonly offline: OfflineRepository) {}

  getLastReading() {
    return this.offline.getLastReading();
  }

  saveLastReading(position: ReadingPosition) {
    return this.offline.saveLastReading(position);
  }

  getLastListening() {
    return this.offline.getLastListening();
  }

  saveLastListening(position: ListeningPosition) {
    return this.offline.saveLastListening(position);
  }
}
