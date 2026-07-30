import type { AudioTrack } from '../domain/audio';
import type { AudioSourceRepository } from '../ports/AudioSourceRepository';

export class AudioSourceService {
  constructor(private readonly repository: AudioSourceRepository) {}

  resolve(track: AudioTrack) {
    return this.repository.resolve(track);
  }
}
