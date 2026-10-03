import * as FileSystem from "expo-file-system/legacy";

import type { ProphetAudioEpisode } from "./prophetAudioData";

const CACHE_DIRECTORY = `${FileSystem.documentDirectory}oummah-prophet-audio/`;
const activeDownloads = new Map<string, Promise<string>>();

export async function getCachedProphetAudio(
  episode: ProphetAudioEpisode,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const existing = activeDownloads.get(episode.id);
  if (existing) return existing;

  const task = downloadOrReuse(episode, onProgress).finally(() => {
    activeDownloads.delete(episode.id);
  });
  activeDownloads.set(episode.id, task);
  return task;
}

async function downloadOrReuse(
  episode: ProphetAudioEpisode,
  onProgress?: (progress: number) => void,
) {
  await FileSystem.makeDirectoryAsync(CACHE_DIRECTORY, { intermediates: true }).catch(() => undefined);

  const target = `${CACHE_DIRECTORY}${episode.audioFileName}`;
  const partial = `${target}.download`;
  const info = await FileSystem.getInfoAsync(target).catch(() => null);
  if (info?.exists && "size" in info && Number(info.size ?? 0) > 1024) {
    onProgress?.(1);
    return target;
  }

  await FileSystem.deleteAsync(partial, { idempotent: true }).catch(() => undefined);
  const resumable = FileSystem.createDownloadResumable(
    episode.audioUrl,
    partial,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress?.(
        totalBytesExpectedToWrite > 0
          ? Math.min(1, totalBytesWritten / totalBytesExpectedToWrite)
          : 0,
      );
    },
  );

  const result = await resumable.downloadAsync();
  if (!result?.uri) {
    throw new Error("Le téléchargement de cette histoire a été interrompu.");
  }

  await FileSystem.moveAsync({ from: result.uri, to: target });
  onProgress?.(1);
  return target;
}
