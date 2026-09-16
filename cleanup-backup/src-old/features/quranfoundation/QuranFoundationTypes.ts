export interface QuranFoundationSurah {
  id: number;
  revelationPlace: "makkah" | "madinah";
  revelationOrder: number;
  bismillahPre: boolean;
  nameSimple: string;
  nameComplex: string;
  nameArabic: string;
  versesCount: number;
  pages: number[];
}

export interface QuranFoundationReciter {
  id: number;
  name: string;
  style?: {
    id: number;
    name: string;
  };
}

export interface QuranFoundationVerse {
  id: number;
  verseKey: string;
  textUthmani: string;
  textUthmaniSimple?: string;
  text?: string;
  audioUrl?: string;
  codeV1?: string;
  codeV2?: string;
  words?: {
    position?: number;
    wordPosition?: number;
    word_position?: number;
    text?: string;
    textUthmani?: string;
    text_uthmani?: string;
    codeV1?: string;
    codeV2?: string;
    charTypeName?: string;
    char_type_name?: string;
    translation?: {
      text?: string;
    };
    transliteration?: {
      text?: string;
    };
  }[];
  translation?: string;
  transliteration?: string;
  translations?: {
    text?: string;
    textResourceId?: number;
  }[];
  hizbNumber: number;
  juzNumber: number;
  pageNumber: number;
}

export interface QuranFoundationRecitation {
  audioUrl: string;
  timestamps?: {
    verseKey: string;
    timestampFrom: number;
    timestampTo: number;
    duration?: number;
    segments?: (readonly [number, number, number | null])[];
    audioUrl?: string;
    url?: string;
  }[];
  audioFiles?: {
    verseKey: string;
    audioUrl?: string;
    url?: string;
  }[];
}
