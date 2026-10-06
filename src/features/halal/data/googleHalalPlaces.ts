export type GoogleHalalPlace = {
  id: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  types?: string[];
  googleMapsUri?: string;
  businessStatus?: string;
  photos?: GoogleHalalPhoto[];
};

export type GoogleHalalPhoto = {
  name?: string;
  authorAttributions?: Array<{ displayName?: string; uri?: string; photoUri?: string }>;
};

export type GoogleHalalPlaceDetails = {
  id?: string;
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  photos?: GoogleHalalPhoto[];
};

function getSupabaseConfiguration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()
    || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

export async function getNearbyHalalPlacesFromGoogle(
  latitude: number,
  longitude: number,
  radius: number,
  signal?: AbortSignal,
) {
  const configuration = getSupabaseConfiguration();
  if (!configuration) return [] as GoogleHalalPlace[];
  const response = await fetch(`${configuration.url}/functions/v1/nearby-halal`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      apikey: configuration.key,
      Authorization: `Bearer ${configuration.key}`,
    },
    body: JSON.stringify({ latitude, longitude, radius, pages: 2 }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || `GOOGLE_HALAL_${response.status}`);
  return Array.isArray(payload?.places) ? payload.places as GoogleHalalPlace[] : [];
}

export async function getGoogleHalalPlaceDetails(placeId: string) {
  const configuration = getSupabaseConfiguration();
  if (!configuration) return null;
  const response = await fetch(`${configuration.url}/functions/v1/halal-place-details`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: configuration.key,
      Authorization: `Bearer ${configuration.key}`,
    },
    body: JSON.stringify({ placeId }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || `GOOGLE_HALAL_DETAILS_${response.status}`);
  return payload?.place as GoogleHalalPlaceDetails | null;
}

/** width : taille voulue en pixels (vignette de liste) ; sans width, grande photo pour la fiche. */
export function getGoogleHalalPhotoSource(photoName?: string, width?: number) {
  const configuration = getSupabaseConfiguration();
  if (!configuration || !photoName) return null;
  return {
    uri: `${configuration.url}/functions/v1/halal-place-photo?name=${encodeURIComponent(photoName)}${width ? `&w=${width}` : ''}`,
    headers: {
      apikey: configuration.key,
      Authorization: `Bearer ${configuration.key}`,
    },
  };
}
