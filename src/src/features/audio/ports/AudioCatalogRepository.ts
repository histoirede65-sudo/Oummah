import type { AudioTrack, CatalogReciter } from '../domain/audio';

export interface AudioCatalogRepository {
  getTrack(surahId: number, reciterId?: string): Promise<AudioTrack>;
  listTracks(reciterId?: string): Promise<AudioTrack[]>;
  listReciters(): Promise<CatalogReciter[]>;
}
