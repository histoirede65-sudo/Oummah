import type { AudioTrack } from '../domain/audio';

export interface AudioSourceRepository {
  resolve(track: AudioTrack): Promise<string>;
}
