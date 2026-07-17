import { SURAHS } from '../../../data/surahs';
import { MockReciterDataSource } from './MockReciterDataSource';

export type MockAudioTrackDto = {
  surah_id: number;
  surah_name: string;
  reciter_id: string;
  reciter_name: string;
  reciter_style: 'murattal' | 'mujawwad' | 'other';
  reciter_country: string;
  reciter_photo: string;
  audio_source: string;
  audio_url: string;
};

const DEFAULT_RECITER_ID = 'mishary-alafasy';

export class MockAudioDataSource {
  constructor(private readonly reciters: MockReciterDataSource) {}

  async getTrack(surahId: number, reciterId = DEFAULT_RECITER_ID): Promise<MockAudioTrackDto> {
    const surah = SURAHS.find((item) => item.id === surahId) ?? SURAHS[0];
    const selected = await this.reciters.get(reciterId) ?? await this.reciters.get(DEFAULT_RECITER_ID);
    if (!selected) throw new Error('Mock reciter catalog is empty.');
    const fileName = String(surah.id).padStart(3, '0');

    return {
      surah_id: surah.id,
      surah_name: surah.transliteration,
      reciter_id: selected.id,
      reciter_name: selected.name,
      reciter_style: selected.style,
      reciter_country: selected.country,
      reciter_photo: selected.photoUri ?? '',
      audio_source: selected.audioSource,
      audio_url: `mock-audio://quran/${selected.id}/${fileName}.mp3`,
    };
  }

  async listTracks(reciterId = DEFAULT_RECITER_ID) {
    return Promise.all(SURAHS.map((surah) => this.getTrack(surah.id, reciterId)));
  }

  async listReciters() {
    return [...await this.reciters.list()];
  }
}
