import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserMosqueFeatureState =
  | 'yes'
  | 'no'
  | 'limited'
  | 'unknown';

export type UserMosque = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  source: 'user';
  imageKey: string;
  validationStatus: 'local';
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
    'id' | 'source' | 'imageKey' | 'validationStatus' | 'createdAt'
  >
> & {
  source?: 'user';
};

const USER_MOSQUES_KEY = 'oummah.mosques.user.v1';

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
] as const;

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

function assertCoordinates(latitude: unknown, longitude: unknown) {
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

function assertRequiredFields(name: unknown, address: unknown) {
  if (!cleanOptionalString(name)) {
    throw new Error('USER_MOSQUE_NAME_REQUIRED');
  }

  if (!cleanOptionalString(address)) {
    throw new Error('USER_MOSQUE_ADDRESS_REQUIRED');
  }
}

function createLocalId() {
  return `user-mosque-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function selectImageKey() {
  const index = Math.floor(Math.random() * USER_MOSQUE_IMAGE_KEYS.length);
  return USER_MOSQUE_IMAGE_KEYS[index] ?? USER_MOSQUE_IMAGE_KEYS[0];
}

function isUserMosque(value: unknown): value is UserMosque {
  if (!value || typeof value !== 'object') return false;

  const mosque = value as Partial<UserMosque>;

  return (
    typeof mosque.id === 'string' &&
    typeof mosque.name === 'string' &&
    mosque.name.trim().length > 0 &&
    typeof mosque.address === 'string' &&
    mosque.address.trim().length > 0 &&
    isFiniteNumber(mosque.latitude) &&
    mosque.latitude >= -90 &&
    mosque.latitude <= 90 &&
    isFiniteNumber(mosque.longitude) &&
    mosque.longitude >= -180 &&
    mosque.longitude <= 180 &&
    mosque.source === 'user' &&
    typeof mosque.imageKey === 'string' &&
    (USER_MOSQUE_IMAGE_KEYS as readonly string[]).includes(mosque.imageKey) &&
    mosque.validationStatus === 'local' &&
    typeof mosque.createdAt === 'string' &&
    typeof mosque.updatedAt === 'string'
  );
}

async function readUserMosques() {
  try {
    const rawValue = await AsyncStorage.getItem(USER_MOSQUES_KEY);
    if (!rawValue) return [];

    const parsed: unknown = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter(isUserMosque) : [];
  } catch {
    return [];
  }
}

async function writeUserMosques(mosques: UserMosque[]) {
  await AsyncStorage.setItem(USER_MOSQUES_KEY, JSON.stringify(mosques));
}

function normalizeFields(
  input: CreateUserMosqueInput | UpdateUserMosqueInput,
) {
  return {
    name: cleanOptionalString(input.name),
    address: cleanOptionalString(input.address),
    alternativeName: cleanOptionalString(input.alternativeName),
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

export async function getUserMosques(): Promise<UserMosque[]> {
  return readUserMosques();
}

export async function getUserMosqueById(
  id: string,
): Promise<UserMosque | null> {
  const mosque = (await readUserMosques()).find((item) => item.id === id);
  return mosque ?? null;
}

export async function createUserMosque(
  input: CreateUserMosqueInput,
): Promise<UserMosque> {
  if (input.source !== undefined && input.source !== 'user') {
    throw new Error('USER_MOSQUE_SOURCE_INVALID');
  }

  assertRequiredFields(input.name, input.address);
  assertCoordinates(input.latitude, input.longitude);

  const now = new Date().toISOString();
  const fields = normalizeFields(input);
  const mosque: UserMosque = {
    ...fields,
    name: fields.name!,
    address: fields.address!,
    latitude: input.latitude,
    longitude: input.longitude,
    id: createLocalId(),
    source: 'user',
    imageKey: selectImageKey(),
    validationStatus: 'local',
    createdAt: now,
    updatedAt: now,
  };

  const mosques = await readUserMosques();
  await writeUserMosques([...mosques, mosque]);
  return mosque;
}

export async function updateUserMosque(
  id: string,
  updates: UpdateUserMosqueInput,
): Promise<UserMosque | null> {
  if (updates.source !== undefined && updates.source !== 'user') {
    throw new Error('USER_MOSQUE_SOURCE_INVALID');
  }

  const mosques = await readUserMosques();
  const index = mosques.findIndex((mosque) => mosque.id === id);
  if (index < 0) return null;

  const current = mosques[index];
  const nextFields = normalizeFields(updates);
  const nextName = nextFields.name ?? current.name;
  const nextAddress = nextFields.address ?? current.address;
  const nextLatitude = updates.latitude ?? current.latitude;
  const nextLongitude = updates.longitude ?? current.longitude;

  assertRequiredFields(nextName, nextAddress);
  assertCoordinates(nextLatitude, nextLongitude);

  const updated: UserMosque = {
    ...current,
    ...nextFields,
    name: nextName,
    address: nextAddress,
    latitude: nextLatitude,
    longitude: nextLongitude,
    updatedAt: new Date().toISOString(),
  };

  mosques[index] = updated;
  await writeUserMosques(mosques);
  return updated;
}

export async function deleteUserMosque(id: string): Promise<boolean> {
  const mosques = await readUserMosques();
  const nextMosques = mosques.filter((mosque) => mosque.id !== id);
  if (nextMosques.length === mosques.length) return false;

  await writeUserMosques(nextMosques);
  return true;
}
