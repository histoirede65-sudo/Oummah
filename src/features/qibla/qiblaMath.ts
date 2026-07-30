export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
} as const;

const toRadians = (value: number) => (value * Math.PI) / 180;
const toDegrees = (value: number) => (value * 180) / Math.PI;

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function shortestAngle(value: number): number {
  const normalized = normalizeDegrees(value);
  return normalized > 180 ? normalized - 360 : normalized;
}

export function calculateQiblaBearing(
  latitude: number,
  longitude: number,
): number {
  const latitudeRad = toRadians(latitude);
  const kaabaLatitudeRad = toRadians(KAABA_COORDINATES.latitude);
  const longitudeDelta = toRadians(KAABA_COORDINATES.longitude - longitude);

  const y = Math.sin(longitudeDelta);
  const x =
    Math.cos(latitudeRad) * Math.tan(kaabaLatitudeRad) -
    Math.sin(latitudeRad) * Math.cos(longitudeDelta);

  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

export function calculateDistanceToKaabaKm(
  latitude: number,
  longitude: number,
): number {
  const earthRadiusKm = 6371.0088;
  const latitudeDelta = toRadians(KAABA_COORDINATES.latitude - latitude);
  const longitudeDelta = toRadians(KAABA_COORDINATES.longitude - longitude);
  const latitudeRad = toRadians(latitude);
  const kaabaLatitudeRad = toRadians(KAABA_COORDINATES.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeRad) *
      Math.cos(kaabaLatitudeRad) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

export function bearingToCardinal(bearing: number): string {
  const labels = [
    'Nord',
    'Nord-est',
    'Est',
    'Sud-est',
    'Sud',
    'Sud-ouest',
    'Ouest',
    'Nord-ouest',
  ];
  return labels[Math.round(normalizeDegrees(bearing) / 45) % labels.length];
}

export function getTurnInstruction(relativeAngle: number): string {
  const angle = shortestAngle(relativeAngle);
  const absolute = Math.round(Math.abs(angle));

  if (absolute <= 3) return 'Vous êtes aligné avec la Qibla';
  if (absolute <= 8) return 'Presque aligné';
  return `Tournez de ${absolute}° vers ${angle > 0 ? 'la droite' : 'la gauche'}`;
}
