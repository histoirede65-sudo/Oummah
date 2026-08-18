import {
    QuranFoundationAudioDataSource,
    type QuranAudioTrackDto,
} from "../data/QuranFoundationAudioDataSource";
import { QuranFoundationReciterDataSource } from "../data/QuranFoundationReciterDataSource";
import type { AudioTrack } from "../domain/audio";
import type { AudioCatalogRepository } from "../ports/AudioCatalogRepository";

function mapTrack(dto: QuranAudioTrackDto): AudioTrack {
  const reciter = {
    id: dto.reciter_id,
    name: dto.reciter_name,
    style: dto.reciter_style,
    language: "ar",
    country: dto.reciter_country,
    photoUri: dto.reciter_photo,
    audioSource: dto.audio_source,
  } as const;

  return {
    id: `${dto.reciter_id}:${dto.surah_id}`,
    contentType: "quran",
    contentId: String(dto.surah_id),
    surahId: dto.surah_id,
    title: dto.surah_name,

    creator: reciter,
    reciter,

    source: {
      uri: dto.audio_url,
    },

    remoteUri: dto.audio_url,

    quran: {
      surahId: dto.surah_id,
      reciter,
    },
  };
}

export class QuranAudioRepository
  implements AudioCatalogRepository
{
  private readonly reciterDataSource =
    new QuranFoundationReciterDataSource();

  constructor(
    private readonly dataSource: QuranFoundationAudioDataSource,
  ) {}

  async getTrack(
    surahId: number,
    reciterId?: string,
  ) {
    return mapTrack(
      await this.dataSource.getTrack(
        surahId,
        reciterId ?? "7",
      ),
    );
  }

  async listTracks(reciterId?: string) {
    return (
      await this.dataSource.listTracks(
        reciterId ?? "7",
      )
    ).map(mapTrack);
  }

  async listReciters() {
    return this.reciterDataSource.list();
  }
}