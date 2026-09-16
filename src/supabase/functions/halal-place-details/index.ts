const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  try {
    const { placeId } = await request.json();
    if (typeof placeId !== 'string' || !/^[A-Za-z0-9_-]{8,300}$/.test(placeId)) {
      return json({ error: 'INVALID_PLACE_ID' }, 400);
    }
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) return json({ error: 'GOOGLE_PLACES_API_KEY_MISSING' }, 500);
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=fr`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,formattedAddress,nationalPhoneNumber,websiteUri,googleMapsUri,regularOpeningHours,currentOpeningHours,photos',
        },
      },
    );
    const payload = await response.json();
    if (!response.ok) {
      return json({ error: payload?.error?.message || 'GOOGLE_PLACE_DETAILS_ERROR' }, response.status);
    }
    return json({ place: payload });
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
