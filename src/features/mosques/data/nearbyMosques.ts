export type NearbyMosque = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  distanceLabel: string;
  walkingTimeLabel: string;
  phone?: string;
  website?: string;
  openingHours?: string;
};

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string | undefined>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
] as const;

const SEARCH_RADIUS_METERS = 12_000;
const REQUEST_TIMEOUT_MS = 18_000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(
  originLatitude: number,
  originLongitude: number,
  targetLatitude: number,
  targetLongitude: number,
) {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = toRadians(targetLatitude - originLatitude);
  const longitudeDelta = toRadians(targetLongitude - originLongitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(originLatitude)) *
      Math.cos(toRadians(targetLatitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) {
    return `${Math.max(1, Math.round(distanceMeters))} m`;
  }

  return `${(distanceMeters / 1_000).toFixed(distanceMeters < 10_000 ? 1 : 0)} km`;
}

function formatWalkingTime(distanceMeters: number) {
  const walkingMinutes = Math.max(1, Math.round(distanceMeters / 80));

  if (walkingMinutes < 60) {
    return `${walkingMinutes} min à pied`;
  }

  const hours = Math.floor(walkingMinutes / 60);
  const minutes = walkingMinutes % 60;

  return minutes > 0
    ? `${hours} h ${minutes} à pied`
    : `${hours} h à pied`;
}

function buildAddress(tags: Record<string, string | undefined>) {
  const street = [tags['addr:housenumber'], tags['addr:street']]
    .filter(Boolean)
    .join(' ');
  const city = tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'];
  const postcode = tags['addr:postcode'];

  const address = [street, [postcode, city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');

  return address || 'Adresse non renseignée';
}

function getCoordinates(element: OverpassElement) {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  return { latitude, longitude };
}

function buildOverpassQuery(latitude: number, longitude: number) {
  return `
    [out:json][timeout:25];
    (
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
        ["amenity"="place_of_worship"]["religion"="muslim"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
        ["building"="mosque"];
    );
    out center tags;
  `;
}

function combineSignals(
  externalSignal: AbortSignal | undefined,
  timeoutController: AbortController,
) {
  if (!externalSignal) return timeoutController.signal;

  if (externalSignal.aborted) {
    timeoutController.abort();
    return timeoutController.signal;
  }

  const abort = () => timeoutController.abort();
  externalSignal.addEventListener('abort', abort, { once: true });

  return timeoutController.signal;
}

async function fetchFromEndpoint(
  endpoint: string,
  query: string,
  externalSignal?: AbortSignal,
) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({ data: query }).toString(),
      signal: combineSignals(externalSignal, timeoutController),
    });

    if (!response.ok) {
      throw new Error(`OVERPASS_${response.status}`);
    }

    return (await response.json()) as OverpassResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestOverpass(
  query: string,
  signal?: AbortSignal,
): Promise<OverpassResponse> {
  let lastError: unknown = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      return await fetchFromEndpoint(endpoint, query, signal);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'AbortError' &&
        signal?.aborted
      ) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('OVERPASS_UNAVAILABLE');
}

export async function getNearbyMosques(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<NearbyMosque[]> {
  const query = buildOverpassQuery(latitude, longitude);
  const payload = await requestOverpass(query, signal);
  const uniqueMosques = new Map<string, NearbyMosque>();

  for (const element of payload.elements ?? []) {
    const coordinates = getCoordinates(element);
    if (!coordinates) continue;

    const tags = element.tags ?? {};
    const distanceMeters = getDistanceMeters(
      latitude,
      longitude,
      coordinates.latitude,
      coordinates.longitude,
    );

    const mosque: NearbyMosque = {
      id: `${element.type}-${element.id}`,
      name:
        tags['name:fr'] ??
        tags.name ??
        tags['name:ar'] ??
        'Mosquée sans nom renseigné',
      address: buildAddress(tags),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      distanceMeters,
      distanceLabel: formatDistance(distanceMeters),
      walkingTimeLabel: formatWalkingTime(distanceMeters),
      phone: tags.phone ?? tags['contact:phone'],
      website: tags.website ?? tags['contact:website'],
      openingHours: tags.opening_hours,
    };

    const duplicateKey =
      `${mosque.name.toLocaleLowerCase('fr')}-` +
      `${coordinates.latitude.toFixed(5)}-` +
      `${coordinates.longitude.toFixed(5)}`;

    uniqueMosques.set(duplicateKey, mosque);
  }

  return [...uniqueMosques.values()]
    .sort((first, second) => first.distanceMeters - second.distanceMeters)
    .slice(0, 30);
}