import { QuranFoundationAudioDataSource } from './data/QuranFoundationAudioDataSource';
import { QuranFoundationReciterDataSource } from './data/QuranFoundationReciterDataSource';
import { LocalFirstAudioSourceRepository } from './repositories/LocalFirstAudioSourceRepository';
import { PreparedDownloadRepository } from './repositories/PreparedDownloadRepository';
import { QuranAudioRepository } from './repositories/QuranAudioRepository';
import { QuranReciterRepository } from './repositories/QuranReciterRepository';
import { SQLitePlaybackStateRepository } from './repositories/SQLitePlaybackStateRepository';
import { StorageAudioPlaylistRepository } from './repositories/StorageAudioPlaylistRepository';
import { StorageAudioSessionRepository } from './repositories/StorageAudioSessionRepository';
import { StorageFavoriteAudioRepository } from './repositories/StorageFavoriteAudioRepository';
import { StorageFavoriteReciterRepository } from './repositories/StorageFavoriteReciterRepository';
import { StorageListeningHistoryRepository } from './repositories/StorageListeningHistoryRepository';
import { StoragePreferredReciterRepository } from './repositories/StoragePreferredReciterRepository';
import { AudioCatalogService } from './services/AudioCatalogService';
import { AudioDownloadService } from './services/AudioDownloadService';
import { AudioPlaylistService } from './services/AudioPlaylistService';
import { AudioQueueService } from './services/AudioQueueService';
import { AudioSourceService } from './services/AudioSourceService';
import { FavoriteAudioService } from './services/FavoriteAudioService';
import { FavoriteReciterService } from './services/FavoriteReciterService';
import { ListeningHistoryService } from './services/ListeningHistoryService';
import { ListeningHomeService } from './services/ListeningHomeService';
import { PlaybackPersistenceService } from './services/PlaybackPersistenceService';
import { ReciterPreferenceService } from './services/ReciterPreferenceService';
import { ReciterService } from './services/ReciterService';
import { SurahCatalogService } from './services/SurahCatalogService';

const reciterDataSource =
  new QuranFoundationReciterDataSource();

const audioDataSource =
  new QuranFoundationAudioDataSource();

const audioCatalogRepository =
  new QuranAudioRepository(audioDataSource);

const audioSourceRepository =
  new LocalFirstAudioSourceRepository();

const playbackStateRepository =
  new SQLitePlaybackStateRepository();

const reciterRepository =
  new QuranReciterRepository(reciterDataSource);

const favoriteAudioRepository =
  new StorageFavoriteAudioRepository();

const listeningHistoryRepository =
  new StorageListeningHistoryRepository();

const downloadRepository =
  new PreparedDownloadRepository();

const sessionRepository =
  new StorageAudioSessionRepository();

const playlistRepository =
  new StorageAudioPlaylistRepository();

const favoriteReciterRepository =
  new StorageFavoriteReciterRepository();

const preferredReciterRepository =
  new StoragePreferredReciterRepository();

const catalogService =
  new AudioCatalogService(audioCatalogRepository);

const preferredReciterService =
  new ReciterPreferenceService(
    preferredReciterRepository,
    reciterRepository,
  );

export const audioDependencies = {
  catalog: catalogService,

  queue: new AudioQueueService(
    audioCatalogRepository,
  ),

  source: new AudioSourceService(
    audioSourceRepository,
  ),

  persistence:
    new PlaybackPersistenceService(
      playbackStateRepository,
    ),

  reciters: new ReciterService(
    reciterRepository,
  ),

  favorites: new FavoriteAudioService(
    favoriteAudioRepository,
  ),

  history: new ListeningHistoryService(
    listeningHistoryRepository,
  ),

  downloads: new AudioDownloadService(
    downloadRepository,
  ),

  home: new ListeningHomeService(
    audioCatalogRepository,
    listeningHistoryRepository,
    favoriteAudioRepository,
    downloadRepository,
  ),

  surahs: new SurahCatalogService(
    audioCatalogRepository,
    favoriteAudioRepository,
    downloadRepository,
  ),

  playlists: new AudioPlaylistService(
    playlistRepository,
    audioCatalogRepository,
    favoriteAudioRepository,
    listeningHistoryRepository,
    downloadRepository,
  ),

  reciterFavorites:
    new FavoriteReciterService(
      favoriteReciterRepository,
    ),

  preferredReciter:
    preferredReciterService,

  repositories: {
    favorites: favoriteAudioRepository,
    history: listeningHistoryRepository,
    downloads: downloadRepository,
    session: sessionRepository,
  },
};