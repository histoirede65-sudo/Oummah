export interface FavoriteReciterRepository {
  getAll(): Promise<readonly string[]>;
  contains(reciterId: string): Promise<boolean>;
  save(reciterId: string): Promise<void>;
  remove(reciterId: string): Promise<void>;
}
