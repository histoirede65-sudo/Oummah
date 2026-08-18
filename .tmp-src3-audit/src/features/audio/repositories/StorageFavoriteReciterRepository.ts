import { storageService, type StorageServiceContract } from '../../../core/storage';
import type { FavoriteReciterRepository } from '../ports/FavoriteReciterRepository';

const KEY = 'oummah:audio:favorite-reciters:v1';

export class StorageFavoriteReciterRepository implements FavoriteReciterRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}
  async getAll() { return await this.storage.get<readonly string[]>(KEY) ?? []; }
  async contains(reciterId: string) { return (await this.getAll()).includes(reciterId); }
  async save(reciterId: string) {
    const ids = await this.getAll();
    if (!ids.includes(reciterId)) await this.storage.set(KEY, [...ids, reciterId]);
  }
  async remove(reciterId: string) { await this.storage.set(KEY, (await this.getAll()).filter((id) => id !== reciterId)); }
}
