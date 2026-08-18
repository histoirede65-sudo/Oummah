import { Surah } from "../data/surahs";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export class QuranFoundationService {
  static async getSurahs(): Promise<Surah[]> {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/quran-foundation`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const chapters = await response.json();

    return chapters.map((chapter: any) => ({
      id: chapter.id,
      arabicName: chapter.nameArabic,
      frenchName: chapter.translatedName?.name ?? chapter.nameSimple,
      transliteration: chapter.nameSimple,
      verses: chapter.versesCount,
      revelationType:
        chapter.revelationPlace === "madinah"
          ? "Médine"
          : "Mecque",
      juzStart: chapter.pages?.[0] ?? 1,
    }));
  }
}