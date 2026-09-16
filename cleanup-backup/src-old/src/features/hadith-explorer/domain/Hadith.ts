import type { HadithGradeKind } from "./HadithGrade";

export type Hadith = {
  id: string;
  title: string;
  arabic: string;
  french: string;
  attribution: string;
  grade: string;
  gradeKind: HadithGradeKind;
  explanation: string;
  lessons: string[];
  categories: string[];
  reference: string;
  sourceName: "HadeethEnc";
  sourceUrl: string;
  sourceVersion: "Flux API courant";
};

export type HadithSummary = Pick<Hadith, "id" | "title"> & {
  translations: string[];
};


