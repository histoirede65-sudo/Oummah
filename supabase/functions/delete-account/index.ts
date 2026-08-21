import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

function response(body: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ message: "Méthode non autorisée." }, 405);

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return response({ message: "Session absente ou invalide." }, 401);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error("Configuration serveur incomplète.");
    }

    // Validate the caller with the JWT. No user id is accepted from the body.
    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error: userError } = await authClient.auth.getUser(token);
    if (userError || !data.user) return response({ message: "Session absente ou invalide." }, 401);

    const adminClient = createClient(url, serviceRoleKey);
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(data.user.id);
    if (deleteError) {
      console.error("delete-account failed", { userId: data.user.id, error: deleteError.message });
      return response({ message: "La suppression n’a pas pu être terminée. Vos données sont toujours présentes." }, 409);
    }

    return response({ message: "Compte supprimé définitivement." });
  } catch (error) {
    console.error("delete-account error", error);
    return response({ message: "Une erreur serveur a empêché la suppression du compte." }, 500);
  }
});
