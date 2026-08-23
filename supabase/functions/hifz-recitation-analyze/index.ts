const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac", "audio/mpeg", "audio/wav", "audio/x-wav"]);

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function base64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

async function googleAccessToken() {
  const clientEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) throw new Error("Google Speech credentials are not configured.");
  const keyData = privateKey.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(keyData), (char) => char.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = base64Url(new TextEncoder().encode(JSON.stringify({ iss: clientEmail, scope: "https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })));
  const unsigned = `${header}.${payload}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${base64Url(new Uint8Array(signature))}` });
  if (!response.ok) throw new Error(`Google OAuth failed (${response.status}).`);
  const token = await response.json();
  return token.access_token as string;
}

function contentTypeAllowed(type: string) { return !type || ALLOWED_TYPES.has(type.toLowerCase()); }

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  try {
    const form = await request.formData();
    const value = form.get("audio");
    if (!(value instanceof File)) return json({ error: "audio_file_required" }, 400);
    if (value.size === 0 || value.size > MAX_AUDIO_BYTES) return json({ error: "audio_file_too_large", maxBytes: MAX_AUDIO_BYTES }, 413);
    if (!contentTypeAllowed(value.type)) return json({ error: "unsupported_audio_type" }, 415);
    const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
    if (!projectId) return json({ error: "google_project_not_configured" }, 500);
    const startedAt = performance.now();
    const audioContent = base64(new Uint8Array(await value.arrayBuffer()));
    const token = await googleAccessToken();
    const googleResponse = await fetch(`https://speech.googleapis.com/v2/projects/${projectId}/locations/global/recognizers/_:recognize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ config: { autoDecodingConfig: {}, languageCodes: ["ar-XA"], model: "chirp_3", features: { enableWordTimeOffsets: true } }, content: audioContent }),
    });
    const responseBody = await googleResponse.json();
    if (!googleResponse.ok) return json({ error: "speech_recognition_failed", details: responseBody?.error?.message ?? "Google Speech-to-Text request failed." }, 502);
    const alternatives = responseBody.results?.flatMap((result: { alternatives?: unknown[] }) => result.alternatives ?? []) ?? [];
    const first = alternatives[0] as { transcript?: string; words?: unknown[] } | undefined;
    return json({ transcript: first?.transcript ?? "", words: first?.words ?? [], processingLatencyMs: Math.round(performance.now() - startedAt) });
  } catch (error) {
    return json({ error: "analysis_failed", details: error instanceof Error ? error.message : "Unexpected analysis error." }, 500);
  }
});
