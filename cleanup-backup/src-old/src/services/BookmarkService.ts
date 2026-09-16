import type { Bookmark, OfflineRepository } from '../core/offline';
import { hapticsService } from '../core/settings';

export class BookmarkService {
  constructor(private readonly offline: OfflineRepository) {}

  list() {
    return this.offline.getBookmarks();
  }

  async add(bookmark: Bookmark) {
    const bookmarks = await this.offline.getBookmarks();
    if (bookmarks.some((item) => item.id === bookmark.id)) return;
    await this.offline.saveBookmarks([...bookmarks, bookmark]);
    void hapticsService.bookmark();
  }

  async remove(id: string) {
    const bookmarks = await this.offline.getBookmarks();
    await this.offline.saveBookmarks(bookmarks.filter((item) => item.id !== id));
    void hapticsService.bookmark();
  }
}
