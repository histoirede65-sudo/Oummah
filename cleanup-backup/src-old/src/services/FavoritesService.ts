import type { Favorite, OfflineRepository } from '../core/offline';
import { hapticsService } from '../core/settings';

export class FavoritesService {
  constructor(private readonly offline: OfflineRepository) {}

  list() {
    return this.offline.getFavorites();
  }

  async add(favorite: Favorite) {
    const favorites = await this.offline.getFavorites();
    if (favorites.some((item) => item.id === favorite.id)) return;
    await this.offline.saveFavorites([...favorites, favorite]);
    void hapticsService.favorite();
  }

  async remove(id: string) {
    const favorites = await this.offline.getFavorites();
    await this.offline.saveFavorites(favorites.filter((item) => item.id !== id));
    void hapticsService.favorite();
  }
}
