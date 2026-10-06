import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import { storageService } from '../../../core/storage';
import { SURAHS } from '../../../data/surahs';

/** The reader's bookmark in the Mushaf pages: one page, placed and removed by hand. */
export type MushafBookmark = { surahId: number; page: number; savedAt: string };

const KEY = 'oummah:quran:mushaf-bookmark:v1';

type BookmarkWidgetModule = { publishQuranBookmark(payload: string | null): Promise<void> };

// The « Reprendre le Coran » widget lives in the prayer-times widget extension
// on iOS and in the scan-widget module on Android.
const bookmarkWidget = Platform.OS === 'ios'
  ? requireOptionalNativeModule<BookmarkWidgetModule>('PrayerTimesWidget')
  : Platform.OS === 'android'
    ? requireOptionalNativeModule<BookmarkWidgetModule>('ScanWidget')
    : null;

/** Copies the bookmark to the home/lock screen widget (null clears it). */
function publishToWidget(bookmark: MushafBookmark | null) {
  if (!bookmarkWidget?.publishQuranBookmark) return;
  const surah = bookmark ? SURAHS.find((item) => item.id === bookmark.surahId) : undefined;
  const payload = bookmark && surah
    ? JSON.stringify({ surahId: bookmark.surahId, page: bookmark.page, name: surah.transliteration, arabicName: surah.arabicName })
    : null;
  void bookmarkWidget.publishQuranBookmark(payload).catch(() => undefined);
}

export const mushafBookmarkStore = {
  async load(): Promise<MushafBookmark | null> {
    const value = await storageService.get<MushafBookmark>(KEY).catch(() => null);
    const bookmark = value && Number.isInteger(value.page) && Number.isInteger(value.surahId) ? value : null;
    // Keeps the widget in step with a bookmark placed before the widget existed.
    publishToWidget(bookmark);
    return bookmark;
  },
  async save(surahId: number, page: number): Promise<MushafBookmark> {
    const bookmark = { surahId, page, savedAt: new Date().toISOString() };
    await storageService.set(KEY, bookmark);
    publishToWidget(bookmark);
    return bookmark;
  },
  async clear() {
    await storageService.remove(KEY);
    publishToWidget(null);
  },
};
