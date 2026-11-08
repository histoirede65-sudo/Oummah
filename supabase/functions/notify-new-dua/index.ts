import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Push to the users who chose to be told about new duas on the Dua wall.
// Called by the app right after dua_wall_publish succeeds, with the new post id.
// At most one push every 30 minutes per user, so a busy night does not flood anyone.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const QUIET_MS = 30 * 60_000;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("AUTH_REQUIRED");

    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: authData, error: authError } = await client.auth.getUser(token);
    if (authError || !authData.user) throw new Error("AUTH_REQUIRED");

    const { postId } = (await request.json()) as { postId?: string };
    if (!postId) throw new Error("POST_ID_REQUIRED");

    // Only the author of a published dua can trigger its notification.
    const { data: post } = await client
      .from("dua_wall_posts")
      .select("id, user_id, status")
      .eq("id", postId)
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (!post || post.status !== "approved") return json({ sent: 0 });

    const since = new Date(Date.now() - QUIET_MS).toISOString();
    const { data: subscribers } = await client
      .from("dua_wall_subscribers")
      .select("user_id, language")
      .neq("user_id", post.user_id)
      .or(`last_notified_at.is.null,last_notified_at.lt.${since}`);
    const userIds = (subscribers ?? []).map((row) => row.user_id);
    const languageOf = new Map((subscribers ?? []).map((row) => [row.user_id, row.language]));
    if (userIds.length === 0) return json({ sent: 0 });

    const { data: tokenRows } = await client
      .from("user_push_tokens")
      .select("user_id, expo_push_token")
      .in("user_id", userIds)
      .eq("enabled", true);
    const rows = (tokenRows ?? []).filter((row) => row.expo_push_token);
    if (rows.length === 0) return json({ sent: 0 });

    const seen = new Set<string>();
    const messages = rows.filter((row) => !seen.has(row.expo_push_token) && seen.add(row.expo_push_token)).map((row) => {
      const english = languageOf.get(row.user_id) === "en";
      return {
        to: row.expo_push_token,
        title: english ? "Dua wall" : "Mur des duas",
        body: english ? "A new dua has just been shared. Say Ameen." : "Une nouvelle dua vient d’être partagée. Dis Amine.",
        sound: "default",
        data: { route: `/tahajjud/dua?id=${post.id}` },
      };
    });

    for (let index = 0; index < messages.length; index += 100) {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages.slice(index, index + 100)),
      });
      if (!response.ok) throw new Error("EXPO_PUSH_FAILED");
    }

    await client
      .from("dua_wall_subscribers")
      .update({ last_notified_at: new Date().toISOString() })
      .in("user_id", [...new Set(rows.map((row) => row.user_id))]);

    return json({ sent: messages.length });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, 400);
  }
});
