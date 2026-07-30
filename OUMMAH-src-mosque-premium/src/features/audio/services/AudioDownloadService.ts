import type { AudioTrack } from '../../../core/audio';
import type { DownloadRepository } from '../../../core/repositories';
import { hapticsService } from '../../../core/settings';

export class AudioDownloadService {
  constructor(private readonly repository: DownloadRepository) {}

  async prepare(track: AudioTrack) {
    const download = await this.repository.prepare(track);
    void hapticsService.download();
    return download;
  }

  status(trackId: string) {
    return this.repository.get(trackId);
  }

  list() {
    return this.repository.getAll();
  }

  remove(trackId: string) {
    return this.repository.remove(trackId);
  }
}
