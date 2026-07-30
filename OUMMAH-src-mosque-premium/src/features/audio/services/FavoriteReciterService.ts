import type { FavoriteReciterRepository } from '../ports/FavoriteReciterRepository';
import { hapticsService } from '../../../core/settings';

export class FavoriteReciterService {
  constructor(private readonly repository: FavoriteReciterRepository) {}
  list() { return this.repository.getAll(); }
  async toggle(reciterId: string) {
    if (await this.repository.contains(reciterId)) {
      await this.repository.remove(reciterId);
      void hapticsService.favorite();
      return false;
    }
    await this.repository.save(reciterId);
    void hapticsService.favorite();
    return true;
  }
}
