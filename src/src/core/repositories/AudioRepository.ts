import type { AudioReciter, AudioTrack } from '../audio';

export interface AudioQuery {
  language?: string;
  reciterId?: string | number;
}

export interface AudioRepository {
  getReciters(language?: string): Promise<readonly AudioReciter[]>;
  getTrack(surahId: number, query?: AudioQuery): Promise<AudioTrack | null>;
}
