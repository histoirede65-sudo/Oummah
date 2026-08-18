import type { AudioReciter } from '../audio';

export interface ReciterRepository {
  getAll(): Promise<readonly AudioReciter[]>;
  getById(id: string): Promise<AudioReciter | null>;
}
