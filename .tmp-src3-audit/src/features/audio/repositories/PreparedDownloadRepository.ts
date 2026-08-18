import type { AudioDownload, DownloadRepository } from '../../../core/repositories';
import { storageService, type StorageServiceContract } from '../../../core/storage';
import type { AudioTrack } from '../../../core/audio';

const PREFIX = 'oummah:audio:download:v1:';

/** Persists download intent only. Actual file transfer is intentionally deferred. */
export class PreparedDownloadRepository implements DownloadRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}

  get(trackId: string) {
    return this.storage.get<AudioDownload>(`${PREFIX}${trackId}`);
  }

  async getAll() {
    const keys = (await this.storage.keys()).filter((key) => key.startsWith(PREFIX));
    const downloads = await Promise.all(keys.map((key) => this.storage.get<AudioDownload>(key)));
    return downloads.filter((item): item is AudioDownload => item !== null);
  }

  async prepare(track: AudioTrack): Promise<AudioDownload> {
    const download: AudioDownload = { trackId: track.id, state: 'queued', progress: 0 };
    await this.storage.set(`${PREFIX}${track.id}`, download);
    return download;
  }

  remove(trackId: string) {
    return this.storage.remove(`${PREFIX}${trackId}`);
  }
}
