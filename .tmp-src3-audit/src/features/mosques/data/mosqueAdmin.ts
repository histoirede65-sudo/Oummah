import { getValidSession } from '../../auth/SupabaseAuthService';

export const MOSQUE_ADMIN_EMAIL = 'bahri13015@hotmail.fr';

export type MosqueValidationStatus = 'pending' | 'approved' | 'rejected';

export type MosqueSubmission = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  imageKey: string;
  validationStatus: MosqueValidationStatus;
  createdAt: string;
  updatedAt: string;
  alternativeName?: string;
  arabicName?: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  operator?: string;
  denomination?: string;
  wheelchair?: string;
  womenSpace?: string;
  ablutions?: string;
  parking?: string;
  toilets?: string;
  languages?: string[];
  serviceTimes?: string[];
  rejectionReason?: string;
};

type MosqueSubmissionRow = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  image_key: string;
  validation_status: MosqueValidationStatus;
  created_at: string;
  updated_at: string;
  alternative_name: string | null;
  arabic_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  opening_hours: string | null;
  operator: string | null;
  denomination: string | null;
  wheelchair: string | null;
  women_space: string | null;
  ablutions: string | null;
  parking: string | null;
  toilets: string | null;
  languages: string[] | null;
  service_times: string[] | null;
  rejection_reason: string | null;
};

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '');
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error('MOSQUE_ADMIN_NOT_CONFIGURED');
  }

  return { url, key };
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

export function isMosqueAdminEmail(value?: string) {
  return normalizeEmail(value) === MOSQUE_ADMIN_EMAIL;
}

async function adminRequest(path: string, init?: RequestInit) {
  const session = await getValidSession();
  if (!session || !isMosqueAdminEmail(session.user.email)) {
    throw new Error('MOSQUE_ADMIN_FORBIDDEN');
  }

  const { url, key } = configuration();
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

function toSubmission(row: MosqueSubmissionRow): MosqueSubmission {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    imageKey: row.image_key,
    validationStatus: row.validation_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    alternativeName: row.alternative_name ?? undefined,
    arabicName: row.arabic_name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    openingHours: row.opening_hours ?? undefined,
    operator: row.operator ?? undefined,
    denomination: row.denomination ?? undefined,
    wheelchair: row.wheelchair ?? undefined,
    womenSpace: row.women_space ?? undefined,
    ablutions: row.ablutions ?? undefined,
    parking: row.parking ?? undefined,
    toilets: row.toilets ?? undefined,
    languages: row.languages ?? undefined,
    serviceTimes: row.service_times ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

export async function getMosqueSubmissions(
  status: MosqueValidationStatus,
): Promise<MosqueSubmission[]> {
  const query = new URLSearchParams({
    select: '*',
    validation_status: `eq.${status}`,
    order: 'created_at.desc',
  });

  const response = await adminRequest(`mosque_submissions?${query.toString()}`);
  if (!response.ok) throw new Error('MOSQUE_ADMIN_LIST_FAILED');

  const rows = (await response.json()) as MosqueSubmissionRow[];
  return rows.map(toSubmission);
}

export async function reviewMosqueSubmission(
  id: string,
  status: Exclude<MosqueValidationStatus, 'pending'>,
  rejectionReason?: string,
) {
  const session = await getValidSession();
  if (!session || !isMosqueAdminEmail(session.user.email)) {
    throw new Error('MOSQUE_ADMIN_FORBIDDEN');
  }

  const query = new URLSearchParams({ id: `eq.${id}` });
  const response = await adminRequest(`mosque_submissions?${query.toString()}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      validation_status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
      rejection_reason:
        status === 'rejected' ? rejectionReason?.trim() || null : null,
    }),
  });

  if (!response.ok) throw new Error('MOSQUE_ADMIN_REVIEW_FAILED');
}
