export type HadithCategory =
  | "Foi"
  | "Adoration"
  | "Comportement"
  | "Relations"
  | "Savoir";

export type Hadith = {
  id: string;
  category: HadithCategory;
  title: string;
  text: string;
  narrator: string;
  source: string;
  lesson: string;
};
