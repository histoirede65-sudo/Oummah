import type {
  DownloadRepository,
  FavoriteAudioRepository,
} from "../../../core/repositories";

import { SURAHS } from "../../../data/surahs";

import type {
  AudioTrack,
  SurahCatalogItem,
  SurahFilter,
  SurahSort,
} from "../domain/audio";

import type { AudioCatalogRepository } from "../ports/AudioCatalogRepository";

export interface SurahCatalogQuery {
  reciterId: string;
  search?: string;
  sort?: SurahSort;
  filter?: SurahFilter;
}

export class SurahCatalogService {
  constructor(
    private readonly catalog: AudioCatalogRepository,
    private readonly favorites: FavoriteAudioRepository,
    private readonly downloads: DownloadRepository,
  ) {}

  async list(
    query: SurahCatalogQuery,
  ): Promise<readonly SurahCatalogItem[]> {
    const [favorites, downloads] =
      await Promise.all([
        this.favorites.getAll(),
        this.downloads.getAll(),
      ]);

    const favoriteIds = new Set(
      favorites.map((item) => item.trackId),
    );

    const downloadedIds = new Set(
      downloads
        .filter(
          (item) =>
            item.state === "downloaded" ||
            item.state === "queued",
        )
        .map((item) => item.trackId),
    );

    const normalized =
      query.search?.trim().toLowerCase() ?? "";

    let items = SURAHS.map((surah) => {
      const trackId = `${query.reciterId}:${surah.id}`;
      const track: AudioTrack = {
        id: trackId,
        contentType: "quran",
        contentId: String(surah.id),
        title: surah.transliteration,
        creator: {
          id: query.reciterId,
          name: "",
          style: "murattal",
          language: "ar",
          country: "",
          audioSource: "quranfoundation",
        },
        source: { uri: "" },
        surahId: surah.id,
        quran: {
          surahId: surah.id,
          reciter: {
            id: query.reciterId,
            name: "",
            style: "murattal",
            language: "ar",
            country: "",
            audioSource: "quranfoundation",
          },
        },
      };

      return {
        surah,
        track,
        isFavorite: favoriteIds.has(trackId),
        isDownloaded: downloadedIds.has(trackId),
      };
    });

    items = items.filter(
      (item) =>
        !normalized ||
        `${item.surah.id}
${item.surah.transliteration}
${item.surah.frenchName}
${item.surah.arabicName}`
          .toLowerCase()
          .includes(normalized),
    );

    if (query.filter === "favorites") {
      items = items.filter(
        (item) => item.isFavorite,
      );
    }

    if (query.filter === "downloaded") {
      items = items.filter(
        (item) => item.isDownloaded,
      );
    }

    if (query.sort === "name") {
      items.sort((a, b) =>
        a.surah.transliteration.localeCompare(
          b.surah.transliteration,
        ),
      );
    } else if (query.sort === "verses") {
      items.sort(
        (a, b) =>
          b.surah.verses - a.surah.verses,
      );
    } else {
      items.sort(
        (a, b) => a.surah.id - b.surah.id,
      );
    }

    return items;
  }
}
