import { getValidSession } from "../auth/SupabaseAuthService";
import { adminRpc } from "./adminClient";

/** « Indiquer le certificateur » reports from the Scan, checked by the team on the packaging photo. */
export type CertifierReport = {
  id: string;
  barcode: string;
  productName: string | null;
  certifierId: string | null;
  other: string | null;
  createdAt: string;
  /** Certifier already confirmed for this barcode, if any. */
  current: string | null;
  /** Temporary link to the private photo (1 hour), null if it could not be signed. */
  photoUrl: string | null;
};

async function signPhoto(path: string): Promise<string | null> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const session = await getValidSession().catch(() => null);
  if (!url || !key || !session?.accessToken) return null;
  try {
    const response = await fetch(`${url}/storage/v1/object/sign/halal-certifier-reports/${path}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 3600 }),
    });
    if (!response.ok) return null;
    const { signedURL } = (await response.json()) as { signedURL?: string };
    return signedURL ? `${url}/storage/v1${signedURL}` : null;
  } catch {
    return null;
  }
}

export async function listCertifierReports(): Promise<CertifierReport[]> {
  const rows = await adminRpc<{ id: string; barcode: string; product_name: string | null; certifier_id: string | null; other_certifier: string | null; photo_path: string; created_at: string; current_certifier: string | null }[]>("admin_list_halal_certifier_reports", {});
  return Promise.all(rows.map(async (row) => ({
    id: row.id,
    barcode: row.barcode,
    productName: row.product_name,
    certifierId: row.certifier_id,
    other: row.other_certifier,
    createdAt: row.created_at,
    current: row.current_certifier,
    photoUrl: await signPhoto(row.photo_path),
  })));
}

/** Approve with the certifier read on the photo (may differ from the user's choice), or refuse. */
export const reviewCertifierReport = (id: string, approve: boolean, certifierId?: string) =>
  adminRpc<void>("admin_review_halal_certifier_report", { p_id: id, p_approve: approve, p_certifier_id: certifierId ?? null });
