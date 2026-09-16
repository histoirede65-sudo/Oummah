import { createServerClient } from "npm:@quranjs/api/server";

let client: ReturnType<typeof createServerClient> | null = null;

export function getQuranFoundationSdk() {
  if (client) return client;

  const clientId = Deno.env.get("QF_CLIENT_ID");
  const clientSecret = Deno.env.get("QF_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing QF_CLIENT_ID or QF_CLIENT_SECRET environment variables.",
    );
  }

  client = createServerClient({
    clientId,
    clientSecret,
  });

  return client;
}