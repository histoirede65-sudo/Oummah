import type { DownloadRepository, FavoriteAudioRepository, ListeningHistoryRepository } from '../../../core/repositories';
import type { AudioCatalogRepository } from '../ports/AudioCatalogRepository';
import type { ListeningHomeSnapshot, ListeningTrackItem } from '../domain/audio';

const POPULAR_SURAHS = [1, 2, 18, 36, 55, 67, 112, 113, 114];
const RECOMMENDED_SURAHS = [12, 19, 20, 48, 56, 78, 93, 94];

export class ListeningHomeService {
  constructor(
    private readonly catalog: AudioCatalogRepository,
    private readonly history: ListeningHistoryRepository,
    private readonly favorites: FavoriteAudioRepository,
    private readonly downloads: DownloadRepository,
  ) {}

  async load(currentReciterId: string): Promise<ListeningHomeSnapshot> {
    const [reciters, history, favorites, downloads] = await Promise.all([
      this.catalog.listReciters(),
      this.history.getAll(),
      this.favorites.getAll(),
      this.downloads.getAll(),
    ]);
    const reciterIds = new Set([currentReciterId, ...history.map((item) => item.reciterId), ...favorites.map((item) => item.reciterId), ...downloads.map((item) => item.trackId.split(':')[0])]);
    const tracks = (await Promise.all([...reciterIds].map((reciterId) => this.catalog.listTracks(reciterId)))).flat();
    const byId = new Map(tracks.map((track) => [track.id, track]));
    const toItem = (trackId: string): ListeningTrackItem | null => {
      const track = byId.get(trackId);
      if (!track) return null;
      return {
        track,
        history: history.find((item) => item.trackId === trackId),
        favorite: favorites.find((item) => item.trackId === trackId),
        download: downloads.find((item) => item.trackId === trackId),
      };
    };
    const compact = <T,>(items: readonly (T | null)[]) => items.filter((item): item is T => item !== null);
    const bySurah = (ids: readonly number[]) => compact(ids.map((id) => tracks.find((track) => track.quran?.surahId === id) ?? null));

    return {
      continueListening: history[0] ? toItem(history[0].trackId) : null,
      recentlyListened: compact(history.slice(0, 8).map((entry) => toItem(entry.trackId))),
      popularReciters: [...reciters].sort((left, right) => right.popularity - left.popularity).slice(0, 6),
      popularSurahs: bySurah(POPULAR_SURAHS),
      latestDownloads: compact(downloads.slice(-8).reverse().map((item) => toItem(item.trackId))),
      favorites: compact(favorites.slice(0, 8).map((item) => toItem(item.trackId))),
      recommendations: bySurah(RECOMMENDED_SURAHS),
    };
  }
}
