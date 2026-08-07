const BASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL +
  "/functions/v1";

const ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

async function request<T>(url: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export type QuranChapter = {
  id: number;
  revelationPlace: "makkah" | "madinah";
  revelationOrder: number;
  bismillahPre: boolean;
  nameSimple: string;
  nameComplex: string;
  nameArabic: string;
  versesCount: number;
  pages: number[];
  translatedName: {
    languageName: string;
    name: string;
  };
};

export class QuranFoundationClient {
  static async getChapters(): Promise<QuranChapter[]> {
    return request<QuranChapter[]>("/quran-foundation");
  }

  static async getChapter(id: number) {
    return request(`/quran-content?chapter=${id}`);
  }

  static async getReciters() {
    return request("/quran-audio");
  }

  static async getAudio(
    chapter: number,
    reciter: number,
  ) {
    return request(
      `/quran-audio?chapter=${chapter}&reciter=${reciter}`,
    );
  }
}