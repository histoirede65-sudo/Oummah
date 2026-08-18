import type { Playlist } from '../../../core/audio';
import type { DownloadRepository, FavoriteAudioRepository, ListeningHistoryRepository } from '../../../core/repositories';
import { hapticsService } from '../../../core/settings';
import type { ListeningPlaylistsSnapshot, StoredAudioPlaylist } from '../domain/audio';
import type { AudioCatalogRepository } from '../ports/AudioCatalogRepository';
import type { AudioPlaylistRepository } from '../ports/AudioPlaylistRepository';

export class AudioPlaylistService {
  constructor(
    private readonly repository: AudioPlaylistRepository,
    private readonly catalog: AudioCatalogRepository,
    private readonly favorites: FavoriteAudioRepository,
    private readonly history: ListeningHistoryRepository,
    private readonly downloads: DownloadRepository,
  ) {}

  listCustom() { return this.repository.getAll(); }
  async save(playlist: StoredAudioPlaylist) {
    await this.repository.save(playlist);
    void hapticsService.addToPlaylist();
  }
  remove(id: string) { return this.repository.remove(id); }

  async collections(currentReciterId: string): Promise<ListeningPlaylistsSnapshot> {
    const [custom, favorites, history, downloads] = await Promise.all([
      this.repository.getAll(),
      this.favorites.getAll(),
      this.history.getAll(),
      this.downloads.getAll(),
    ]);
    const reciterIds = new Set([currentReciterId, ...favorites.map((item) => item.reciterId), ...history.map((item) => item.reciterId), ...downloads.map((item) => item.trackId.split(':')[0])]);
    const tracks = (await Promise.all([...reciterIds].map((reciterId) => this.catalog.listTracks(reciterId)))).flat();
    const byId = new Map(tracks.map((track) => [track.id, track]));
    const create = (id: string, title: string, ids: readonly string[]): Playlist => ({
      id,
      title,
      items: ids.flatMap((trackId) => {
        const track = byId.get(trackId);
        return track ? [{ id: track.id, track }] : [];
      }),
    });
    const mine = custom.find((playlist) => playlist.id === 'my-playlist');
    return {
      favorites: create('favorites', 'Mes favoris', favorites.map((item) => item.trackId)),
      myPlaylist: create('my-playlist', 'Ma playlist', mine?.trackIds ?? []),
      recent: create('recent', 'Dernières écoutes', history.map((item) => item.trackId)),
      downloaded: create('downloaded', 'Téléchargées', downloads.map((item) => item.trackId)),
    };
  }
}
