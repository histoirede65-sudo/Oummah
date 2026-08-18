import type { ImageSourcePropType } from 'react-native';

export const MOSQUE_IMAGE_KEYS = [
  'mosque-neighborhood', 'mosque-coastal',
  ...Array.from({ length: 12 }, (_, index) => `mosque-a-${String(index).padStart(2, '0')}`),
  ...Array.from({ length: 12 }, (_, index) => `mosque-b-${String(index).padStart(2, '0')}`),
  ...Array.from({ length: 12 }, (_, index) => `mosque-c-${String(index).padStart(2, '0')}`),
  ...Array.from({ length: 12 }, (_, index) => `mosque-d-${String(index).padStart(2, '0')}`),
] as const;

export type MosqueImageKey = (typeof MOSQUE_IMAGE_KEYS)[number];

const IMAGE_SOURCES: Record<MosqueImageKey, ImageSourcePropType> = {
  'mosque-neighborhood': require('../../../assets/images/mosques/mosque-neighborhood.jpg'),
  'mosque-coastal': require('../../../assets/images/mosques/mosque-coastal.jpg'),
  'mosque-a-00': require('../../../assets/images/mosques/mosque-a-00.jpg'),
  'mosque-a-01': require('../../../assets/images/mosques/mosque-a-01.jpg'),
  'mosque-a-02': require('../../../assets/images/mosques/mosque-a-02.jpg'),
  'mosque-a-03': require('../../../assets/images/mosques/mosque-a-03.jpg'),
  'mosque-a-04': require('../../../assets/images/mosques/mosque-a-04.jpg'),
  'mosque-a-05': require('../../../assets/images/mosques/mosque-a-05.jpg'),
  'mosque-a-06': require('../../../assets/images/mosques/mosque-a-06.jpg'),
  'mosque-a-07': require('../../../assets/images/mosques/mosque-a-07.jpg'),
  'mosque-a-08': require('../../../assets/images/mosques/mosque-a-08.jpg'),
  'mosque-a-09': require('../../../assets/images/mosques/mosque-a-09.jpg'),
  'mosque-a-10': require('../../../assets/images/mosques/mosque-a-10.jpg'),
  'mosque-a-11': require('../../../assets/images/mosques/mosque-a-11.jpg'),
  'mosque-b-00': require('../../../assets/images/mosques/mosque-b-00.jpg'),
  'mosque-b-01': require('../../../assets/images/mosques/mosque-b-01.jpg'),
  'mosque-b-02': require('../../../assets/images/mosques/mosque-b-02.jpg'),
  'mosque-b-03': require('../../../assets/images/mosques/mosque-b-03.jpg'),
  'mosque-b-04': require('../../../assets/images/mosques/mosque-b-04.jpg'),
  'mosque-b-05': require('../../../assets/images/mosques/mosque-b-05.jpg'),
  'mosque-b-06': require('../../../assets/images/mosques/mosque-b-06.jpg'),
  'mosque-b-07': require('../../../assets/images/mosques/mosque-b-07.jpg'),
  'mosque-b-08': require('../../../assets/images/mosques/mosque-b-08.jpg'),
  'mosque-b-09': require('../../../assets/images/mosques/mosque-b-09.jpg'),
  'mosque-b-10': require('../../../assets/images/mosques/mosque-b-10.jpg'),
  'mosque-b-11': require('../../../assets/images/mosques/mosque-b-11.jpg'),
  'mosque-c-00': require('../../../assets/images/mosques/mosque-c-00.jpg'),
  'mosque-c-01': require('../../../assets/images/mosques/mosque-c-01.jpg'),
  'mosque-c-02': require('../../../assets/images/mosques/mosque-c-02.jpg'),
  'mosque-c-03': require('../../../assets/images/mosques/mosque-c-03.jpg'),
  'mosque-c-04': require('../../../assets/images/mosques/mosque-c-04.jpg'),
  'mosque-c-05': require('../../../assets/images/mosques/mosque-c-05.jpg'),
  'mosque-c-06': require('../../../assets/images/mosques/mosque-c-06.jpg'),
  'mosque-c-07': require('../../../assets/images/mosques/mosque-c-07.jpg'),
  'mosque-c-08': require('../../../assets/images/mosques/mosque-c-08.jpg'),
  'mosque-c-09': require('../../../assets/images/mosques/mosque-c-09.jpg'),
  'mosque-c-10': require('../../../assets/images/mosques/mosque-c-10.jpg'),
  'mosque-c-11': require('../../../assets/images/mosques/mosque-c-11.jpg'),
  'mosque-d-00': require('../../../assets/images/mosques/mosque-d-00.jpg'),
  'mosque-d-01': require('../../../assets/images/mosques/mosque-d-01.jpg'),
  'mosque-d-02': require('../../../assets/images/mosques/mosque-d-02.jpg'),
  'mosque-d-03': require('../../../assets/images/mosques/mosque-d-03.jpg'),
  'mosque-d-04': require('../../../assets/images/mosques/mosque-d-04.jpg'),
  'mosque-d-05': require('../../../assets/images/mosques/mosque-d-05.jpg'),
  'mosque-d-06': require('../../../assets/images/mosques/mosque-d-06.jpg'),
  'mosque-d-07': require('../../../assets/images/mosques/mosque-d-07.jpg'),
  'mosque-d-08': require('../../../assets/images/mosques/mosque-d-08.jpg'),
  'mosque-d-09': require('../../../assets/images/mosques/mosque-d-09.jpg'),
  'mosque-d-10': require('../../../assets/images/mosques/mosque-d-10.jpg'),
  'mosque-d-11': require('../../../assets/images/mosques/mosque-d-11.jpg'),
} as Record<MosqueImageKey, ImageSourcePropType>;

const IMAGE_KEY_SET = new Set<string>(MOSQUE_IMAGE_KEYS);

export function isValidMosqueImageKey(value: string | null | undefined): value is MosqueImageKey {
  return Boolean(value && IMAGE_KEY_SET.has(value));
}

export function getDeterministicMosqueImageKey(id: string): MosqueImageKey {
  let hash = 2_166_136_261;
  for (const character of id) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return MOSQUE_IMAGE_KEYS[(hash >>> 0) % MOSQUE_IMAGE_KEYS.length];
}

export function getMosqueImageKey(id: string, imageKey?: string | null): MosqueImageKey {
  return isValidMosqueImageKey(imageKey) ? imageKey : getDeterministicMosqueImageKey(id);
}

export function getMosqueImageSource(id: string, imageKey?: string | null): ImageSourcePropType {
  return IMAGE_SOURCES[getMosqueImageKey(id, imageKey)];
}
