import { getValidSession } from "../../auth/SupabaseAuthService";

export type MosqueReportReason =
  | "wrong_address"
  | "wrong_hours"
  | "closed"
  | "duplicate"
  | "wrong_information"
  | "other";

export async function createMosqueReport(input: {
  mosqueId: string;
  mosqueName: string;
  mosqueAddress: string;
  latitude: number;
  longitude: number;
  reason: MosqueReportReason;
  details?: string;
}) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !key) throw new Error("MOSQUE_REPORT_SUPABASE_NOT_CONFIGURED");
  const session = await getValidSession().catch(() => null);
  const response = await fetch(`${url}/rest/v1/mosque_reports`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session?.accessToken ?? key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      mosque_id: input.mosqueId,
      mosque_name: input.mosqueName.trim(),
      mosque_address: input.mosqueAddress.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      reason: input.reason,
      details: input.details?.trim() || null,
    }),
  });
  if (!response.ok) throw new Error("MOSQUE_REPORT_CREATE_FAILED");
}
