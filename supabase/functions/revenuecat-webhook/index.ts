import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RevenueCatWebhook = {
  api_version?: string;
  event?: Record<string, unknown>;
};

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function millisToIso(value: unknown) {
  const millis = asNumber(value);
  if (millis === null) return null;
  const date = new Date(millis);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function eventIsActive(type: string, expirationAt: string | null) {
  if (["TEST", "EXPIRATION", "REFUND"].includes(type)) return false;
  if (expirationAt) return new Date(expirationAt).getTime() > Date.now();
  return [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "PRODUCT_CHANGE",
    "SUBSCRIPTION_EXTENDED",
    "BILLING_ISSUE",
    "TEMPORARY_ENTITLEMENT_GRANT",
  ].includes(type);
}

Deno.serve(async (request) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const expectedAuthorization =
      Deno.env.get("REVENUECAT_WEBHOOK_AUTH")?.trim();

    if (!expectedAuthorization) {
      throw new Error("REVENUECAT_WEBHOOK_AUTH_NOT_CONFIGURED");
    }

    const receivedAuthorization =
      request.headers.get("Authorization")?.trim();

    if (receivedAuthorization !== expectedAuthorization) {
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = (await request.json()) as RevenueCatWebhook;
    const event = payload.event ?? {};
    const eventId = asString(event.id);
    const eventType = asString(event.type);

    if (!eventId || !eventType) {
      throw new Error("INVALID_REVENUECAT_EVENT");
    }

    const appUserId = asString(event.app_user_id);
    const productId = asString(event.product_id) ?? "unknown";
    const transactionId = asString(event.transaction_id);
    const originalTransactionId = asString(event.original_transaction_id);
    const store = asString(event.store);
    const environment = asString(event.environment);
    const currency = asString(event.currency);
    const priceUsd = asNumber(event.price);
    const pricePurchased = asNumber(event.price_in_purchased_currency);
    const purchasedAt = millisToIso(event.purchased_at_ms);
    const expirationAt = millisToIso(event.expiration_at_ms);
    const billingIssueAt =
      eventType === "BILLING_ISSUE"
        ? millisToIso(event.event_timestamp_ms) ?? new Date().toISOString()
        : null;
    const canceledAt =
      eventType === "CANCELLATION"
        ? millisToIso(event.event_timestamp_ms) ?? new Date().toISOString()
        : null;
    const periodType = asString(event.period_type);
    const willRenew =
      typeof event.will_renew === "boolean"
        ? event.will_renew
        : eventType === "CANCELLATION"
          ? false
          : null;
    const active = eventIsActive(eventType, expirationAt);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: eventError } = await supabase
      .from("revenuecat_webhook_events")
      .upsert(
        {
          event_id: eventId,
          event_type: eventType,
          app_user_id: appUserId,
          product_id: productId,
          transaction_id: transactionId,
          original_transaction_id: originalTransactionId,
          store,
          environment,
          currency,
          price_usd: priceUsd,
          price_in_purchased_currency: pricePurchased,
          purchased_at: purchasedAt,
          expiration_at: expirationAt,
          raw_payload: payload,
        },
        { onConflict: "event_id" },
      );

    if (eventError) throw eventError;

    if (appUserId) {
      const aliases = Array.isArray(event.aliases)
        ? event.aliases.filter((value): value is string => typeof value === "string")
        : [];

      const subscriberAttributes =
        event.subscriber_attributes &&
        typeof event.subscriber_attributes === "object"
          ? event.subscriber_attributes as Record<string, unknown>
          : {};

      const emailAttribute =
        subscriberAttributes["$email"] &&
        typeof subscriberAttributes["$email"] === "object"
          ? subscriberAttributes["$email"] as Record<string, unknown>
          : null;

      const subscriberEmail = asString(emailAttribute?.value);

      let resolvedUserId: string | null = null;

      const uuidCandidates = [appUserId, ...aliases].filter((value) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
      );

      for (const candidate of uuidCandidates) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", candidate)
          .maybeSingle();

        if (profileRow?.id) {
          resolvedUserId = profileRow.id;
          break;
        }
      }

      if (!resolvedUserId && subscriberEmail) {
        const { data: usersResult } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        const matchedUser = usersResult?.users?.find(
          (user) => user.email?.trim().toLowerCase() === subscriberEmail.toLowerCase(),
        );

        resolvedUserId = matchedUser?.id ?? null;
      }

      const { error: subscriptionError } = await supabase
        .from("revenuecat_customer_subscriptions")
        .upsert(
          {
            app_user_id: appUserId,
            product_id: productId,
            user_id: resolvedUserId,
            store,
            environment,
            latest_event_type: eventType,
            active,
            will_renew: willRenew,
            is_trial: periodType === "TRIAL",
            purchased_at: purchasedAt,
            expiration_at: expirationAt,
            billing_issue_detected_at:
              eventType === "BILLING_ISSUE"
                ? billingIssueAt
                : eventType === "RENEWAL"
                  ? null
                  : undefined,
            canceled_at:
              eventType === "CANCELLATION"
                ? canceledAt
                : eventType === "UNCANCELLATION"
                  ? null
                  : undefined,
            last_event_id: eventId,
            raw_event: event,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "app_user_id,product_id" },
        );

      if (subscriptionError) throw subscriptionError;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
