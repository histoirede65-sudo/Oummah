import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Transcrit un court morceau de récitation (2 à 3 s) pour illuminer les mots lus dans le lecteur du Coran,
// quand la reconnaissance vocale du téléphone n'est pas disponible. Le texte attendu du passage est donné
// au modèle comme indice : il reconnaît beaucoup mieux le Coran récité. L'audio n'est pas conservé.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MAX_AUDIO_BYTES = 2 * 1024 * 1024;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "unauthorized" }, 401);
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: authData, error: authError } = await client.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "unauthorized" }, 401);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "not_configured" }, 500);

    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0) return json({ error: "audio_required" }, 400);
    if (audio.size > MAX_AUDIO_BYTES) return json({ error: "audio_too_large" }, 413);
    const hint = String(form.get("hint") ?? "").slice(0, 600);

    const upstream = new FormData();
    upstream.append("file", audio, audio.name || "recitation.m4a");
    upstream.append("model", "gpt-4o-mini-transcribe");
    upstream.append("language", "ar");
    upstream.append("response_format", "json");
    if (hint) upstream.append("prompt", hint);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return json({ error: "transcription_failed", details: body?.error?.message ?? null }, 502);
    return json({ text: typeof body?.text === "string" ? body.text : "" });
  } catch (error) {
    return json({ error: "failed", details: error instanceof Error ? error.message : null }, 500);
  }
});
