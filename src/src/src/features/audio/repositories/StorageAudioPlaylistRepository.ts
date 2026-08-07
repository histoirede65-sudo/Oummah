import { storageService, type StorageServiceContract } from '../../../core/storage';
import type { StoredAudioPlaylist } from '../domain/audio';
import type { AudioPlaylistRepository } from '../ports/AudioPlaylistRepository';

const KEY = 'oummah:audio:playlists:v1';

export class StorageAudioPlaylistRepository implements AudioPlaylistRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}

  async getAll() {
    return await this.storage.get<readonly StoredAudioPlaylist[]>(KEY) ?? [];
  }

  async getById(id: string) {
    return (await this.getAll()).find((playlist) => playlist.id === id) ?? null;
  }

  async save(playlist: StoredAudioPlaylist) {
    const playlists = await this.getAll();
    await this.storage.set(KEY, [playlist, ...playlists.filter((item) => item.id !== playlist.id)]);
  }

  async remove(id: string) {
    await this.storage.set(KEY, (await this.getAll()).filter((playlist) => playlist.id !== id));
  }
}
