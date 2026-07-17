import type { AudioTrack, Playlist, QueueItem } from './types';

export class AudioQueue {
  private playlist: Playlist | null = null;
  private index = -1;

  setPlaylist(playlist: Playlist, startItemId?: string) {
    this.playlist = { ...playlist, items: [...playlist.items] };
    this.index = startItemId
      ? playlist.items.findIndex((item) => item.id === startItemId)
      : playlist.items.length > 0 ? 0 : -1;
    if (this.index < 0 && playlist.items.length > 0) this.index = 0;
  }

  setSingle(track: AudioTrack) {
    this.setPlaylist({
      id: `single:${track.id}`,
      title: track.title,
      items: [{ id: track.id, track }],
    });
  }

  select(itemId: string) {
    const index = this.playlist?.items.findIndex((item) => item.id === itemId) ?? -1;
    if (index < 0) return null;
    this.index = index;
    return this.current();
  }

  selectTrack(predicate: (track: AudioTrack) => boolean) {
    const item = this.playlist?.items.find((candidate) => predicate(candidate.track));
    return item ? this.select(item.id) : null;
  }

  current(): QueueItem | null {
    return this.playlist?.items[this.index] ?? null;
  }

  next() {
    if (!this.playlist || this.index + 1 >= this.playlist.items.length) return null;
    this.index += 1;
    return this.current();
  }

  previous() {
    if (!this.playlist || this.index <= 0) return null;
    this.index -= 1;
    return this.current();
  }

  snapshot() {
    return { playlist: this.playlist, index: this.index, current: this.current() };
  }
}
