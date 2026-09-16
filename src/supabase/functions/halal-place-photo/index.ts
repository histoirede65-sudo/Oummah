const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'GET') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  try {
    const photoName = new URL(request.url).searchParams.get('name') ?? '';
    if (!/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(photoName)) {
      return json({ error: 'INVALID_PHOTO_NAME' }, 400);
    }
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) return json({ error: 'GOOGLE_PLACES_API_KEY_MISSING' }, 500);

    const mediaResponse = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=900&skipHttpRedirect=true`,
      { headers: { 'X-Goog-Api-Key': apiKey } },
    );
    const mediaPayload = await mediaResponse.json().catch(() => null);
    const photoUri = mediaPayload?.photoUri;
    if (!mediaResponse.ok || typeof photoUri !== 'string') {
      return json({ error: 'GOOGLE_PLACE_PHOTO_ERROR' }, mediaResponse.status || 502);
    }
    const response = await fetch(photoUri);
    if (!response.ok || !response.body) {
      return json({ error: 'GOOGLE_PLACE_PHOTO_DOWNLOAD_ERROR' }, response.status || 502);
    }
    return new Response(response.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
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
