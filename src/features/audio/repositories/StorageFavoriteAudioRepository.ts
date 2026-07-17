import type { FavoriteAudio, FavoriteAudioRepository } from '../../../core/repositories';
import { storageService, type StorageServiceContract } from '../../../core/storage';

const KEY = 'oummah:audio:favorites:v1';

export class StorageFavoriteAudioRepository implements FavoriteAudioRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}

  async getAll() {
    return await this.storage.get<readonly FavoriteAudio[]>(KEY) ?? [];
  }

  async contains(trackId: string) {
    return (await this.getAll()).some((favorite) => favorite.trackId === trackId);
  }

  async save(favorite: FavoriteAudio) {
    const favorites = await this.getAll();
    if (favorites.some((item) => item.trackId === favorite.trackId)) return;
    await this.storage.set(KEY, [...favorites, favorite]);
  }

  async remove(trackId: string) {
    await this.storage.set(KEY, (await this.getAll()).filter((favorite) => favorite.trackId !== trackId));
  }
}
