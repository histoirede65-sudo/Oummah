const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const FOOD_TYPES = new Set([
  'bakery',
  'butcher_shop',
  'cafe',
  'convenience_store',
  'fast_food_restaurant',
  'food',
  'grocery_store',
  'meal_delivery',
  'meal_takeaway',
  'restaurant',
  'store',
  'supermarket',
]);

type GooglePlacePayload = {
  types?: string[];
  businessStatus?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  try {
    const { latitude, longitude, radius = 10000 } = await request.json();
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return json({ error: 'INVALID_COORDINATES' }, 400);
    }
    const safeRadius = Math.min(Math.max(Number(radius) || 10000, 100), 50000);
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) return json({ error: 'GOOGLE_PLACES_API_KEY_MISSING' }, 500);

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.googleMapsUri,places.businessStatus,places.photos',
      },
      body: JSON.stringify({
        textQuery: 'halal',
        pageSize: 20,
        languageCode: 'fr',
        rankPreference: 'DISTANCE',
        includePureServiceAreaBusinesses: false,
        locationBias: {
          circle: {
            center: { latitude, longitude },
            radius: safeRadius,
          },
        },
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      return json({ error: payload?.error?.message || 'GOOGLE_PLACES_ERROR' }, response.status);
    }
    const places = (Array.isArray(payload?.places) ? payload.places : []).filter((place: GooglePlacePayload) => {
      if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') return false;
      return (place.types ?? []).some((type) => FOOD_TYPES.has(type));
    });
    return json({ places });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
