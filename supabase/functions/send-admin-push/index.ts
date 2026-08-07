import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

type Payload = {
  title?: string;
  body?: string;
  audience?: "all" | "free" | "premium";
  route?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = request.headers.get("Authorization") ?? "";

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: userData, error: userError } =
      await adminClient.auth.getUser(
        authorization.replace(/^Bearer\s+/i, ""),
      );

    if (userError || !userData.user) {
      throw new Error("AUTH_REQUIRED");
    }

    const { data: adminRow } = await adminClient
      .from("oummah_admin_users")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!adminRow) {
      throw new Error("ADMIN_FORBIDDEN");
    }

    const payload = (await request.json()) as Payload;
    const title = payload.title?.trim();
    const body = payload.body?.trim();
    const audience = payload.audience ?? "all";
    const route = payload.route?.trim() || "/";

    if (!title || !body) throw new Error("PUSH_CONTENT_REQUIRED");
    if (!["all", "free", "premium"].includes(audience)) {
      throw new Error("INVALID_AUDIENCE");
    }

    let query = adminClient
      .from("user_push_tokens")
      .select("expo_push_token")
      .eq("enabled", true);

    if (audience !== "all") {
      query = query.eq("audience_tier", audience);
    }

    const { data: rows, error: tokensError } = await query;
    if (tokensError) throw tokensError;

    const tokens = [...new Set((rows ?? []).map((row) => row.expo_push_token))];
    const messages = tokens.map((to) => ({
      to,
      sound: "default",
      title,
      body,
      data: { route },
      channelId: "oummah-admin",
    }));

    let successful = 0;
    let failed = 0;

    for (let index = 0; index < messages.length; index += 100) {
      const chunk = messages.slice(index, index + 100);
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();
      const tickets = Array.isArray(result?.data) ? result.data : [];

      for (const ticket of tickets) {
        if (ticket?.status === "ok") successful += 1;
        else failed += 1;
      }

      if (!response.ok) failed += chunk.length;
    }

    await adminClient.from("admin_push_campaigns").insert({
      created_by: userData.user.id,
      title,
      body,
      audience,
      route,
      targeted_devices: tokens.length,
      successful_deliveries: successful,
      failed_deliveries: failed,
    });

    return new Response(
      JSON.stringify({
        sent: tokens.length,
        successful,
        failed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
