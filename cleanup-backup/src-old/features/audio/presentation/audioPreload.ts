import type { CatalogReciter } from '../domain/audio';
import { audioDependencies } from '../audioDependencies';
import { preloadReciterArtwork } from './reciterArtwork';

const trackCache = new Set<string>();
const artworkCache = new Set<string>();

function key(reciterId: string | undefined, surahId: number) {
  return `${reciterId ?? 'default'}:${surahId}`;
}

export function preloadReciterPortraits(reciters: readonly CatalogReciter[], limit = 8) {
  reciters.slice(0, limit).forEach((reciter) => {
    if (artworkCache.has(reciter.id)) return;
    artworkCache.add(reciter.id);
    void preloadReciterArtwork(reciter.image).catch(() => undefined);
  });
}

export function preloadAudioSurface(reciterId: string | undefined, surahId: number) {
  if (!reciterId || surahId < 1 || surahId > 114) return;
  const cacheKey = key(reciterId, surahId);

  if (!trackCache.has(cacheKey)) {
    trackCache.add(cacheKey);
    void audioDependencies.catalog.getTrack(surahId, reciterId).catch(() => {
      trackCache.delete(cacheKey);
    });
  }

}

export function preloadAdjacentAudio(reciterId: string | undefined, surahId: number) {
  preloadAudioSurface(reciterId, surahId + 1);
  preloadAudioSurface(reciterId, surahId - 1);
}
