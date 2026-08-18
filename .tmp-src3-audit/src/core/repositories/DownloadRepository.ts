import type { AudioTrack } from '../audio';

export type DownloadState = 'notDownloaded' | 'queued' | 'downloading' | 'downloaded' | 'failed';

export interface AudioDownload {
  trackId: string;
  state: DownloadState;
  localUri?: string;
  progress: number;
}

export interface DownloadRepository {
  get(trackId: string): Promise<AudioDownload | null>;
  getAll(): Promise<readonly AudioDownload[]>;
  prepare(track: AudioTrack): Promise<AudioDownload>;
  remove(trackId: string): Promise<void>;
}
