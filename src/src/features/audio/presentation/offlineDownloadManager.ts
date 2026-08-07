import * as FileSystem from 'expo/node_modules/expo-file-system/legacy';
import type { AudioTrack } from '../../../core/audio';
import type { AudioDownload } from '../../../core/repositories';
import { storageService } from '../../../core/storage';

type Listener = () => void;
type ResumeState = FileSystem.DownloadPauseState;
type DownloadTask = {
  id: string;
  track: AudioTrack;
  resumable?: FileSystem.DownloadResumable;
  cancelled?: boolean;
};

const PREFIX = 'oummah:audio:download:v1:';
const RESUME_PREFIX = 'oummah:audio:download-resume:v1:';
const MAX_CONCURRENT = 2;

class OfflineDownloadManager {
  private readonly listeners = new Set<Listener>();
  private readonly queue: DownloadTask[] = [];
  private readonly active = new Map<string, DownloadTask>();
  private readonly snapshot = new Map<string, AudioDownload>();
  private snapshotView: ReadonlyMap<string, AudioDownload> = this.snapshot;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return this.snapshotView;
  }

  async hydrate() {
    const keys = (await storageService.keys()).filter((key) => key.startsWith(PREFIX));
    const downloads = await Promise.all(keys.map((key) => storageService.get<AudioDownload>(key)));
    downloads.forEach((download) => {
      if (download) this.snapshot.set(download.trackId, download);
    });
    this.refreshSnapshotView();
    this.emit();
  }

  async enqueue(track: AudioTrack) {
    const existing = this.snapshot.get(track.id);
    if (existing?.state === 'downloaded' && existing.localUri) {
      const info = await FileSystem.getInfoAsync(existing.localUri).catch(() => null);
      if (info?.exists) return existing;
    }

    if (this.active.has(track.id) || this.queue.some((task) => task.id === track.id)) {
      return this.snapshot.get(track.id) ?? this.persist({ trackId: track.id, state: 'queued', progress: 0 });
    }

    await this.persist({ trackId: track.id, state: 'queued', progress: 0 });
    this.queue.push({ id: track.id, track });
    this.pump();
    return this.snapshot.get(track.id)!;
  }

  async enqueueMany(tracks: readonly AudioTrack[]) {
    for (const track of tracks) {
      await this.enqueue(track);
    }
  }

  async cancel(trackId: string) {
    const active = this.active.get(trackId);
    if (active) {
      active.cancelled = true;
      const resumeState = await active.resumable?.pauseAsync().catch(() => undefined);
      if (resumeState) await this.persistResume(trackId, resumeState);
      this.active.delete(trackId);
    }
    const index = this.queue.findIndex((task) => task.id === trackId);
    if (index >= 0) this.queue.splice(index, 1);
    await this.persist({ trackId, state: 'notDownloaded', progress: 0 });
    await this.removeResume(trackId);
    this.pump();
  }

  async remove(trackId: string) {
    await this.cancel(trackId);
    const download = this.snapshot.get(trackId);
    if (download?.localUri) {
      await FileSystem.deleteAsync(download.localUri, { idempotent: true }).catch(() => undefined);
    }
    this.snapshot.delete(trackId);
    await storageService.remove(`${PREFIX}${trackId}`);
    await this.removeResume(trackId);
    this.refreshSnapshotView();
    this.emit();
  }

  async clearAll() {
    const ids = [...this.snapshot.keys()];
    await Promise.all(ids.map((id) => this.remove(id)));
  }

  async stats() {
    const downloads = [...this.snapshot.values()].filter((item) => item.state === 'downloaded' && item.localUri);
    const sizes = await Promise.all(downloads.map(async (item) => {
      const info = await FileSystem.getInfoAsync(item.localUri!).catch(() => null);
      return info?.exists && 'size' in info ? Number(info.size ?? 0) : 0;
    }));
    const usedBytes = sizes.reduce((total, size) => total + size, 0);
    const freeBytes = await FileSystem.getFreeDiskStorageAsync?.().catch(() => 0) ?? 0;
    return { downloadedCount: downloads.length, usedBytes, freeBytes };
  }

  private pump() {
    while (this.active.size < MAX_CONCURRENT && this.queue.length > 0) {
      const task = this.queue.shift()!;
      this.active.set(task.id, task);
      void this.run(task);
    }
  }

  private async run(task: DownloadTask) {
    try {
      const uri = task.track.source.uri || task.track.remoteUri;
      if (!uri) throw new Error('Audio URL unavailable.');
      const directory = `${FileSystem.documentDirectory}oummah-audio/`;
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true }).catch(() => undefined);
      const target = `${directory}${encodeURIComponent(task.id)}.mp3`;
      const resumeState = await this.getResume(task.id);

      task.resumable = FileSystem.createDownloadResumable(
        uri,
        resumeState?.fileUri ?? target,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          const progress = totalBytesExpectedToWrite > 0
            ? totalBytesWritten / totalBytesExpectedToWrite
            : 0;
          void this.persist({ trackId: task.id, state: 'downloading', localUri: target, progress });
        },
        resumeState?.resumeData,
      );

      await this.persist({ trackId: task.id, state: 'downloading', localUri: target, progress: 0 });
      const result = await task.resumable.downloadAsync();
      if (task.cancelled) return;
      if (!result?.uri) throw new Error('Download interrupted.');
      await this.removeResume(task.id);
      await this.persist({ trackId: task.id, state: 'downloaded', localUri: result.uri, progress: 1 });
    } catch {
      if (!task.cancelled) {
        const resumeState = task.resumable?.savable();
        if (resumeState?.resumeData) await this.persistResume(task.id, resumeState);
        await this.persist({ trackId: task.id, state: 'failed', progress: 0 });
      }
    } finally {
      this.active.delete(task.id);
      this.pump();
    }
  }

  private async persist(download: AudioDownload) {
    this.snapshot.set(download.trackId, download);
    this.refreshSnapshotView();
    await storageService.set(`${PREFIX}${download.trackId}`, download);
    this.emit();
    return download;
  }

  private refreshSnapshotView() {
    this.snapshotView = new Map(this.snapshot);
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private getResume(trackId: string) {
    return storageService.get<ResumeState>(`${RESUME_PREFIX}${trackId}`);
  }

  private persistResume(trackId: string, resumeState: ResumeState) {
    return storageService.set(`${RESUME_PREFIX}${trackId}`, resumeState);
  }

  private removeResume(trackId: string) {
    return storageService.remove(`${RESUME_PREFIX}${trackId}`);
  }
}

export const offlineDownloadManager = new OfflineDownloadManager();
