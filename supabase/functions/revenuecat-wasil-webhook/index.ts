import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const FUNCTION_NAME = "revenuecat-wasil-webhook";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RevenueCatEvent = {
  id?: unknown;
  type?: unknown;
  app_id?: unknown;
  app_user_id?: unknown;
  original_app_user_id?: unknown;
  aliases?: unknown;
  product_id?: unknown;
  transaction_id?: unknown;
  purchased_at_ms?: unknown;
  event_timestamp_ms?: unknown;
  environment?: unknown;
  store?: unknown;
  period_type?: unknown;
  price?: unknown;
  price_in_purchased_currency?: unknown;
  cancel_reason?: unknown;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function log(name: string, fields: Record<string, unknown> = {}) {
  console.log(name, { function: FUNCTION_NAME, ...fields });
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

function ignored(reason: string, eventType?: string | null) {
  log("REVENUECAT_WASIL_WEBHOOK_IGNORED", { reason, eventType: eventType ?? null });
  return json({ ok: true, ignored: true, reason });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "POST" },
    });
  }

  const rawBody = await request.text();
  log("REVENUECAT_WASIL_WEBHOOK_RECEIVED", {
    bodyLength: rawBody.length,
    hasAuthorization: Boolean(request.headers.get("authorization")),
  });

  const secret = Deno.env.get("REVENUECAT_WASIL_WEBHOOK_SECRET")?.trim();
  const authorization = request.headers.get("authorization");
  const expectedAuthorization = secret ? `Bearer ${secret}` : "";
  if (
    !secret ||
    !authorization ||
    !constantTimeEqual(authorization, expectedAuthorization)
  ) {
    log("REVENUECAT_WASIL_WEBHOOK_INVALID_AUTH");
    return json({ ok: false, error: "invalid_auth" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    payload = parsed as Record<string, unknown>;
  } catch {
    log("REVENUECAT_WASIL_WEBHOOK_INVALID_PAYLOAD", { reason: "invalid_json" });
    return json({ ok: false, error: "invalid_payload" }, 400);
  }

  const event = payload.event;
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    log("REVENUECAT_WASIL_WEBHOOK_INVALID_PAYLOAD", { reason: "missing_event" });
    return json({ ok: false, error: "invalid_payload" }, 400);
  }
  const rcEvent = event as RevenueCatEvent;
  const eventType = text(rcEvent.type);

  if (eventType === "TEST") return ignored("dashboard_test_event", eventType);
  if (eventType === "CANCELLATION" || eventType === "REFUND_REVERSED") {
    log("REVENUECAT_WASIL_WEBHOOK_REFUND_NOTED", {
      eventType,
      eventId: text(rcEvent.id),
      reason: text(rcEvent.cancel_reason),
    });
    return ignored("refund_or_cancellation_not_processed", eventType);
  }
  if (eventType !== "NON_RENEWING_PURCHASE") {
    return ignored("event_type_not_supported", eventType);
  }

  const eventId = text(rcEvent.id);
  const appUserId = text(rcEvent.app_user_id);
  const productId = text(rcEvent.product_id);
  const transactionId = text(rcEvent.transaction_id);
  const environment = text(rcEvent.environment);
  const store = text(rcEvent.store);
  const purchasedAtMs = finiteNumber(rcEvent.purchased_at_ms);
  const price = finiteNumber(rcEvent.price_in_purchased_currency) ?? finiteNumber(rcEvent.price);

  if (
    !eventId ||
    !appUserId ||
    !UUID_PATTERN.test(appUserId) ||
    !productId ||
    !transactionId ||
    environment !== "SANDBOX" ||
    store !== "TEST_STORE" ||
    (purchasedAtMs !== null && purchasedAtMs <= 0)
  ) {
    log("REVENUECAT_WASIL_WEBHOOK_INVALID_PAYLOAD", {
      reason: "invalid_purchase_fields",
      eventId,
      eventType,
    });
    return json({ ok: false, error: "invalid_payload" }, 400);
  }

  if (price !== null && price < 0) {
    log("REVENUECAT_WASIL_WEBHOOK_REFUND_NOTED", { eventId, eventType });
    return ignored("negative_purchase_amount_not_processed", eventType);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    log("REVENUECAT_WASIL_WEBHOOK_RPC_FAILURE", { eventId, reason: "server_configuration" });
    return json({ ok: false, error: "server_configuration" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc("grant_wasil_purchase_credits", {
    p_user_id: appUserId,
    p_event_id: eventId,
    p_app_user_id: appUserId,
    p_product_id: productId,
    p_environment: "test",
    p_platform: "revenuecat_test",
    p_store_transaction_id: transactionId,
    p_purchased_at: purchasedAtMs === null ? null : new Date(purchasedAtMs).toISOString(),
    p_metadata: {
      revenuecat: {
        api_version: text(payload.api_version),
        app_id: text(rcEvent.app_id),
        original_app_user_id: text(rcEvent.original_app_user_id),
        aliases: Array.isArray(rcEvent.aliases) ? rcEvent.aliases.slice(0, 10) : [],
        event_timestamp_ms: finiteNumber(rcEvent.event_timestamp_ms),
        type: eventType,
        environment,
        store,
        period_type: text(rcEvent.period_type),
      },
    },
  });

  if (error) {
    log("REVENUECAT_WASIL_WEBHOOK_RPC_FAILURE", {
      eventId,
      errorCode: error.code ?? null,
    });
    return json({ ok: false, error: "purchase_credit_failed" }, 502);
  }

  const result = Array.isArray(data) ? data[0] as Record<string, unknown> | undefined : undefined;
  const alreadyProcessed = result?.already_processed === true;
  if (alreadyProcessed) {
    log("REVENUECAT_WASIL_WEBHOOK_DUPLICATE", { eventId });
    return json({ ok: true, credited: false, alreadyProcessed: true });
  }

  log("REVENUECAT_WASIL_WEBHOOK_CREDITED", {
    eventId,
    productId,
    creditsAdded: result?.credits_added ?? null,
  });
  return json({ ok: true, credited: true, alreadyProcessed: false });
});
