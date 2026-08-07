const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { latitude, longitude, radius = 20000 } = await request.json();
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return json({ error: 'INVALID_COORDINATES' }, 400);
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) return json({ error: 'GOOGLE_PLACES_API_KEY_MISSING' }, 500);
    const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri' },
      body: JSON.stringify({ includedTypes: ['mosque'], maxResultCount: 20, locationRestriction: { circle: { center: { latitude, longitude }, radius: Math.min(Math.max(radius, 100), 50000) } } }),
    });
    const payload = await response.json();
    if (!response.ok) return json({ error: payload?.error?.message || 'GOOGLE_PLACES_ERROR' }, response.status);
    return json({ places: payload.places ?? [] });
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' }, 500); }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
