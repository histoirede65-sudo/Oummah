import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = {
  title?: string;
  body?: string;
  audience?: "all" | "free" | "premium";
  data?: Record<string, unknown>;
};

Deno.serve(async (request) => {
  try {
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "METHOD_NOT_ALLOWED" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = request.headers.get("Authorization") ?? "";

    if (!authorization) {
      throw new Error("AUTH_REQUIRED");
    }

    const authClient = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    const { data: userData, error: userError } =
      await authClient.auth.getUser(
        authorization.replace(/^Bearer\s+/i, ""),
      );

    if (userError || !userData.user) {
      console.error("AUTH_ERROR", userError);
      throw new Error("AUTH_REQUIRED");
    }

    console.log(
      "ADMIN_CHECK_USER_ID",
      userData.user.id,
    );

    const ADMIN_USER_IDS = [
      "0c47c589-9c17-4d3d-977f-0092a71b96d7",
    ];

    if (!ADMIN_USER_IDS.includes(userData.user.id)) {
      console.error(
        "ADMIN_FORBIDDEN_USER",
        userData.user.id,
      );

      throw new Error("ADMIN_FORBIDDEN");
    }

    console.log(
      "ADMIN_ALLOWED",
      userData.user.id,
    );

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    const payload = (await request.json()) as Payload;

    const title = payload.title?.trim();
    const body = payload.body?.trim();
    const audience = payload.audience ?? "all";

    if (!title || !body) {
      throw new Error("INVALID_PAYLOAD");
    }

    if (!["all", "free", "premium"].includes(audience)) {
      throw new Error("INVALID_AUDIENCE");
    }

    let tokenQuery = adminClient
      .from("user_push_tokens")
      .select("expo_push_token, user_id, audience_tier")
      .eq("enabled", true);

    if (audience !== "all") {
      tokenQuery = tokenQuery.eq(
        "audience_tier",
        audience,
      );
    }

    const {
      data: tokenRows,
      error: tokenError,
    } = await tokenQuery;

    if (tokenError) {
      console.error(
        "TOKEN_QUERY_FAILED",
        tokenError,
      );
      throw new Error("TOKEN_QUERY_FAILED");
    }

    const tokens = (tokenRows ?? [])
      .map((row) => row.expo_push_token)
      .filter(
        (token): token is string =>
          typeof token === "string" &&
          token.startsWith("ExponentPushToken["),
      );

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          sent: 0,
          message: "NO_PUSH_TOKENS",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data: payload.data ?? {},
    }));

    let sentCount = 0;

    for (
      let index = 0;
      index < messages.length;
      index += 100
    ) {
      const chunk = messages.slice(
        index,
        index + 100,
      );

      const response = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(chunk),
        },
      );

      const responseText = await response.text();

      console.log(
        "EXPO_PUSH_RESPONSE",
        response.status,
        responseText,
      );

      if (!response.ok) {
        console.error(
          "EXPO_PUSH_FAILED",
          response.status,
          responseText,
        );

        throw new Error("PUSH_SEND_FAILED");
      }

      sentCount += chunk.length;
    }

    const {
      error: campaignError,
    } = await adminClient
      .from("admin_push_campaigns")
      .insert({
        title,
        body,
        audience,
        sent_count: sentCount,
        created_by: userData.user.id,
      });

    if (campaignError) {
      console.error(
        "CAMPAIGN_INSERT_FAILED",
        campaignError,
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent: sentCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    console.error(
      "SEND_ADMIN_PUSH_ERROR",
      message,
    );

    return new Response(
      JSON.stringify({
        ok: false,
        error: message,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});