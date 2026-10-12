import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Push to the author of a dua when someone else replies to it on the Dua wall.
// Called by the app right after dua_wall_reply succeeds, with the new reply id.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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

    const { replyId } = (await request.json()) as { replyId?: string };
    if (!replyId) throw new Error("REPLY_ID_REQUIRED");

    // Only the person who wrote the reply can trigger its notification.
    const { data: reply } = await client
      .from("dua_wall_replies")
      .select("post_id, user_id")
      .eq("id", replyId)
      .eq("user_id", authData.user.id)
      .maybeSingle();
    if (!reply) throw new Error("NOT_FOUND");

    const { data: post } = await client
      .from("dua_wall_posts")
      .select("user_id")
      .eq("id", reply.post_id)
      .maybeSingle();
    if (!post || post.user_id === reply.user_id) return json({ sent: 0 });

    const { data: tokenRows } = await client
      .from("user_push_tokens")
      .select("expo_push_token")
      .eq("user_id", post.user_id)
      .eq("enabled", true);
    const tokens = [...new Set((tokenRows ?? []).map((row) => row.expo_push_token).filter(Boolean))];
    if (tokens.length === 0) return json({ sent: 0 });

    const messages = tokens.map((to) => ({
      to,
      title: "Mur des duas",
      body: "Quelqu’un a répondu à votre dua.",
      sound: "default",
      data: { route: `/tahajjud/dua?id=${reply.post_id}` },
    }));
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    if (!response.ok) throw new Error("EXPO_PUSH_FAILED");
    return json({ sent: tokens.length });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, 400);
  }
});
