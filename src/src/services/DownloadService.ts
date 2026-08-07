import type { AudioTrack } from '../core/audio';
import type { OfflineRepository } from '../core/offline';

export class DownloadService {
  constructor(private readonly offline: OfflineRepository) {}

  registerDownloadedTrack(track: AudioTrack, localUri: string) {
    return this.offline.saveAudioTrack({ ...track, localUri });
  }

  getDownloadedTrack(trackId: string) {
    return this.offline.getAudioTrack(trackId);
  }
}
