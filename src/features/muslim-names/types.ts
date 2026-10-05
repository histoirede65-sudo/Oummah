export type NameGender = 'boy' | 'girl';
export type NameStatus = 'recommended' | 'permitted' | 'note' | 'discouraged' | 'forbidden';
export type NameEditorialLevel = 'sourced' | 'reviewed' | 'catalogue';
export type NameSourceKind = 'quran' | 'hadith' | 'linguistic' | 'historical' | 'catalogue' | 'editorial';
export type NameSource = {
  kind: NameSourceKind;
  label: string;
  reference?: string;
  url?: string;
  supports: string[];
  note?: string;
};
export type NameTag =
  | 'court'
  | 'rare'
  | 'classique'
  | 'coranique'
  | 'prophete'
  | 'compagnon'
  | 'sahabiyya'
  | 'foi'
  | 'force'
  | 'sagesse'
  | 'doux'
  | 'facile-france';

export type MuslimName = {
  id: string;
  gender: NameGender;
  name: string;
  arabic: string;
  transliteration: string;
  pronunciation?: string;
  origin: string[];
  meaning: string;
  story: string;
  status: NameStatus;
  statusReason: string;
  variants: string[];
  tags: NameTag[];
  historicalRole?: string;
  quranReference?: string;
  sourceNote?: string;
  nuance?: string;
  language?: string[];
  culture?: string[];
  etymology?: string;
  meaningConfidence?: 'high' | 'medium' | 'to-review';
  sources?: NameSource[];
  editorialLevel?: NameEditorialLevel;
};
