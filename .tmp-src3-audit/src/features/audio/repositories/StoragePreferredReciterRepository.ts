import type { PreferredReciterRepository } from '../../../core/repositories';
import { storageService, type StorageServiceContract } from '../../../core/storage';

const KEY = 'oummah:audio:preferred-reciter:v1';

export class StoragePreferredReciterRepository implements PreferredReciterRepository {
  constructor(private readonly storage: StorageServiceContract = storageService) {}
  get() { return this.storage.getString(KEY); }
  set(reciterId: string) { return this.storage.setString(KEY, reciterId); }
  clear() { return this.storage.remove(KEY); }
}
