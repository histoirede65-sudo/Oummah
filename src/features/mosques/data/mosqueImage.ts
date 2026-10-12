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
  'mosque-neighborhood': require('../../../assets/images/mosques/mosque-neighborhood.webp'),
  'mosque-coastal': require('../../../assets/images/mosques/mosque-coastal.webp'),
  'mosque-a-00': require('../../../assets/images/mosques/mosque-a-00.webp'),
  'mosque-a-01': require('../../../assets/images/mosques/mosque-a-01.webp'),
  'mosque-a-02': require('../../../assets/images/mosques/mosque-a-02.webp'),
  'mosque-a-03': require('../../../assets/images/mosques/mosque-a-03.webp'),
  'mosque-a-04': require('../../../assets/images/mosques/mosque-a-04.webp'),
  'mosque-a-05': require('../../../assets/images/mosques/mosque-a-05.webp'),
  'mosque-a-06': require('../../../assets/images/mosques/mosque-a-06.webp'),
  'mosque-a-07': require('../../../assets/images/mosques/mosque-a-07.webp'),
  'mosque-a-08': require('../../../assets/images/mosques/mosque-a-08.webp'),
  'mosque-a-09': require('../../../assets/images/mosques/mosque-a-09.webp'),
  'mosque-a-10': require('../../../assets/images/mosques/mosque-a-10.webp'),
  'mosque-a-11': require('../../../assets/images/mosques/mosque-a-11.webp'),
  'mosque-b-00': require('../../../assets/images/mosques/mosque-b-00.webp'),
  'mosque-b-01': require('../../../assets/images/mosques/mosque-b-01.webp'),
  'mosque-b-02': require('../../../assets/images/mosques/mosque-b-02.webp'),
  'mosque-b-03': require('../../../assets/images/mosques/mosque-b-03.webp'),
  'mosque-b-04': require('../../../assets/images/mosques/mosque-b-04.webp'),
  'mosque-b-05': require('../../../assets/images/mosques/mosque-b-05.webp'),
  'mosque-b-06': require('../../../assets/images/mosques/mosque-b-06.webp'),
  'mosque-b-07': require('../../../assets/images/mosques/mosque-b-07.webp'),
  'mosque-b-08': require('../../../assets/images/mosques/mosque-b-08.webp'),
  'mosque-b-09': require('../../../assets/images/mosques/mosque-b-09.webp'),
  'mosque-b-10': require('../../../assets/images/mosques/mosque-b-10.webp'),
  'mosque-b-11': require('../../../assets/images/mosques/mosque-b-11.webp'),
  'mosque-c-00': require('../../../assets/images/mosques/mosque-c-00.webp'),
  'mosque-c-01': require('../../../assets/images/mosques/mosque-c-01.webp'),
  'mosque-c-02': require('../../../assets/images/mosques/mosque-c-02.webp'),
  'mosque-c-03': require('../../../assets/images/mosques/mosque-c-03.webp'),
  'mosque-c-04': require('../../../assets/images/mosques/mosque-c-04.webp'),
  'mosque-c-05': require('../../../assets/images/mosques/mosque-c-05.webp'),
  'mosque-c-06': require('../../../assets/images/mosques/mosque-c-06.webp'),
  'mosque-c-07': require('../../../assets/images/mosques/mosque-c-07.webp'),
  'mosque-c-08': require('../../../assets/images/mosques/mosque-c-08.webp'),
  'mosque-c-09': require('../../../assets/images/mosques/mosque-c-09.webp'),
  'mosque-c-10': require('../../../assets/images/mosques/mosque-c-10.webp'),
  'mosque-c-11': require('../../../assets/images/mosques/mosque-c-11.webp'),
  'mosque-d-00': require('../../../assets/images/mosques/mosque-d-00.webp'),
  'mosque-d-01': require('../../../assets/images/mosques/mosque-d-01.webp'),
  'mosque-d-02': require('../../../assets/images/mosques/mosque-d-02.webp'),
  'mosque-d-03': require('../../../assets/images/mosques/mosque-d-03.webp'),
  'mosque-d-04': require('../../../assets/images/mosques/mosque-d-04.webp'),
  'mosque-d-05': require('../../../assets/images/mosques/mosque-d-05.webp'),
  'mosque-d-06': require('../../../assets/images/mosques/mosque-d-06.webp'),
  'mosque-d-07': require('../../../assets/images/mosques/mosque-d-07.webp'),
  'mosque-d-08': require('../../../assets/images/mosques/mosque-d-08.webp'),
  'mosque-d-09': require('../../../assets/images/mosques/mosque-d-09.webp'),
  'mosque-d-10': require('../../../assets/images/mosques/mosque-d-10.webp'),
  'mosque-d-11': require('../../../assets/images/mosques/mosque-d-11.webp'),
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
