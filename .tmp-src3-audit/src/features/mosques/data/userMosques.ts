import { getValidSession } from '../../auth/SupabaseAuthService';
import { getDeterministicMosqueImageKey } from './mosqueImage';

export type UserMosqueFeatureState =
  | 'yes'
  | 'no'
  | 'limited'
  | 'unknown';

export type MosqueValidationStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

export type UserMosque = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  source: 'user';
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
  wheelchair?: UserMosqueFeatureState;
  womenSpace?: UserMosqueFeatureState;
  ablutions?: UserMosqueFeatureState;
  parking?: UserMosqueFeatureState;
  toilets?: UserMosqueFeatureState;
  languages?: string[];
  serviceTimes?: string[];
};

export type CreateUserMosqueInput = Omit<
  UserMosque,
  | 'id'
  | 'source'
  | 'imageKey'
  | 'validationStatus'
  | 'createdAt'
  | 'updatedAt'
> & {
  source?: 'user';
};

export type UpdateUserMosqueInput = Partial<
  Omit<
    UserMosque,
    | 'id'
    | 'source'
    | 'imageKey'
    | 'validationStatus'
    | 'createdAt'
  >
> & {
  source?: 'user';
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
  wheelchair: UserMosqueFeatureState | null;
  women_space: UserMosqueFeatureState | null;
  ablutions: UserMosqueFeatureState | null;
  parking: UserMosqueFeatureState | null;
  toilets: UserMosqueFeatureState | null;
  languages: string[] | null;
  service_times: string[] | null;
};

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const USER_MOSQUE_IMAGE_KEYS = [
  'mosque-a-00',
  'mosque-a-01',
  'mosque-a-02',
  'mosque-a-03',
  'mosque-a-04',
  'mosque-a-05',
  'mosque-a-06',
  'mosque-a-07',
  'mosque-a-08',
  'mosque-a-09',
  'mosque-a-10',
  'mosque-a-11',
  'mosque-b-00',
  'mosque-b-01',
  'mosque-b-02',
  'mosque-b-03',
  'mosque-b-04',
  'mosque-b-05',
  'mosque-b-06',
  'mosque-b-07',
  'mosque-b-08',
  'mosque-b-09',
  'mosque-b-10',
  'mosque-b-11',
  'mosque-coastal',
  'mosque-neighborhood',
  'mosque-c-00',
  'mosque-c-01',
  'mosque-c-02',
  'mosque-c-03',
  'mosque-c-04',
  'mosque-c-05',
  'mosque-c-06',
  'mosque-c-07',
  'mosque-c-08',
  'mosque-c-09',
  'mosque-c-10',
  'mosque-c-11',
  'mosque-d-00',
  'mosque-d-01',
  'mosque-d-02',
  'mosque-d-03',
  'mosque-d-04',
  'mosque-d-05',
  'mosque-d-06',
  'mosque-d-07',
  'mosque-d-08',
  'mosque-d-09',
  'mosque-d-10',
  'mosque-d-11',
] as const;

function assertSupabaseConfiguration() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('USER_MOSQUE_SUPABASE_NOT_CONFIGURED');
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function cleanOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined;

  const cleaned = value.trim();
  return cleaned || undefined;
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : undefined;
}

function assertCoordinates(
  latitude: unknown,
  longitude: unknown,
) {
  if (
    !isFiniteNumber(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !isFiniteNumber(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('USER_MOSQUE_COORDINATES_INVALID');
  }
}

function assertRequiredFields(
  name: unknown,
  address: unknown,
) {
  if (!cleanOptionalString(name)) {
    throw new Error('USER_MOSQUE_NAME_REQUIRED');
  }

  if (!cleanOptionalString(address)) {
    throw new Error('USER_MOSQUE_ADDRESS_REQUIRED');
  }
}

function normalizeFields(
  input: CreateUserMosqueInput | UpdateUserMosqueInput,
) {
  return {
    name: cleanOptionalString(input.name),
    address: cleanOptionalString(input.address),
    alternativeName: cleanOptionalString(
      input.alternativeName,
    ),
    arabicName: cleanOptionalString(input.arabicName),
    phone: cleanOptionalString(input.phone),
    email: cleanOptionalString(input.email),
    website: cleanOptionalString(input.website),
    openingHours: cleanOptionalString(input.openingHours),
    operator: cleanOptionalString(input.operator),
    denomination: cleanOptionalString(input.denomination),
    wheelchair: input.wheelchair,
    womenSpace: input.womenSpace,
    ablutions: input.ablutions,
    parking: input.parking,
    toilets: input.toilets,
    languages: cleanStringArray(input.languages),
    serviceTimes: cleanStringArray(input.serviceTimes),
  };
}

function toUserMosque(row: MosqueSubmissionRow): UserMosque {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    source: 'user',
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
  };
}

function buildHeaders(preferRepresentation = false) {
  assertSupabaseConfiguration();

  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(preferRepresentation
      ? { Prefer: 'return=representation' }
      : {}),
  };
}

async function buildAuthenticatedHeaders(preferRepresentation = false) {
  assertSupabaseConfiguration();

  const session = await getValidSession();
  if (!session?.accessToken) {
    throw new Error('USER_MOSQUE_AUTH_REQUIRED');
  }

  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
    ...(preferRepresentation
      ? { Prefer: 'return=representation' }
      : {}),
  };
}

/**
 * Retourne uniquement les mosquées approuvées.
 * Les propositions pending/rejected restent invisibles dans la liste publique.
 */
export async function getUserMosques(): Promise<UserMosque[]> {
  assertSupabaseConfiguration();

  const params = new URLSearchParams({
    select: '*',
    validation_status: 'eq.approved',
    is_hidden: 'eq.false',
    order: 'created_at.desc',
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/mosque_submissions?${params.toString()}`,
    {
      method: 'GET',
      headers: buildHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error('USER_MOSQUE_LIST_FAILED');
  }

  const rows = (await response.json()) as MosqueSubmissionRow[];
  return rows.map(toUserMosque);
}

export async function getUserMosqueById(
  id: string,
): Promise<UserMosque | null> {
  assertSupabaseConfiguration();

  const params = new URLSearchParams({
    select: '*',
    id: `eq.${id}`,
    validation_status: 'eq.approved',
    is_hidden: 'eq.false',
    limit: '1',
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/mosque_submissions?${params.toString()}`,
    {
      method: 'GET',
      headers: buildHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error('USER_MOSQUE_READ_FAILED');
  }

  const rows = (await response.json()) as MosqueSubmissionRow[];
  return rows[0] ? toUserMosque(rows[0]) : null;
}

/**
 * Envoie une proposition avec la session de l'utilisateur connecté.
 * Supabase décide seul du statut : owner/admin = approved, sinon pending.
 */
export async function createUserMosque(
  input: CreateUserMosqueInput,
): Promise<UserMosque> {
  if (
    input.source !== undefined &&
    input.source !== 'user'
  ) {
    throw new Error('USER_MOSQUE_SOURCE_INVALID');
  }

  assertRequiredFields(input.name, input.address);
  assertCoordinates(input.latitude, input.longitude);

  const fields = normalizeFields(input);

  const payload = {
    name: fields.name!,
    address: fields.address!,
    latitude: input.latitude,
    longitude: input.longitude,
    image_key: USER_MOSQUE_IMAGE_KEYS[0],
    alternative_name: fields.alternativeName ?? null,
    arabic_name: fields.arabicName ?? null,
    phone: fields.phone ?? null,
    email: fields.email ?? null,
    website: fields.website ?? null,
    opening_hours: fields.openingHours ?? null,
    operator: fields.operator ?? null,
    denomination: fields.denomination ?? null,
    wheelchair: fields.wheelchair ?? 'unknown',
    women_space: fields.womenSpace ?? 'unknown',
    ablutions: fields.ablutions ?? 'unknown',
    parking: fields.parking ?? 'unknown',
    toilets: fields.toilets ?? 'unknown',
    languages: fields.languages ?? [],
    service_times: fields.serviceTimes ?? [],
  };

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/mosque_submissions`,
    {
      method: 'POST',
      headers: await buildAuthenticatedHeaders(true),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error('USER_MOSQUE_CREATE_FAILED');
  }

  const rows = (await response.json()) as MosqueSubmissionRow[];
  const row = rows[0];

  if (!row) {
    throw new Error('USER_MOSQUE_CREATE_EMPTY');
  }

  const deterministicImageKey = getDeterministicMosqueImageKey(row.id);
  const updateResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/mosque_submissions?id=eq.${encodeURIComponent(row.id)}`,
    {
      method: 'PATCH',
      headers: await buildAuthenticatedHeaders(true),
      body: JSON.stringify({ image_key: deterministicImageKey }),
    },
  );

  if (!updateResponse.ok) {
    throw new Error('USER_MOSQUE_IMAGE_ASSIGNMENT_FAILED');
  }

  return toUserMosque({ ...row, image_key: deterministicImageKey });
}

/**
 * Les modifications et suppressions publiques sont volontairement bloquées.
 * Une proposition doit être corrigée/validée depuis l'administration Supabase.
 */
export async function updateUserMosque(
  _id: string,
  _updates: UpdateUserMosqueInput,
): Promise<UserMosque | null> {
  throw new Error('USER_MOSQUE_ADMIN_REVIEW_REQUIRED');
}

export async function deleteUserMosque(
  _id: string,
): Promise<boolean> {
  throw new Error('USER_MOSQUE_ADMIN_REVIEW_REQUIRED');
}
