import type { AudioTrack } from '../domain/audio';
import { getTrackUri } from '../../../core/audio';
import type { AudioSourceRepository } from '../ports/AudioSourceRepository';

export class LocalFirstAudioSourceRepository implements AudioSourceRepository {
  async resolve(track: AudioTrack) {
    return getTrackUri(track);
  }
}
