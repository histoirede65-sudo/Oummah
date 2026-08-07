import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get("Authorization") ?? "";
    const token = authorization.replace(/^Bearer\s+/i, "");

    if (!token) throw new Error("AUTH_REQUIRED");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const client = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const { data: authData, error: authError } =
      await client.auth.getUser(token);

    if (authError || !authData.user) {
      throw new Error("AUTH_REQUIRED");
    }

    const { data: adminRow } = await client
      .from("oummah_admin_users")
      .select("role")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (!adminRow) throw new Error("ADMIN_FORBIDDEN");

    const payload = (await request.json()) as { ticketId?: string };
    if (!payload.ticketId) throw new Error("TICKET_ID_REQUIRED");

    const { data: target, error: targetError } = await client.rpc(
      "admin_get_support_push_target",
      {
        p_ticket_id: payload.ticketId,
      },
    );

    if (targetError) throw targetError;

    const tokens = Array.isArray(target?.tokens)
      ? [...new Set(target.tokens.filter((value: unknown) => typeof value === "string"))]
      : [];

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const messages = tokens.map((to) => ({
      to,
      title: "Nouvelle réponse du support OUMMAH",
      body: target?.subject
        ? `L’équipe a répondu à votre demande : ${target.subject}`
        : "L’équipe OUMMAH a répondu à votre demande.",
      sound: "default",
      channelId: "oummah-admin",
      data: {
        route: `/support/${payload.ticketId}`,
      },
    }));

    const response = await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(messages),
      },
    );

    if (!response.ok) {
      throw new Error("EXPO_PUSH_FAILED");
    }

    return new Response(
      JSON.stringify({ sent: tokens.length }),
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
