import { getTrackReciter, getTrackSurahId, type AudioTrack } from '../../../core/audio';
import type { FavoriteAudioRepository } from '../../../core/repositories';
import { hapticsService } from '../../../core/settings';

export class FavoriteAudioService {
  constructor(private readonly repository: FavoriteAudioRepository) {}

  list() {
    return this.repository.getAll();
  }

  isFavorite(trackId: string) {
    return this.repository.contains(trackId);
  }

  async toggle(track: AudioTrack) {
    if (await this.repository.contains(track.id)) {
      await this.repository.remove(track.id);
      void hapticsService.favorite();
      return false;
    }
    await this.repository.save({
      id: `${track.id}:${Date.now()}`,
      trackId: track.id,
      surahId: getTrackSurahId(track) ?? 0,
      reciterId: getTrackReciter(track).id,
      createdAt: new Date().toISOString(),
    });
    void hapticsService.favorite();
    return true;
  }
}
