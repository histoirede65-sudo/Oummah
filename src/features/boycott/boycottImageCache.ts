import { Image } from 'expo-image';

/** Prefetch only a small, already-selected set of product images. */
export function prefetchBoycottImages(uris: Array<string | undefined>) {
  const uniqueUris = [...new Set(uris.filter((uri): uri is string => Boolean(uri?.trim())))].slice(0, 3);
  if (!uniqueUris.length) return;
  void Image.prefetch(uniqueUris, 'memory-disk').catch(() => false);
}
