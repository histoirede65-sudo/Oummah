import { getValidSession } from '../auth/SupabaseAuthService';
import { translate } from '../../i18n/translate';

/**
 * « Indiquer le certificateur » : when Open Food Facts names no body, a user sends the logo they see and a
 * photo of the packaging. The team checks the photo; once approved, the certifier is shown for this barcode.
 */

const BUCKET = 'halal-certifier-reports';
const confirmedCache = new Map<string, string | null>();

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('NOT_CONFIGURED');
  return { url, key };
}

async function token(key: string) {
  return (await getValidSession().catch(() => null))?.accessToken ?? key;
}

async function rpc<T>(name: string, body: object): Promise<T> {
  const { url, key } = configuration();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${await token(key)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text.includes('TOO_MANY_REPORTS') ? 'TOO_MANY_REPORTS' : 'REQUEST_FAILED');
  return (text ? JSON.parse(text) : null) as T;
}

/** Certifier confirmed by the team for this barcode, or null. Never throws (offline = null). */
export async function getConfirmedCertifier(barcode: string): Promise<string | null> {
  if (confirmedCache.has(barcode)) return confirmedCache.get(barcode) ?? null;
  try {
    const id = await rpc<string | null>('get_halal_product_certifier', { p_barcode: barcode });
    confirmedCache.set(barcode, id || null);
    return id || null;
  } catch {
    return null;
  }
}

export type CertifierReportInput = {
  barcode: string;
  productName?: string;
  /** Body chosen in the list, or null with `other` filled. */
  certifierId: string | null;
  other?: string;
  photo: { uri: string; mimeType?: string | null };
};

export async function submitCertifierReport(input: CertifierReportInput) {
  const { url, key } = configuration();
  const file = await fetch(input.photo.uri);
  const bytes = await file.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 6 * 1024 * 1024) throw new Error('PHOTO_SIZE');
  const mimeType = input.photo.mimeType?.toLowerCase() || 'image/jpeg';
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType.startsWith('image/hei') ? 'heic' : 'jpg';
  const path = `pending/${Date.now()}-${Math.random().toString(36).slice(2, 12)}.${extension}`;
  const upload = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${await token(key)}`, 'Content-Type': mimeType, 'x-upsert': 'false' },
    body: bytes,
  });
  if (!upload.ok) throw new Error('PHOTO_UPLOAD');
  await rpc('submit_halal_certifier_report', {
    p_barcode: input.barcode,
    p_product_name: input.productName ?? null,
    p_certifier_id: input.certifierId,
    p_other: input.other ?? null,
    p_photo_path: path,
  });
}

export function certifierReportErrorMessage(error: unknown) {
  switch (error instanceof Error ? error.message : '') {
    case 'PHOTO_SIZE': return translate("certReport.tooBig");
    case 'TOO_MANY_REPORTS': return translate("certReport.tooMany");
    default: return translate("certReport.sendError");
  }
}
