import type { AudioReciter, AudioTrack, Playlist } from '../../../core/audio';
import type { AudioDownload, FavoriteAudio, ListeningHistoryEntry } from '../../../core/repositories';
import type { Surah } from '../../../data/surahs';
import type { ImageSourcePropType } from 'react-native';

export type { AudioTrack };

export interface CatalogReciter extends AudioReciter {
  image?: ImageSourcePropType;
  availableSurahs: number;
  popularity: number;
  portraitHdUri: string;
  biography: string;
  birthYear?: number;
  popularSurahIds: readonly number[];
  totalDurationSeconds: number;
}

export type SurahSort = 'number' | 'name' | 'verses';
export type SurahFilter = 'all' | 'favorites' | 'downloaded';

export interface ListeningTrackItem {
  track: AudioTrack;
  history?: ListeningHistoryEntry;
  favorite?: FavoriteAudio;
  download?: AudioDownload;
}

export interface ListeningHomeSnapshot {
  continueListening: ListeningTrackItem | null;
  recentlyListened: readonly ListeningTrackItem[];
  popularReciters: readonly CatalogReciter[];
  popularSurahs: readonly AudioTrack[];
  latestDownloads: readonly ListeningTrackItem[];
  favorites: readonly ListeningTrackItem[];
  recommendations: readonly AudioTrack[];
}

export interface SurahCatalogItem {
  surah: Surah;
  track: AudioTrack;
  isFavorite: boolean;
  isDownloaded: boolean;
}

export interface StoredAudioPlaylist {
  id: string;
  title: string;
  trackIds: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListeningPlaylistsSnapshot {
  favorites: Playlist;
  myPlaylist: Playlist;
  recent: Playlist;
  downloaded: Playlist;
}

export type PlaybackSnapshot = {
  version: 1;
  trackId: string;
  surahId: number;
  reciterId: string;
  position: number;
  playbackRate: number;
  isLooping: boolean;
  wasPlaying: boolean;
  updatedAt: string;
};
