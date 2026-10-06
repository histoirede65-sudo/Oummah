import { storageService } from '../../../core/storage';

/** The reader's bookmark in the Mushaf pages: one page, placed and removed by hand. */
export type MushafBookmark = { surahId: number; page: number; savedAt: string };

const KEY = 'oummah:quran:mushaf-bookmark:v1';

export const mushafBookmarkStore = {
  async load(): Promise<MushafBookmark | null> {
    const value = await storageService.get<MushafBookmark>(KEY).catch(() => null);
    return value && Number.isInteger(value.page) && Number.isInteger(value.surahId) ? value : null;
  },
  async save(surahId: number, page: number): Promise<MushafBookmark> {
    const bookmark = { surahId, page, savedAt: new Date().toISOString() };
    await storageService.set(KEY, bookmark);
    return bookmark;
  },
  clear() {
    return storageService.remove(KEY);
  },
};
