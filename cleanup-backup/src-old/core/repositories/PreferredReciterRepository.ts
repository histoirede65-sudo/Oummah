export interface PreferredReciterRepository {
  get(): Promise<string | null>;
  set(reciterId: string): Promise<void>;
  clear(): Promise<void>;
}
