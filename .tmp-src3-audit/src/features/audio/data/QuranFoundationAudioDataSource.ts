import { quranFoundationRepository } from "../../quranfoundation/QuranFoundationRepository";

export type QuranAudioTrackDto = {
  surah_id: number;
  surah_name: string;
  reciter_id: string;
  reciter_name: string;
  reciter_style: "murattal" | "mujawwad" | "other";
  reciter_country: string;
  reciter_photo: string;
  audio_source: string;
  audio_url: string;
  timestamps?: any[];
};

export class QuranFoundationAudioDataSource {
  async getTrack(
    surahId: number,
    reciterId: string,
  ): Promise<QuranAudioTrackDto> {
    const [surahs, reciters, audio] = await Promise.all([
      quranFoundationRepository.getSurahs() as Promise<any[]>,
      quranFoundationRepository.getReciters() as Promise<any[]>,
      quranFoundationRepository.getRecitation(
        reciterId,
        surahId,
      ) as Promise<any>,
    ]);

    const surah = surahs.find(
      (s) => s.id === surahId,
    );

    const reciter = reciters.find(
      (r) => String(r.id) === reciterId,
    );

    if (!surah) {
      throw new Error(
        `Surah ${surahId} introuvable.`,
      );
    }

    if (!reciter) {
      throw new Error(
        `Récitateur ${reciterId} introuvable.`,
      );
    }

    return {
      surah_id: surah.id,
      surah_name: surah.nameSimple,

      reciter_id: String(reciter.id),
      reciter_name: reciter.name,

      reciter_style:
        reciter.style?.name?.toLowerCase() === "mujawwad"
          ? "mujawwad"
          : "murattal",

      reciter_country: "",

      reciter_photo: String(reciter.id),

      audio_source: "Quran Foundation",

      audio_url: audio.audioUrl,

      timestamps: audio.timestamps,
    };
  }

  async listTracks(reciterId: string) {
    const surahs =
      await quranFoundationRepository.getSurahs() as any[];

    return Promise.all(
      surahs.map((surah) =>
        this.getTrack(surah.id, reciterId),
      ),
    );
  }

  async listReciters() {
    return quranFoundationRepository.getReciters() as Promise<any[]>;
  }
}