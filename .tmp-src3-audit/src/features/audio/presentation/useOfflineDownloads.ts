import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { AudioTrack } from '../../../core/audio';
import type { AudioDownload } from '../../../core/repositories';
import { offlineDownloadManager } from './offlineDownloadManager';

const EMPTY = new Map<string, AudioDownload>();

export function useOfflineDownloads() {
  const [stats, setStats] = useState({ downloadedCount: 0, usedBytes: 0, freeBytes: 0 });

  useEffect(() => {
    void offlineDownloadManager.hydrate().catch(() => undefined);
  }, []);

  const downloads = useSyncExternalStore(
    offlineDownloadManager.subscribe.bind(offlineDownloadManager),
    offlineDownloadManager.getSnapshot.bind(offlineDownloadManager),
    () => EMPTY,
  );

  const enqueue = useCallback((track: AudioTrack) => {
    void offlineDownloadManager.enqueue(track).catch(() => undefined);
  }, []);

  const enqueueMany = useCallback((tracks: readonly AudioTrack[]) => {
    void offlineDownloadManager.enqueueMany(tracks).catch(() => undefined);
  }, []);

  const cancel = useCallback((trackId: string) => {
    void offlineDownloadManager.cancel(trackId).catch(() => undefined);
  }, []);

  const remove = useCallback((trackId: string) => {
    void offlineDownloadManager.remove(trackId).catch(() => undefined);
  }, []);

  const clearAll = useCallback(() => {
    void offlineDownloadManager.clearAll().catch(() => undefined);
  }, []);

  useEffect(() => {
    void offlineDownloadManager.stats()
      .then(setStats)
      .catch(() => undefined);
  }, [downloads]);

  return useMemo(() => ({
    downloads,
    stats,
    enqueue,
    enqueueMany,
    cancel,
    remove,
    clearAll,
  }), [cancel, clearAll, downloads, enqueue, enqueueMany, remove, stats]);
}
