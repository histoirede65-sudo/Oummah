export interface FavoriteAudio {
  id: string;
  trackId: string;
  surahId: number;
  reciterId: string;
  createdAt: string;
}

export interface FavoriteAudioRepository {
  getAll(): Promise<readonly FavoriteAudio[]>;
  contains(trackId: string): Promise<boolean>;
  save(favorite: FavoriteAudio): Promise<void>;
  remove(trackId: string): Promise<void>;
}
