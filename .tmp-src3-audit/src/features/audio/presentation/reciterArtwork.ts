import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';

export async function preloadReciterArtwork(image?: ImageSourcePropType) {
  if (!image) return Promise.resolve(false);
  if (typeof image === 'number') {
    const asset = Asset.fromModule(image);
    await asset.downloadAsync();
    return Image.prefetch(asset.localUri ?? asset.uri, { cachePolicy: 'memory-disk' });
  }
  const uri = Array.isArray(image) ? image[0]?.uri : image.uri;
  return uri ? Image.prefetch(uri, { cachePolicy: 'memory-disk' }) : true;
}
