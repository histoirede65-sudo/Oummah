export type MosqueEnrichment = {
  osmId: string;
  placeId?: string;
  displayName?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  openingHours?: {
    weekdayDescriptions?: string[];
  };
  accessibility?: {
    wheelchair?: boolean;
    toilets?: boolean;
    parking?: boolean;
  };
  source: 'geoapify';
  fetchedAt?: string;
};

type MosqueEnrichmentResponse = {
  source: 'cache' | 'geoapify';
  provider?: 'geoapify';
  mosque: {
    osm_id: string;
    google_place_id?: string | null;
    display_name?: string | null;
    formatted_address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    phone?: string | null;
    website?: string | null;
    opening_hours?: MosqueEnrichment['openingHours'] | null;
    accessibility?: MosqueEnrichment['accessibility'] | null;
    source?: string | null;
    fetched_at?: string | null;
  } | null;
  message?: string;
  error?: string;
};

export type MosqueEnrichmentInput = {
  osmId: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  forceRefresh?: boolean;
};

function getSupabaseConfiguration() {
  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();

  const key =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    throw new Error('SUPABASE_CONFIGURATION_MISSING');
  }

  return { url, key };
}

export async function getMosqueEnrichment(
  input: MosqueEnrichmentInput,
): Promise<MosqueEnrichment | null> {
  const { url, key } = getSupabaseConfiguration();

  const response = await fetch(
    `${url.replace(/\/+$/, '')}/functions/v1/mosque-enrichment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(input),
    },
  );

  const payload =
    (await response.json()) as MosqueEnrichmentResponse;

  if (!response.ok) {
    throw new Error(
      payload.error ||
        `MOSQUE_ENRICHMENT_${response.status}`,
    );
  }

  if (!payload.mosque) {
    return null;
  }

  return {
    osmId: payload.mosque.osm_id,
    placeId:
      payload.mosque.google_place_id || undefined,
    displayName:
      payload.mosque.display_name || undefined,
    formattedAddress:
      payload.mosque.formatted_address || undefined,
    latitude:
      typeof payload.mosque.latitude === 'number'
        ? payload.mosque.latitude
        : undefined,
    longitude:
      typeof payload.mosque.longitude === 'number'
        ? payload.mosque.longitude
        : undefined,
    phone: payload.mosque.phone || undefined,
    website: payload.mosque.website || undefined,
    openingHours:
      payload.mosque.opening_hours || undefined,
    accessibility:
      payload.mosque.accessibility || undefined,
    source: 'geoapify',
    fetchedAt:
      payload.mosque.fetched_at || undefined,
  };
}

export function formatGeoapifyOpeningHours(
  enrichment: MosqueEnrichment | null,
): string | undefined {
  const descriptions =
    enrichment?.openingHours?.weekdayDescriptions;

  if (!descriptions || descriptions.length === 0) {
    return undefined;
  }

  return descriptions.join('\n');
}

/**
 * Compatibilité temporaire avec la fiche mosquée existante.
 */
export const formatGoogleOpeningHours =
  formatGeoapifyOpeningHours;
