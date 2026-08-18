import type { PlaybackSnapshot } from '../domain/audio';

export interface PlaybackStateRepository {
  load(): Promise<PlaybackSnapshot | null>;
  save(snapshot: PlaybackSnapshot): Promise<void>;
  clear(): Promise<void>;
}
