import { quranFoundationClient } from "./QuranFoundationClient";

export class QuranFoundationRepository {
  getSurahs() {
    return quranFoundationClient.getSurahs();
  }

  getVerses(surahId: number, language: "fr" | "en" = "fr") {
    console.info(`[verses] repository getVerses called surah=${surahId} language=${language}`);
    return quranFoundationClient.getVerses(surahId, language);
  }

  getReciters() {
    return quranFoundationClient.getReciters();
  }

  getRecitation(
    reciterId: string,
    surahId: number,
  ) {
    return quranFoundationClient.getRecitation(
      Number(reciterId),
      surahId,
    );
  }
}

export const quranFoundationRepository =
  new QuranFoundationRepository();
