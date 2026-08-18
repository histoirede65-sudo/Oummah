import type { AudioTrack } from '../domain/audio';
import type { AudioCatalogRepository } from '../ports/AudioCatalogRepository';
import { MockAudioDataSource, type MockAudioTrackDto } from '../data/MockAudioDataSource';

function mapTrack(dto: MockAudioTrackDto): AudioTrack {
  const reciter = {
    id: dto.reciter_id,
    name: dto.reciter_name,
    style: dto.reciter_style,
    language: 'ar',
    country: dto.reciter_country,
    photoUri: dto.reciter_photo,
    audioSource: dto.audio_source,
  } as const;
  return {
    id: `${dto.reciter_id}:${dto.surah_id}`,
    contentType: 'quran',
    contentId: String(dto.surah_id),
    surahId: dto.surah_id,
    title: dto.surah_name,
    creator: reciter,
    reciter,
    source: { uri: dto.audio_url },
    remoteUri: dto.audio_url,
    quran: { surahId: dto.surah_id, reciter },
  };
}

export class MockAudioRepository implements AudioCatalogRepository {
  constructor(private readonly dataSource: MockAudioDataSource) {}
  async getTrack(surahId: number, reciterId?: string) { return mapTrack(await this.dataSource.getTrack(surahId, reciterId)); }
  async listTracks(reciterId?: string) { return (await this.dataSource.listTracks(reciterId)).map(mapTrack); }
  listReciters() { return this.dataSource.listReciters(); }
}
