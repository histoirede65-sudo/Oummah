import { getTrackReciter, getTrackSurahId, type AudioTrack } from '../../../core/audio';
import type { AudioCatalogRepository } from '../ports/AudioCatalogRepository';

const FIRST_SURAH = 1;
const LAST_SURAH = 114;

export class AudioQueueService {
  constructor(private readonly catalog: AudioCatalogRepository) {}

  async previous(current: AudioTrack) {
    const surahId = getTrackSurahId(current);
    if (!surahId || surahId <= FIRST_SURAH) return null;
    return this.catalog.getTrack(surahId - 1, getTrackReciter(current).id);
  }

  async next(current: AudioTrack) {
    const surahId = getTrackSurahId(current);
    if (!surahId || surahId >= LAST_SURAH) return null;
    return this.catalog.getTrack(surahId + 1, getTrackReciter(current).id);
  }
}
