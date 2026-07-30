export type VerificationStatus = 'unverified' | 'partially_verified' | 'verified';

export interface SourceMetadata {
  name: string;
  url: string | null;
  license: string | null;
  corpusVersion: string;
  importedAt: string | null;
}

export interface SourceCollection {
  sourceId: string;
  nameArabic: string;
  nameFrench: string;
}

export interface SourceBook {
  number: number;
  sourceId: string;
  titleArabic: string;
  titleFrench: string;
}

export interface SourceChapter {
  number: number;
  sourceId: string;
  titleArabic: string;
  titleFrench: string;
}

export interface SourceTranslation {
  text: string;
  translator: string | null;
  sourceName: string;
  sourceUrl: string | null;
  sourceReference: string | null;
  license: string | null;
  verificationStatus: VerificationStatus;
}

export interface SourceExplanation {
  text: string;
  sourceName: string;
  sourceUrl: string | null;
  sourceReference: string | null;
  sourceItemId: string | null;
  license: string | null;
  verificationStatus: VerificationStatus;
}

export interface SourceLesson {
  order: number;
  text: string;
  sourceName: string;
  sourceUrl: string | null;
  sourceReference: string | null;
  sourceItemId: string | null;
  license: string | null;
  verificationStatus: VerificationStatus;
}

export interface SourceHadith {
  sourceHadithId: string;
  globalNumber: number;
  book: SourceBook;
  chapter: SourceChapter | null;
  hadithNumberInBook: number;
  arabicText: string;
  narrator: string | null;
  chainText: string | null;
  authenticityGrade: string | null;
  sourceReference: string | null;
  translationFrench: SourceTranslation | null;
  explanationFrench: SourceExplanation | null;
  lessonsFrench: SourceLesson[];
}

export interface SourceFile {
  source: SourceMetadata;
  collection: SourceCollection;
  hadiths: SourceHadith[];
}

export interface NormalizedCollection {
  slug: string;
  name: string;
  arabicName: string;
  sourceName: string;
  sourceUrl: string | null;
  license: string | null;
  corpusVersion: string;
  verificationStatus: VerificationStatus;
}

export interface NormalizedBook {
  sourceId: string;
  number: number;
  name: string;
  arabicName: string;
}

export interface NormalizedChapter {
  bookSourceId: string;
  sourceId: string;
  number: number;
  name: string;
  arabicName: string;
  sourceReference: string | null;
}

export interface NormalizedHadith {
  sourceHadithId: string;
  globalNumber: number;
  bookNumber: number;
  chapterNumber: number | null;
  hadithNumberInBook: number;
  arabicText: string;
  narrator: string | null;
  chainText: string | null;
  authenticityGrade: string | null;
  sourceReference: string | null;
  sourceName: string;
  sourceUrl: string | null;
  license: string | null;
  corpusVersion: string;
  verificationStatus: VerificationStatus;
  translation: SourceTranslation | null;
  explanation: SourceExplanation | null;
  lessons: SourceLesson[];
  hash: string;
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
}

export interface NormalizedCorpus {
  collection: NormalizedCollection;
  books: NormalizedBook[];
  chapters: NormalizedChapter[];
  hadiths: NormalizedHadith[];
  fileHash: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duplicates: string[];
}

export interface ImportReport {
  file: string;
  fileHash: string;
  corpusVersion: string;
  limit: number;
  collections: number;
  books: number;
  chapters: number;
  hadiths: number;
  translationsFrench: number;
  explanationsFrench: number;
  lessonsFrench: number;
  incompleteHadiths: number;
  errors: number;
  warnings: number;
  duplicates: string[];
}
