import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getHalalVerificationCopy,
  type HalalCoordinates,
  type HalalPlace,
  type HalalPlaceCategory,
  type HalalVerificationStatus,
} from '../domain/HalalPlace';
import {
  getGoogleHalalPlaceDetails,
  getNearbyHalalPlacesFromGoogle,
  type GoogleHalalPlace,
} from './googleHalalPlaces';

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string | undefined>;
};

type OverpassResponse = { elements?: OverpassElement[] };

type HalalSubmissionRow = {
  id: string;
  name: string;
  category: HalalPlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  website?: string | null;
  opening_hours?: string | null;
  note?: string | null;
  contributor_type: 'community' | 'owner';
  validation_status: 'pending' | 'approved' | 'rejected';
  reviewed_at?: string | null;
};

type HalalPlacePhotoRow = {
  id: string;
  place_key: string;
  storage_path: string;
  validation_status: 'pending' | 'approved' | 'rejected';
  reviewed_at?: string | null;
};

export type HalalPlacePhotoSubmissionInput = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export type HalalPlaceSubmissionInput = {
  name: string;
  category: HalalPlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  openingHours?: string;
  verificationStatus: Extract<HalalVerificationStatus, 'declared' | 'community'>;
  note?: string;
};

export type HalalPlaceReport = {
  id: string;
  placeId: string;
  reason: string;
  note?: string;
  createdAt: string;
};

// Ordre = fiabilité mesurée (octobre 2026) : overpass-api.de répond en quelques secondes s'il reçoit un
// User-Agent (sinon 406), maps.mail.ru répond mais lentement, overpass.kumi.systems ne répond plus.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
] as const;
// overpass-api.de refuse les requêtes sans application identifiée.
const OVERPASS_USER_AGENT = 'OUMMAH/1.0 (com.oummah.app)';
const CACHE_PREFIX = 'oummah.halal.search.v2';
const LAST_RESULTS_KEY = 'oummah.halal.last-results.v2';
const LAST_SEARCH_KEY = 'oummah.halal.last-search.v1';
const FAVORITES_KEY = 'oummah.halal.favorites.v1';
const SUBMISSIONS_KEY = 'oummah.halal.submissions.v1';
const REPORTS_KEY = 'oummah.halal.reports.v1';
const PENDING_PHOTO_KEYS = 'oummah.halal.pending-photo-keys.v1';
const HALAL_PHOTO_BUCKET = 'halal-place-photos';
const CACHE_MAX_AGE_MS = 8 * 60 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 14_000;
const MAX_RESULTS = 120;
const SAME_ZONE_MAX_DISTANCE_METERS = 3_000;
const sessionPlaces = new Map<string, HalalPlace>();
// Lieux Google vus depuis l'ouverture de l'app (mémoire seulement : les conditions de Google
// n'autorisent pas à les enregistrer durablement sur le téléphone).
const sessionGooglePlaces = new Map<string, HalalPlace>();

function getSupabaseConfiguration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()
    || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

function supabaseHeaders(key: string, write = false) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    ...(write ? { 'Content-Type': 'application/json', Prefer: 'return=minimal' } : {}),
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceMeters(origin: HalalCoordinates, target: HalalCoordinates) {
  const earthRadius = 6_371_000;
  const latitudeDelta = toRadians(target.latitude - origin.latitude);
  const longitudeDelta = toRadians(target.longitude - origin.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(target.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatHalalDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) return `${Math.max(1, Math.round(distanceMeters))} m`;
  return `${(distanceMeters / 1_000).toFixed(distanceMeters < 10_000 ? 1 : 0)} km`;
}

function normalizeText(value: string | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildAddress(tags: Record<string, string | undefined>) {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const city = tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'] ?? tags['addr:suburb'];
  const postcode = tags['addr:postcode'];
  return [street, [postcode, city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || 'Adresse non renseignée';
}

function getCategory(tags: Record<string, string | undefined>): HalalPlaceCategory {
  if (tags.shop === 'butcher') return 'butcher';
  if (tags.shop === 'bakery' || tags.shop === 'pastry') return 'bakery';
  if (['supermarket', 'convenience', 'deli', 'greengrocer'].includes(tags.shop ?? '')) return 'grocery';
  if (tags.amenity === 'fast_food' || tags.amenity === 'food_court') return 'fast_food';
  if (tags.amenity === 'restaurant' || tags.amenity === 'cafe') return 'restaurant';
  return 'other';
}

function getGoogleCategory(place: GoogleHalalPlace): HalalPlaceCategory {
  const types = new Set<string>(
    [place.primaryType, ...(place.types ?? [])].filter((value): value is string => Boolean(value)),
  );
  if (types.has('butcher_shop')) return 'butcher';
  if (types.has('bakery')) return 'bakery';
  if (types.has('grocery_store') || types.has('supermarket') || types.has('convenience_store')) return 'grocery';
  if (types.has('fast_food_restaurant') || types.has('meal_takeaway') || types.has('meal_delivery')) return 'fast_food';
  if (types.has('restaurant') || types.has('cafe')) return 'restaurant';
  return 'other';
}

function getVerification(tags: Record<string, string | undefined>) {
  const explicitHalal = tags['diet:halal'] === 'yes' || tags.halal === 'yes';
  const certificate = tags['halal:certification'] ?? tags.certification;
  const status: HalalVerificationStatus = explicitHalal || certificate ? 'declared' : 'unknown';
  return { status, ...getHalalVerificationCopy(status), certificate };
}

function parseBoolean(value: string | undefined) {
  if (value === 'yes' || value === 'only') return true;
  if (value === 'no') return false;
  return undefined;
}

function mapElement(element: OverpassElement, origin: HalalCoordinates): HalalPlace | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  const tags = element.tags ?? {};
  const name = tags.name ?? tags['name:fr'];
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !name) return null;
  const distanceMeters = getDistanceMeters(origin, { latitude, longitude });
  const verification = getVerification(tags);
  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    category: getCategory(tags),
    address: buildAddress(tags),
    latitude,
    longitude,
    distanceMeters,
    distanceLabel: formatHalalDistance(distanceMeters),
    verificationStatus: verification.status,
    verificationLabel: verification.label,
    verificationDetail: verification.detail,
    certificateBody: verification.certificate,
    source: 'openstreetmap',
    phone: tags.phone ?? tags['contact:phone'],
    website: tags.website ?? tags['contact:website'],
    openingHours: tags.opening_hours,
    cuisine: tags.cuisine?.split(';').join(' · '),
    takeaway: parseBoolean(tags.takeaway),
    delivery: parseBoolean(tags.delivery),
    wheelchair: parseBoolean(tags.wheelchair),
    alcohol: tags['diet:alcohol_free'] === 'yes' || tags.alcohol === 'no' ? 'no' : tags.alcohol === 'yes' ? 'yes' : 'unknown',
    lastCheckedAt: new Date().toISOString(),
  };
}

function mapGooglePlace(place: GoogleHalalPlace, origin: HalalCoordinates): HalalPlace | null {
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;
  const name = place.displayName?.text?.trim();
  if (!place.id || !name || typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  const distanceMeters = getDistanceMeters(origin, { latitude, longitude });
  const verification = getHalalVerificationCopy('unknown');
  const photo = place.photos?.find((item) => item.name);
  return {
    id: `google-${place.id}`,
    name,
    category: getGoogleCategory(place),
    address: place.formattedAddress?.trim() || 'Adresse non renseignée',
    latitude,
    longitude,
    distanceMeters,
    distanceLabel: formatHalalDistance(distanceMeters),
    verificationStatus: 'unknown',
    verificationLabel: verification.label,
    verificationDetail: 'Cette adresse ressort dans une recherche halal sur Google. OUMMAH n’a pas contrôlé de certificat : vérifie directement auprès de l’établissement.',
    source: 'google',
    googlePlaceId: place.id,
    googleMapsUri: place.googleMapsUri,
    photoName: photo?.name,
    photoAttribution: photo?.authorAttributions?.[0]?.displayName,
    lastCheckedAt: new Date().toISOString(),
  };
}

function buildQuery(origin: HalalCoordinates, radiusMeters: number) {
  const around = `(around:${Math.round(radiusMeters)},${origin.latitude},${origin.longitude})`;
  return `[out:json][timeout:12];(nwr${around}["diet:halal"="yes"];nwr${around}["halal"="yes"];nwr${around}["name"~"halal",i]["amenity"];nwr${around}["name"~"halal",i]["shop"];);out center tags;`;
}

async function fetchEndpoint(endpoint: string, query: string, externalSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abort = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  externalSignal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'User-Agent': OVERPASS_USER_AGENT },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HALAL_SEARCH_HTTP_${response.status}`);
    return (await response.json()) as OverpassResponse;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abort);
  }
}

function cacheKey(origin: HalalCoordinates, radiusMeters: number) {
  return `${CACHE_PREFIX}:${origin.latitude.toFixed(3)}:${origin.longitude.toFixed(3)}:${Math.round(radiusMeters / 1_000)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function getLocalSubmissions(origin?: HalalCoordinates) {
  const submissions = await readJson<HalalPlace[]>(SUBMISSIONS_KEY, []);
  if (!origin) return submissions;
  return submissions.map((place) => {
    const distanceMeters = getDistanceMeters(origin, place);
    return { ...place, distanceMeters, distanceLabel: formatHalalDistance(distanceMeters) };
  });
}

function mapApprovedSubmission(row: HalalSubmissionRow, origin: HalalCoordinates): HalalPlace {
  const distanceMeters = getDistanceMeters(origin, row);
  const verificationStatus: HalalVerificationStatus = row.contributor_type === 'owner' ? 'declared' : 'community';
  const copy = getHalalVerificationCopy(verificationStatus);
  return {
    id: `community-${row.id}`,
    name: row.name,
    category: row.category,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    distanceMeters,
    distanceLabel: formatHalalDistance(distanceMeters),
    verificationStatus,
    verificationLabel: copy.label,
    verificationDetail: row.note?.trim() || copy.detail,
    source: 'community',
    phone: row.phone?.trim() || undefined,
    website: row.website?.trim() || undefined,
    openingHours: row.opening_hours?.trim() || undefined,
    lastCheckedAt: row.reviewed_at ?? undefined,
  };
}

async function getApprovedCommunitySubmissions(origin: HalalCoordinates, radiusMeters: number) {
  const configuration = getSupabaseConfiguration();
  if (!configuration) return [];
  const latitudeDelta = radiusMeters / 111_320;
  const longitudeScale = Math.max(0.2, Math.cos(toRadians(origin.latitude)));
  const longitudeDelta = radiusMeters / (111_320 * longitudeScale);
  const params = new URLSearchParams({
    select: 'id,name,category,address,latitude,longitude,phone,website,opening_hours,note,contributor_type,validation_status,reviewed_at',
    validation_status: 'eq.approved',
    latitude: `gte.${origin.latitude - latitudeDelta}`,
    longitude: `gte.${origin.longitude - longitudeDelta}`,
    limit: String(MAX_RESULTS),
  });
  params.append('latitude', `lte.${origin.latitude + latitudeDelta}`);
  params.append('longitude', `lte.${origin.longitude + longitudeDelta}`);
  const response = await fetch(`${configuration.url}/rest/v1/halal_place_submissions?${params}`, {
    headers: supabaseHeaders(configuration.key),
  });
  if (!response.ok) throw new Error(`HALAL_SUBMISSIONS_HTTP_${response.status}`);
  const rows = (await response.json()) as HalalSubmissionRow[];
  return rows
    .map((row) => mapApprovedSubmission(row, origin))
    .filter((place) => place.distanceMeters <= radiusMeters);
}

function verificationRank(status: HalalVerificationStatus) {
  return status === 'verified_certificate' ? 3 : status === 'declared' ? 2 : status === 'community' ? 1 : 0;
}

function namesLikelyMatch(first: string, second: string) {
  const a = normalizeText(first);
  const b = normalizeText(second);
  if (!a || !b) return false;
  return a === b || (Math.min(a.length, b.length) >= 6 && (a.includes(b) || b.includes(a)));
}

function mergeDuplicate(primary: HalalPlace, secondary: HalalPlace): HalalPlace {
  const trusted = verificationRank(secondary.verificationStatus) > verificationRank(primary.verificationStatus)
    ? secondary
    : primary;
  return {
    ...primary,
    category: primary.category === 'other' ? secondary.category : primary.category,
    address: primary.address === 'Adresse non renseignée' ? secondary.address : primary.address,
    verificationStatus: trusted.verificationStatus,
    verificationLabel: trusted.verificationLabel,
    verificationDetail: trusted.verificationDetail,
    phone: primary.phone ?? secondary.phone,
    website: primary.website ?? secondary.website,
    openingHours: primary.openingHours ?? secondary.openingHours,
    openNow: primary.openNow ?? secondary.openNow,
    cuisine: primary.cuisine ?? secondary.cuisine,
    takeaway: primary.takeaway ?? secondary.takeaway,
    delivery: primary.delivery ?? secondary.delivery,
    wheelchair: primary.wheelchair ?? secondary.wheelchair,
    alcohol: primary.alcohol ?? secondary.alcohol,
    certificateBody: primary.certificateBody ?? secondary.certificateBody,
    certificateExpiresAt: primary.certificateExpiresAt ?? secondary.certificateExpiresAt,
    googlePlaceId: primary.googlePlaceId ?? secondary.googlePlaceId,
    googleMapsUri: primary.googleMapsUri ?? secondary.googleMapsUri,
    photoName: primary.photoName ?? secondary.photoName,
    photoAttribution: primary.photoAttribution ?? secondary.photoAttribution,
    communityPhotoUrl: primary.communityPhotoUrl ?? secondary.communityPhotoUrl,
    communityPhotoAttribution: primary.communityPhotoAttribution ?? secondary.communityPhotoAttribution,
  };
}

function deduplicate(places: HalalPlace[]) {
  const merged: HalalPlace[] = [];
  for (const place of places) {
    const duplicateIndex = merged.findIndex((candidate) =>
      getDistanceMeters(candidate, place) <= 120 && namesLikelyMatch(candidate.name, place.name),
    );
    if (duplicateIndex >= 0) merged[duplicateIndex] = mergeDuplicate(merged[duplicateIndex], place);
    else merged.push(place);
  }
  return merged;
}

function refreshDistances(places: HalalPlace[], origin: HalalCoordinates) {
  return places.map((place) => {
    const distanceMeters = getDistanceMeters(origin, place);
    return { ...place, distanceMeters, distanceLabel: formatHalalDistance(distanceMeters) };
  });
}

function rememberSessionPlaces(places: HalalPlace[]) {
  places.forEach((place) => sessionPlaces.set(place.id, place));
}

export async function searchNearbyHalalPlaces(
  origin: HalalCoordinates,
  radiusMeters: number,
  signal?: AbortSignal,
  onProgressResults?: (result: { places: HalalPlace[]; fromCache: boolean }) => void,
): Promise<{ places: HalalPlace[]; fromCache: boolean }> {
  const key = cacheKey(origin, radiusMeters);
  const cached = await readJson<{ savedAt: number; places: HalalPlace[] } | null>(key, null);
  const local = (await getLocalSubmissions(origin)).filter((place) => place.distanceMeters <= radiusMeters);
  const lastSearch = await readJson<{
    origin: HalalCoordinates;
    radiusMeters: number;
    savedAt: number;
    places: HalalPlace[];
  } | null>(LAST_SEARCH_KEY, null);
  const sameZone = Boolean(
    lastSearch
    && Number.isFinite(lastSearch.origin?.latitude)
    && Number.isFinite(lastSearch.origin?.longitude)
    && getDistanceMeters(origin, lastSearch.origin) <= SAME_ZONE_MAX_DISTANCE_METERS,
  );
  const previousPlaces = deduplicate([
    ...local,
    ...(sameZone && lastSearch?.places
      ? refreshDistances(lastSearch.places, origin).filter((place) => place.distanceMeters <= radiusMeters)
      : []),
    ...(cached?.places
      ? refreshDistances(cached.places, origin).filter((place) => place.distanceMeters <= radiusMeters)
      : []),
  ]).sort((a, b) => a.distanceMeters - b.distanceMeters);
  if (previousPlaces.length > 0) {
    rememberSessionPlaces(previousPlaces);
    onProgressResults?.({ places: previousPlaces, fromCache: true });
  }
  const freshOsmCache = Boolean(cached && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS);
  let lastError: unknown;
  let osmSucceeded = freshOsmCache;
  let osmPlaces = freshOsmCache && cached
    ? refreshDistances(cached.places, origin).filter((place) => place.distanceMeters <= radiusMeters)
    : [];
  let latestGooglePlaces: HalalPlace[] = [];
  let latestCommunityPlaces: HalalPlace[] = [];
  const publishNetworkProgress = () => {
    const places = deduplicate([...previousPlaces, ...local, ...latestCommunityPlaces, ...osmPlaces, ...latestGooglePlaces])
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, MAX_RESULTS);
    if (places.length === 0 || signal?.aborted) return;
    rememberSessionPlaces(places);
    onProgressResults?.({ places, fromCache: false });
  };
  const googlePromise = getNearbyHalalPlacesFromGoogle(
    origin.latitude,
    origin.longitude,
    radiusMeters,
    signal,
  )
    .then((googleResults) => {
      const fresh = googleResults
        .map((place) => mapGooglePlace(place, origin))
        .filter((place): place is HalalPlace => Boolean(place));
      fresh.forEach((place) => sessionGooglePlaces.set(place.id, place));
      // Google ne renvoie pas toujours la même sélection : on garde aussi, pour la durée de la session
      // (en mémoire seulement), les lieux Google déjà trouvés autour de ce point.
      const seenNearby = refreshDistances([...sessionGooglePlaces.values()], origin);
      latestGooglePlaces = deduplicate([...fresh, ...seenNearby])
        .filter((place) => place.distanceMeters <= radiusMeters);
      publishNetworkProgress();
      return latestGooglePlaces;
    })
    .catch((error: unknown) => {
      lastError = error;
      return [];
    });
  const communityPromise = getApprovedCommunitySubmissions(origin, radiusMeters)
    .then((communityResults) => {
      latestCommunityPlaces = communityResults;
      publishNetworkProgress();
      return communityResults;
    })
    .catch(() => []);
  if (!freshOsmCache) {
    const query = buildQuery(origin, radiusMeters);
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const payload = await fetchEndpoint(endpoint, query, signal);
        osmSucceeded = true;
        osmPlaces = (payload.elements ?? [])
          .map((element) => mapElement(element, origin))
          .filter((place): place is HalalPlace => Boolean(place))
          .filter((place) => place.distanceMeters <= radiusMeters)
          .slice(0, MAX_RESULTS);
        publishNetworkProgress();
        break;
      } catch (error) {
        lastError = error;
        if (signal?.aborted) throw error;
      }
    }
  }

  const googlePlaces = await googlePromise;
  const communityPlaces = await communityPromise;
  // OpenStreetMap n'a pas répondu : on garde les lieux OpenStreetMap déjà connus pour cette zone
  // (dernière recherche, cache) au lieu de les faire disparaître de la liste.
  if (!osmSucceeded) {
    osmPlaces = previousPlaces.filter((place) => place.source === 'openstreetmap');
  }
  const remote = deduplicate([...communityPlaces, ...osmPlaces, ...googlePlaces])
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, MAX_RESULTS);
  if (osmSucceeded || googlePlaces.length > 0 || communityPlaces.length > 0) {
    const places = await enrichApprovedCommunityPhotos(
      deduplicate([...local, ...remote]).sort((a, b) => a.distanceMeters - b.distanceMeters),
    );
    rememberSessionPlaces(places);
    const persistentPlaces = deduplicate([...local, ...osmPlaces]).sort((a, b) => a.distanceMeters - b.distanceMeters);
    // Une recherche où OpenStreetMap n'a pas répondu n'écrase pas la mémoire de la dernière recherche complète.
    const writes = osmSucceeded ? [
      AsyncStorage.setItem(LAST_RESULTS_KEY, JSON.stringify(persistentPlaces)).catch(() => undefined),
      AsyncStorage.setItem(LAST_SEARCH_KEY, JSON.stringify({
        origin,
        radiusMeters,
        savedAt: Date.now(),
        places: persistentPlaces,
      })).catch(() => undefined),
    ] : [];
    if (!freshOsmCache && osmSucceeded) {
      writes.push(AsyncStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), places: osmPlaces })).catch(() => undefined));
    }
    await Promise.all(writes);
    return { places, fromCache: freshOsmCache && googlePlaces.length === 0 };
  }

  if (cached?.places) {
    const cachedPlaces = refreshDistances(cached.places, origin).filter((place) => place.distanceMeters <= radiusMeters);
    const places = await enrichApprovedCommunityPhotos(
      deduplicate([...local, ...cachedPlaces]).sort((a, b) => a.distanceMeters - b.distanceMeters),
    );
    rememberSessionPlaces(places);
    return { places, fromCache: true };
  }
  if (local.length > 0) {
    const places = await enrichApprovedCommunityPhotos(local);
    rememberSessionPlaces(places);
    return { places, fromCache: true };
  }
  throw lastError instanceof Error ? lastError : new Error('HALAL_SEARCH_UNAVAILABLE');
}

function getHalalPlacePhotoKey(place: HalalPlace) {
  if (place.googlePlaceId) return `google:${place.googlePlaceId}`;
  return place.id;
}

function publicHalalPhotoUrl(configuration: { url: string }, storagePath: string) {
  return `${configuration.url}/storage/v1/object/public/${HALAL_PHOTO_BUCKET}/${storagePath.split('/').map(encodeURIComponent).join('/')}`;
}

async function enrichApprovedCommunityPhotos(places: HalalPlace[]) {
  const configuration = getSupabaseConfiguration();
  if (!configuration) return places;
  const candidates = places.filter((place) => !place.photoName && !place.communityPhotoUrl);
  if (candidates.length === 0) return places;

  const keys = [...new Set(candidates.map(getHalalPlacePhotoKey))];
  const quotedKeys = keys.map((key) => `"${key.replace(/"/g, '\"')}"`).join(',');
  const params = new URLSearchParams({
    select: 'id,place_key,storage_path,validation_status,reviewed_at,created_at',
    place_key: `in.(${quotedKeys})`,
    validation_status: 'eq.approved',
    order: 'reviewed_at.desc.nullslast,created_at.desc',
    limit: String(Math.min(500, Math.max(50, keys.length * 3))),
  });
  try {
    const response = await fetch(`${configuration.url}/rest/v1/halal_place_photo_submissions?${params}`, {
      headers: supabaseHeaders(configuration.key),
    });
    if (!response.ok) return places;
    const rows = (await response.json()) as Array<HalalPlacePhotoRow & { created_at?: string }>;
    const firstByKey = new Map<string, HalalPlacePhotoRow>();
    for (const row of rows) {
      if (!firstByKey.has(row.place_key)) firstByKey.set(row.place_key, row);
    }
    return places.map((place) => {
      if (place.photoName || place.communityPhotoUrl) return place;
      const row = firstByKey.get(getHalalPlacePhotoKey(place));
      if (!row?.storage_path) return place;
      return {
        ...place,
        communityPhotoUrl: publicHalalPhotoUrl(configuration, row.storage_path),
        communityPhotoAttribution: 'Photo ajoutée par la communauté · validée par OUMMAH',
      };
    });
  } catch {
    return places;
  }
}

async function enrichApprovedCommunityPhoto(place: HalalPlace) {
  if (place.photoName || place.communityPhotoUrl) return place;
  const configuration = getSupabaseConfiguration();
  if (!configuration) return place;
  const placeKey = getHalalPlacePhotoKey(place);
  const params = new URLSearchParams({
    select: 'id,place_key,storage_path,validation_status,reviewed_at',
    place_key: `eq.${placeKey}`,
    validation_status: 'eq.approved',
    order: 'reviewed_at.desc.nullslast,created_at.desc',
    limit: '1',
  });
  try {
    const response = await fetch(`${configuration.url}/rest/v1/halal_place_photo_submissions?${params}`, {
      headers: supabaseHeaders(configuration.key),
    });
    if (!response.ok) return place;
    const rows = (await response.json()) as HalalPlacePhotoRow[];
    const row = rows[0];
    if (!row?.storage_path) return place;
    return {
      ...place,
      communityPhotoUrl: publicHalalPhotoUrl(configuration, row.storage_path),
      communityPhotoAttribution: 'Photo ajoutée par la communauté · validée par OUMMAH',
    };
  } catch {
    return place;
  }
}

export async function hasPendingHalalPhotoSubmission(place: HalalPlace) {
  const pending = await readJson<string[]>(PENDING_PHOTO_KEYS, []);
  return pending.includes(getHalalPlacePhotoKey(place));
}

export async function submitHalalPlacePhoto(
  place: HalalPlace,
  input: HalalPlacePhotoSubmissionInput,
) {
  if (place.photoName || place.communityPhotoUrl) throw new Error('HALAL_PLACE_ALREADY_HAS_PHOTO');
  const configuration = getSupabaseConfiguration();
  if (!configuration) throw new Error('SUPABASE_NOT_CONFIGURED');

  const fileResponse = await fetch(input.uri);
  if (!fileResponse.ok) throw new Error('HALAL_PHOTO_READ_FAILED');
  const bytes = await fileResponse.arrayBuffer();
  if (bytes.byteLength <= 0 || bytes.byteLength > 5 * 1024 * 1024) {
    throw new Error('HALAL_PHOTO_SIZE_INVALID');
  }

  const mimeType = input.mimeType?.toLowerCase() || 'image/jpeg';
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(mimeType)) {
    throw new Error('HALAL_PHOTO_TYPE_INVALID');
  }
  const extensionFromName = input.fileName?.split('.').pop()?.toLowerCase();
  const extension = extensionFromName && /^[a-z0-9]{2,5}$/.test(extensionFromName)
    ? extensionFromName
    : mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/heic' ? 'heic' : mimeType === 'image/heif' ? 'heif' : 'jpg';
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const storagePath = `pending/${token}.${extension}`;
  const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');

  const uploadResponse = await fetch(`${configuration.url}/storage/v1/object/${HALAL_PHOTO_BUCKET}/${encodedPath}`, {
    method: 'POST',
    headers: {
      apikey: configuration.key,
      Authorization: `Bearer ${configuration.key}`,
      'Content-Type': mimeType,
      'x-upsert': 'false',
    },
    body: bytes,
  });
  if (!uploadResponse.ok) throw new Error(`HALAL_PHOTO_UPLOAD_HTTP_${uploadResponse.status}`);

  const placeKey = getHalalPlacePhotoKey(place);
  const submissionResponse = await fetch(`${configuration.url}/rest/v1/halal_place_photo_submissions`, {
    method: 'POST',
    headers: supabaseHeaders(configuration.key, true),
    body: JSON.stringify({
      place_key: placeKey,
      place_name: place.name,
      place_address: place.address,
      storage_path: storagePath,
      mime_type: mimeType,
      validation_status: 'pending',
    }),
  });
  if (!submissionResponse.ok) throw new Error(`HALAL_PHOTO_SUBMISSION_HTTP_${submissionResponse.status}`);

  const pending = await readJson<string[]>(PENDING_PHOTO_KEYS, []);
  if (!pending.includes(placeKey)) {
    await AsyncStorage.setItem(PENDING_PHOTO_KEYS, JSON.stringify([placeKey, ...pending]));
  }
  return { submittedForReview: true };
}

export async function getHalalPlaceById(id: string) {
  const sessionPlace = sessionPlaces.get(id);
  if (sessionPlace) {
    const enriched = await enrichApprovedCommunityPhoto(sessionPlace);
    sessionPlaces.set(enriched.id, enriched);
    return enriched;
  }
  const [last, local] = await Promise.all([
    readJson<HalalPlace[]>(LAST_RESULTS_KEY, []),
    getLocalSubmissions(),
  ]);
  const place = [...local, ...last].find((item) => item.id === id) ?? null;
  if (!place) return null;
  const enriched = await enrichApprovedCommunityPhoto(place);
  sessionPlaces.set(enriched.id, enriched);
  return enriched;
}

export async function enrichHalalPlaceFromGoogle(place: HalalPlace) {
  if (!place.googlePlaceId) return place;
  const details = await getGoogleHalalPlaceDetails(place.googlePlaceId);
  if (!details) return place;
  const weekdayDescriptions = details.regularOpeningHours?.weekdayDescriptions
    ?? details.currentOpeningHours?.weekdayDescriptions;
  const photo = details.photos?.find((item) => item.name);
  const enriched: HalalPlace = {
    ...place,
    address: details.formattedAddress?.trim() || place.address,
    phone: details.nationalPhoneNumber?.trim() || place.phone,
    website: details.websiteUri?.trim() || place.website,
    googleMapsUri: details.googleMapsUri?.trim() || place.googleMapsUri,
    googleDetailsLoaded: true,
    openingHours: weekdayDescriptions?.length ? weekdayDescriptions.join('\n') : place.openingHours,
    openNow: details.currentOpeningHours?.openNow ?? place.openNow,
    photoName: photo?.name ?? place.photoName,
    photoAttribution: photo?.authorAttributions?.[0]?.displayName ?? place.photoAttribution,
    lastCheckedAt: new Date().toISOString(),
  };
  const withCommunityPhoto = await enrichApprovedCommunityPhoto(enriched);
  sessionPlaces.set(withCommunityPhoto.id, withCommunityPhoto);
  return withCommunityPhoto;
}

const RESOLVED_ADDRESSES_KEY = 'oummah.halal.resolved-addresses.v1';
const MAX_RESOLVED_ADDRESSES = 1_000;

/** Adresses retrouvées par le téléphone (lieux sans adresse dans OpenStreetMap), par identifiant de lieu. */
export async function getResolvedHalalAddresses() {
  return readJson<Record<string, string>>(RESOLVED_ADDRESSES_KEY, {});
}

export function rememberResolvedHalalAddress(place: HalalPlace, address: string) {
  const updated = { ...place, address };
  sessionPlaces.set(updated.id, updated);
  void getResolvedHalalAddresses().then((stored) => {
    const entries = Object.entries({ ...stored, [place.id]: address }).slice(-MAX_RESOLVED_ADDRESSES);
    return AsyncStorage.setItem(RESOLVED_ADDRESSES_KEY, JSON.stringify(Object.fromEntries(entries)));
  }).catch(() => undefined);
  return updated;
}

export async function getHalalFavoriteIds() {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export async function toggleHalalFavorite(id: string) {
  const current = await getHalalFavoriteIds();
  const favorite = !current.includes(id);
  const next = favorite ? [id, ...current] : current.filter((item) => item !== id);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return favorite;
}

export async function createHalalPlaceSubmission(input: HalalPlaceSubmissionInput) {
  const now = new Date().toISOString();
  const copy = getHalalVerificationCopy(input.verificationStatus);
  const place: HalalPlace = {
    id: `community-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    category: input.category,
    address: input.address.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    distanceMeters: 0,
    distanceLabel: 'Ajout personnel',
    verificationStatus: input.verificationStatus,
    verificationLabel: copy.label,
    verificationDetail: input.note?.trim() || copy.detail,
    source: 'community',
    phone: input.phone?.trim() || undefined,
    website: input.website?.trim() || undefined,
    openingHours: input.openingHours?.trim() || undefined,
    lastCheckedAt: now,
  };
  const current = await getLocalSubmissions();
  await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify([place, ...current]));
  const configuration = getSupabaseConfiguration();
  let submittedForReview = false;
  if (configuration) {
    try {
      const response = await fetch(`${configuration.url}/rest/v1/halal_place_submissions`, {
        method: 'POST',
        headers: supabaseHeaders(configuration.key, true),
        body: JSON.stringify({
          name: place.name,
          category: place.category,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          phone: place.phone ?? null,
          website: place.website ?? null,
          opening_hours: place.openingHours ?? null,
          note: input.note?.trim() || null,
          contributor_type: input.verificationStatus === 'declared' ? 'owner' : 'community',
          validation_status: 'pending',
        }),
      });
      submittedForReview = response.ok;
    } catch {
      submittedForReview = false;
    }
  }
  return { place, submittedForReview };
}

export async function reportHalalPlace(placeId: string, reason: string, note?: string) {
  const current = await readJson<HalalPlaceReport[]>(REPORTS_KEY, []);
  const report: HalalPlaceReport = {
    id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    placeId,
    reason,
    note: note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify([report, ...current]));
  return report;
}

export function isHalalPlaceOpenNow(openingHours?: string) {
  if (!openingHours) return null;
  const value = openingHours.trim();
  if (value === '24/7') return true;
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = days[new Date().getDay()];
  const minutesNow = new Date().getHours() * 60 + new Date().getMinutes();
  let understood = false;
  const normalizeDay = (day: string) => `${day.slice(0, 1).toUpperCase()}${day.slice(1, 2).toLowerCase()}`;

  for (const rawRule of value.split(';')) {
    const rule = rawRule.trim();
    if (!rule) continue;
    const match = rule.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su))*)?\s*(off|closed|\d{1,2}:\d{2}-\d{1,2}:\d{2}(?:,\d{1,2}:\d{2}-\d{1,2}:\d{2})*)$/i);
    if (!match) continue;
    understood = true;
    const dayExpression = match[1];
    const appliesToday = !dayExpression || dayExpression.split(',').some((part) => {
      if (!part.includes('-')) return normalizeDay(part) === today;
      const [rawStart, rawEnd] = part.split('-');
      const start = normalizeDay(rawStart);
      const end = normalizeDay(rawEnd);
      const startIndex = days.indexOf(start);
      const endIndex = days.indexOf(end);
      const todayIndex = days.indexOf(today);
      return startIndex <= endIndex
        ? todayIndex >= startIndex && todayIndex <= endIndex
        : todayIndex >= startIndex || todayIndex <= endIndex;
    });
    if (!appliesToday) continue;
    if (/^(off|closed)$/i.test(match[2])) return false;
    const open = match[2].split(',').some((range) => {
      const [start, end] = range.split('-').map((time) => {
        const [hour, minute] = time.split(':').map(Number);
        return hour * 60 + minute;
      });
      return end >= start
        ? minutesNow >= start && minutesNow < end
        : minutesNow >= start || minutesNow < end;
    });
    if (open) return true;
  }
  return understood ? false : null;
}
