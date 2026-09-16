import type { AudioCatalogRepository } from '../ports/AudioCatalogRepository';

export class AudioCatalogService {
  constructor(private readonly repository: AudioCatalogRepository) {}

  getTrack(surahId: number, reciterId?: string) {
    return this.repository.getTrack(surahId, reciterId);
  }

  listTracks(reciterId?: string) {
    return this.repository.listTracks(reciterId);
  }

  listReciters() {
    return this.repository.listReciters();
  }
}
