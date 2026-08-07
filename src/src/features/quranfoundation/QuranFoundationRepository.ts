import { quranFoundationClient } from "./QuranFoundationClient";

export class QuranFoundationRepository {
  getSurahs() {
    return quranFoundationClient.getSurahs();
  }

  getVerses(surahId: number) {
    console.info(`[verses] repository getVerses called surah=${surahId}`);
    return quranFoundationClient.getVerses(surahId);
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
