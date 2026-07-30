export interface RawHadeethEncRow {
  id: string;
  title: string;
  title_ar: string;
  hadith_text: string;
  hadith_text_ar: string;
  explanation: string;
  explanation_ar: string;
  benefits: string;
  benefits_ar: string;
  grade: string;
  grade_ar: string;
  takhrij: string;
  takhrij_ar: string;
  link: string;
}

export async function readWorkbook(): Promise<never> {
  throw new Error("À implémenter dans la livraison 02.");
}
