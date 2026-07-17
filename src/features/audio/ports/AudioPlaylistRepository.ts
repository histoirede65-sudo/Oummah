import type { StoredAudioPlaylist } from '../domain/audio';

export interface AudioPlaylistRepository {
  getAll(): Promise<readonly StoredAudioPlaylist[]>;
  getById(id: string): Promise<StoredAudioPlaylist | null>;
  save(playlist: StoredAudioPlaylist): Promise<void>;
  remove(id: string): Promise<void>;
}
