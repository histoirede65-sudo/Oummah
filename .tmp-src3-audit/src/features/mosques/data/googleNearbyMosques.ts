import type { NearbyMosque } from './nearbyMosques';

export async function getNearbyMosquesFromGoogle(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<NearbyMosque[]> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return [];

  const response = await fetch(`${url}/functions/v1/nearby-mosques`, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({ latitude, longitude, radius: 20000 }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || `GOOGLE_MOSQUES_${response.status}`);

  const checkedAt = new Date().toISOString();
  return (payload.places ?? []).flatMap((place: any) => {
    const lat = place.location?.latitude;
    const lng = place.location?.longitude;
    if (!place.id || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const distanceMeters = distance(latitude, longitude, lat, lng);
    return [{
      id: `google-${place.id}`, name: place.displayName?.text || 'Mosquée sans nom renseigné',
      address: place.formattedAddress || 'Adresse non renseignée', latitude: lat, longitude: lng,
      distanceMeters, distanceLabel: formatDistance(distanceMeters), walkingTimeLabel: `${Math.max(1, Math.round(distanceMeters / 80))} min à pied`,
      phone: place.nationalPhoneNumber, website: place.websiteUri, source: 'google' as any,
      sourceUrl: place.googleMapsUri, lastCheckedAt: checkedAt,
    }];
  });
}

function distance(a: number, b: number, c: number, d: number) {
  const r = Math.PI / 180; const x = (c - a) * r; const y = (d - b) * r;
  const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function formatDistance(m: number) { return m < 1000 ? `${Math.max(1, Math.round(m))} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`; }
