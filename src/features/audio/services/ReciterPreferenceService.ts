import type { PreferredReciterRepository, ReciterRepository } from '../../../core/repositories';
import { hapticsService } from '../../../core/settings';

const FALLBACK_RECITER_ID = 'mishary-alafasy';

export class ReciterPreferenceService {
  constructor(
    private readonly preferences: PreferredReciterRepository,
    private readonly reciters: ReciterRepository,
  ) {}

  async getDefaultId() {
    const preferredId = await this.preferences.get();
    if (!preferredId) return FALLBACK_RECITER_ID;
    return await this.reciters.getById(preferredId) ? preferredId : FALLBACK_RECITER_ID;
  }

  async setDefault(reciterId: string) {
    if (!await this.reciters.getById(reciterId)) throw new Error(`Unknown reciter: ${reciterId}`);
    await this.preferences.set(reciterId);
    void hapticsService.favorite();
    return reciterId;
  }

  clear() { return this.preferences.clear(); }
}
