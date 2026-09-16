import { quranFoundationRepository } from "./QuranFoundationRepository";
import type {
    QuranFoundationRecitation,
    QuranFoundationReciter,
    QuranFoundationSurah,
    QuranFoundationVerse,
} from "./QuranFoundationTypes";

export class QuranDataEngine {
  private surahs?: QuranFoundationSurah[];
  private reciters?: QuranFoundationReciter[];

  async getSurahs(): Promise<QuranFoundationSurah[]> {
    if (this.surahs) {
      return this.surahs;
    }

    this.surahs =
      await quranFoundationRepository.getSurahs();

    return this.surahs;
  }

  async getSurah(
    id: number,
  ): Promise<QuranFoundationSurah | undefined> {
    const surahs = await this.getSurahs();

    return surahs.find((s) => s.id === id);
  }

  async getReciters(): Promise<QuranFoundationReciter[]> {
    if (this.reciters) {
      return this.reciters;
    }

    this.reciters =
      await quranFoundationRepository.getReciters();

    return this.reciters;
  }

  async getReciter(
    id: number,
  ): Promise<QuranFoundationReciter | undefined> {
    const reciters = await this.getReciters();

    return reciters.find((r) => r.id === id);
  }

  async getVerses(
    surahId: number,
  ): Promise<QuranFoundationVerse[]> {
    return quranFoundationRepository.getVerses(
      surahId,
    );
  }

  async getRecitation(
    reciterId: number,
    surahId: number,
  ): Promise<QuranFoundationRecitation> {
    return quranFoundationRepository.getRecitation(
      String(reciterId),
      surahId,
    );
  }

  clear() {
    this.surahs = undefined;
    this.reciters = undefined;
  }
}

export const quranDataEngine =
  new QuranDataEngine();