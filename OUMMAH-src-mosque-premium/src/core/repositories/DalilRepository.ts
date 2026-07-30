export interface DalilEntry {
  id: string;
  title: string;
  body: string;
  reference?: string;
}

export interface DalilRepository {
  getDailyEntry(date: string, language?: string): Promise<DalilEntry | null>;
  explainVerse(verseKey: `${number}:${number}`, language?: string): Promise<DalilEntry | null>;
}
