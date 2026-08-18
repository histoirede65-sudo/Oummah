export type MosqueFeatureState = 'yes' | 'no' | 'limited' | 'unknown';

export type NearbyMosque = {
  id: string;
  name: string;
  alternativeName?: string;
  arabicName?: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  distanceLabel: string;
  walkingTimeLabel: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  operator?: string;
  denomination?: string;
  wheelchair?: MosqueFeatureState;
  womenSpace?: MosqueFeatureState;
  ablutions?: MosqueFeatureState;
  parking?: MosqueFeatureState;
  toilets?: MosqueFeatureState;
  languages?: string[];
  serviceTimes?: string;
  source: 'openstreetmap' | 'islamic_app' | 'google';
  sourceUrl?: string;
  lastCheckedAt: string;
};

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string | undefined>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

type NominatimPlace = {
  osm_type?: 'node' | 'way' | 'relation';
  osm_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  namedetails?: Record<string, string | undefined>;
  extratags?: Record<string, string | undefined>;
};

type PhotonFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    osm_type?: 'N' | 'W' | 'R';
    osm_id?: number;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    postcode?: string;
    county?: string;
    state?: string;
    country?: string;
    extra?: Record<string, string | undefined>;
  };
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

type IslamicAppMosque = {
  slug?: string;
  name?: string;
  name_ar?: string;
  city?: string;
  country?: string;
  address?: string;
  lat?: number;
  lng?: number;
  url?: string;
};

type IslamicAppResponse = {
  data?: { mosques?: IslamicAppMosque[] };
};

const OVERPASS_ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
] as const;

const NOMINATIM_SEARCH_URL =
  'https://nominatim.openstreetmap.org/search';
const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/';
const ISLAMIC_APP_MASAJID_URL =
  'https://api.islamic.app/v1/masajid/near';

const SEARCH_RADIUS_METERS = 20_000;
const REQUEST_TIMEOUT_MS = 10_000;
const NOMINATIM_TIMEOUT_MS = 8_000;
const PHOTON_TIMEOUT_MS = 8_000;
const ISLAMIC_APP_TIMEOUT_MS = 8_000;
const MAX_RESULTS = 200;
const DUPLICATE_DISTANCE_METERS = 20;
const PROBABLE_DUPLICATE_DISTANCE_METERS = 80;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(
  originLatitude: number,
  originLongitude: number,
  targetLatitude: number,
  targetLongitude: number,
) {
  const earthRadius = 6_371_000;
  const latitudeDelta = toRadians(targetLatitude - originLatitude);
  const longitudeDelta = toRadians(targetLongitude - originLongitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(originLatitude)) *
      Math.cos(toRadians(targetLatitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) {
    return `${Math.max(1, Math.round(distanceMeters))} m`;
  }

  return `${(distanceMeters / 1_000).toFixed(
    distanceMeters < 10_000 ? 1 : 0,
  )} km`;
}

function formatWalkingTime(distanceMeters: number) {
  const minutes = Math.max(1, Math.round(distanceMeters / 80));

  if (minutes < 60) return `${minutes} min à pied`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours} h ${remainingMinutes} à pied`
    : `${hours} h à pied`;
}

function getCoordinates(element: OverpassElement) {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  return { latitude, longitude };
}

function buildAddress(tags: Record<string, string | undefined>) {
  const street = [tags['addr:housenumber'], tags['addr:street']]
    .filter(Boolean)
    .join(' ');

  const city =
    tags['addr:city'] ??
    tags['addr:town'] ??
    tags['addr:village'] ??
    tags['addr:suburb'];

  const postcode = tags['addr:postcode'];

  const result = [street, [postcode, city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');

  return result || 'Adresse non renseignée';
}

function normalizeText(value: string | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .trim();
}

function getSearchableText(tags: Record<string, string | undefined>) {
  return normalizeText(
    [
      tags.name,
      tags['name:fr'],
      tags['name:ar'],
      tags.alt_name,
      tags.official_name,
      tags.short_name,
      tags.operator,
      tags.description,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function hasMosqueTextSignal(tags: Record<string, string | undefined>) {
  const text = getSearchableText(tags);

  return (
    text.includes('mosqu') ||
    text.includes('mosque') ||
    text.includes('masjid') ||
    text.includes('mescid') ||
    text.includes('musalla') ||
    text.includes('mousalla') ||
    text.includes('salle de priere') ||
    text.includes('prayer room') ||
    text.includes('centre islam') ||
    text.includes('islamic cent') ||
    text.includes('association musulman') ||
    text.includes('مسجد') ||
    text.includes('مصلى')
  );
}

function isCandidateMosque(tags: Record<string, string | undefined>) {
  if (
    tags.religion === 'muslim' ||
    tags.building === 'mosque' ||
    tags.place_of_worship === 'mosque'
  ) {
    return true;
  }

  return hasMosqueTextSignal(tags);
}

function normalizeFeature(value: string | undefined): MosqueFeatureState {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) return 'unknown';

  if (
    ['yes', 'designated', 'permissive', 'customers', 'private'].includes(
      normalized,
    )
  ) {
    return 'yes';
  }

  if (['limited', 'partial', 'restricted', 'separate'].includes(normalized)) {
    return 'limited';
  }

  if (['no', 'none'].includes(normalized)) return 'no';

  return 'unknown';
}

function mergeFeatureStates(
  ...states: MosqueFeatureState[]
): MosqueFeatureState {
  if (states.includes('yes')) return 'yes';
  if (states.includes('limited')) return 'limited';
  if (states.includes('no')) return 'no';
  return 'unknown';
}

function parseLanguages(tags: Record<string, string | undefined>) {
  const raw = [
    tags.language,
    tags.languages,
    tags['service:language'],
    tags['sermon:language'],
    tags['khutbah:language'],
  ]
    .filter(Boolean)
    .join(';');

  if (!raw) return undefined;

  const languages = raw
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return languages.length > 0 ? [...new Set(languages)] : undefined;
}

function buildSourceUrl(element: OverpassElement) {
  return `https://www.openstreetmap.org/${element.type}/${element.id}`;
}

function buildOverpassQuery(latitude: number, longitude: number) {
  return `
    [out:json][timeout:8];
    (
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
          ["amenity"="place_of_worship"]["religion"="muslim"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
          ["amenity"="prayer_room"]["religion"="muslim"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
          ["amenity"="place_of_worship"]
          ["name"~"mosq|masjid|musalla|mousalla|prayer",i];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
          ["amenity"="prayer_room"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
          ["amenity"="community_centre"]
          ["name"~"mosq|masjid|islam|muslim|musulman",i];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
          ["building"="mosque"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
          ["place_of_worship"="mosque"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
          ["religion"="muslim"];
      nwr(around:${SEARCH_RADIUS_METERS},${latitude},${longitude})
          ["name"~"mosq|masjid|musalla|mousalla|salle de priere|prayer room",i];
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

  externalSignal.addEventListener(
    'abort',
    () => timeoutController.abort(),
    { once: true },
  );

  return timeoutController.signal;
}

async function fetchFromEndpoint(
  endpoint: string,
  query: string,
  signal?: AbortSignal,
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
        'Content-Type':
          'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'OUMMAH/1.0',
      },
      body: new URLSearchParams({ data: query }).toString(),
      signal: combineSignals(signal, timeoutController),
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
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const endpointControllers = OVERPASS_ENDPOINTS.map(() => new AbortController());
  const attempts = OVERPASS_ENDPOINTS.map((endpoint, index) =>
    fetchFromEndpoint(
      endpoint,
      query,
      combineSignals(signal, endpointControllers[index]),
    ),
  );

  try {
    const results = await Promise.allSettled(attempts);
    const successfulResults = results
      .filter(
        (result): result is PromiseFulfilledResult<OverpassResponse> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);

    if (successfulResults.length > 0) {
      return {
        elements: successfulResults.flatMap((result) => result.elements ?? []),
      };
    }

    const errors = results
      .filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )
      .map((result) => result.reason);
    const lastError = errors[errors.length - 1];

    throw lastError instanceof Error
      ? lastError
      : new Error('OVERPASS_UNAVAILABLE');
  } catch (error) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    throw error instanceof Error ? error : new Error('OVERPASS_UNAVAILABLE');
  }
}

function getNominatimViewbox(latitude: number, longitude: number) {
  const latitudeDelta = SEARCH_RADIUS_METERS / 111_320;
  const longitudeDelta =
    SEARCH_RADIUS_METERS /
    (111_320 * Math.max(0.2, Math.cos(toRadians(latitude))));

  return [
    longitude - longitudeDelta,
    latitude + latitudeDelta,
    longitude + longitudeDelta,
    latitude - latitudeDelta,
  ].join(',');
}

async function requestNominatim(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    NOMINATIM_TIMEOUT_MS,
  );
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: '[mosque]',
    viewbox: getNominatimViewbox(latitude, longitude),
    bounded: '1',
    limit: '50',
    extratags: '1',
    namedetails: '1',
  });

  try {
    const response = await fetch(
      `${NOMINATIM_SEARCH_URL}?${params.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OUMMAH/1.0',
        },
        signal: combineSignals(signal, timeoutController),
      },
    );

    if (!response.ok) {
      throw new Error(`NOMINATIM_${response.status}`);
    }

    return (await response.json()) as NominatimPlace[];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getNearbyMosquesFromNominatim(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<NearbyMosque[]> {
  const places = await requestNominatim(latitude, longitude, signal);
  const checkedAt = new Date().toISOString();

  return places
    .map((place): NearbyMosque | null => {
      const placeLatitude = Number(place.lat);
      const placeLongitude = Number(place.lon);

      if (
        !Number.isFinite(placeLatitude) ||
        !Number.isFinite(placeLongitude) ||
        !place.osm_type ||
        typeof place.osm_id !== 'number'
      ) {
        return null;
      }

      const distanceMeters = getDistanceMeters(
        latitude,
        longitude,
        placeLatitude,
        placeLongitude,
      );

      if (distanceMeters > SEARCH_RADIUS_METERS) return null;

      const tags = place.extratags ?? {};
      const names = place.namedetails ?? {};

      return {
        id: `${place.osm_type}-${place.osm_id}`,
        name:
          names['name:fr'] ??
          place.name ??
          names.name ??
          place.display_name?.split(',')[0] ??
          'Mosquée sans nom renseigné',
        alternativeName: names.alt_name ?? names.official_name,
        arabicName: names['name:ar'],
        address: place.display_name ?? 'Adresse non renseignée',
        latitude: placeLatitude,
        longitude: placeLongitude,
        distanceMeters,
        distanceLabel: formatDistance(distanceMeters),
        walkingTimeLabel: formatWalkingTime(distanceMeters),
        phone: tags.phone ?? tags['contact:phone'],
        email: tags.email ?? tags['contact:email'],
        website:
          tags.website ?? tags['contact:website'] ?? tags.url,
        openingHours: tags.opening_hours,
        operator: tags.operator,
        denomination: tags.denomination,
        wheelchair: normalizeFeature(tags.wheelchair),
        womenSpace: normalizeFeature(tags.female),
        ablutions: normalizeFeature(tags.ablution ?? tags.wudu),
        parking: normalizeFeature(tags.parking),
        toilets: normalizeFeature(tags.toilets),
        languages: parseLanguages(tags),
        serviceTimes: tags.service_times ?? tags['service:times'],
        source: 'openstreetmap',
        sourceUrl: `https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}`,
        lastCheckedAt: checkedAt,
      };
    })
    .filter((mosque): mosque is NearbyMosque => mosque !== null)
    .sort(
      (first, second) =>
        first.distanceMeters - second.distanceMeters,
    )
    .slice(0, MAX_RESULTS);
}

function getPhotonBbox(latitude: number, longitude: number) {
  const latitudeDelta = SEARCH_RADIUS_METERS / 111_320;
  const longitudeDelta =
    SEARCH_RADIUS_METERS /
    (111_320 * Math.max(0.2, Math.cos(toRadians(latitude))));

  return [
    longitude - longitudeDelta,
    latitude - latitudeDelta,
    longitude + longitudeDelta,
    latitude + latitudeDelta,
  ].join(',');
}

function getPhotonOsmType(type: 'N' | 'W' | 'R' | undefined) {
  if (type === 'N') return 'node' as const;
  if (type === 'W') return 'way' as const;
  if (type === 'R') return 'relation' as const;
  return null;
}

async function getNearbyMosquesFromPhoton(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<NearbyMosque[]> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    PHOTON_TIMEOUT_MS,
  );
  const params = new URLSearchParams({
    q: 'mosquée',
    lat: String(latitude),
    lon: String(longitude),
    bbox: getPhotonBbox(latitude, longitude),
    limit: '50',
    lang: 'fr',
  });

  try {
    const response = await fetch(
      `${PHOTON_SEARCH_URL}?${params.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OUMMAH/1.0',
        },
        signal: combineSignals(signal, timeoutController),
      },
    );

    if (!response.ok) {
      throw new Error(`PHOTON_${response.status}`);
    }

    const payload = (await response.json()) as PhotonResponse;
    const checkedAt = new Date().toISOString();

    return (payload.features ?? [])
      .map((feature): NearbyMosque | null => {
        const properties = feature.properties;
        const coordinates = feature.geometry?.coordinates;
        const osmType = getPhotonOsmType(properties?.osm_type);
        const longitudeValue = coordinates?.[0];
        const latitudeValue = coordinates?.[1];

        if (
          !properties ||
          !osmType ||
          typeof properties.osm_id !== 'number' ||
          !isFiniteNumber(latitudeValue) ||
          !isFiniteNumber(longitudeValue)
        ) {
          return null;
        }

        const distanceMeters = getDistanceMeters(
          latitude,
          longitude,
          latitudeValue,
          longitudeValue,
        );

        if (distanceMeters > SEARCH_RADIUS_METERS) return null;

        const extra = properties.extra ?? {};
        const address = [
          [properties.housenumber, properties.street]
            .filter(Boolean)
            .join(' '),
          [properties.postcode, properties.city ?? properties.district]
            .filter(Boolean)
            .join(' '),
          properties.country,
        ]
          .filter(Boolean)
          .join(', ');

        return {
          id: `${osmType}-${properties.osm_id}`,
          name: properties.name ?? 'Mosquée sans nom renseigné',
          address: address || 'Adresse non renseignée',
          latitude: latitudeValue,
          longitude: longitudeValue,
          distanceMeters,
          distanceLabel: formatDistance(distanceMeters),
          walkingTimeLabel: formatWalkingTime(distanceMeters),
          phone: extra.phone ?? extra['contact:phone'],
          email: extra.email ?? extra['contact:email'],
          website:
            extra.website ?? extra['contact:website'] ?? extra.url,
          openingHours: extra.opening_hours,
          operator: extra.operator,
          denomination: extra.denomination,
          wheelchair: normalizeFeature(extra.wheelchair),
          womenSpace: normalizeFeature(extra.female),
          ablutions: normalizeFeature(extra.ablution ?? extra.wudu),
          parking: normalizeFeature(extra.parking),
          toilets: normalizeFeature(extra.toilets),
          languages: parseLanguages(extra),
          serviceTimes:
            extra.service_times ?? extra['service:times'],
          source: 'openstreetmap',
          sourceUrl: `https://www.openstreetmap.org/${osmType}/${properties.osm_id}`,
          lastCheckedAt: checkedAt,
        };
      })
      .filter((mosque): mosque is NearbyMosque => mosque !== null)
      .sort(
        (first, second) =>
          first.distanceMeters - second.distanceMeters,
      )
      .slice(0, MAX_RESULTS);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getNearbyMosquesFromIslamicApp(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<NearbyMosque[]> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    ISLAMIC_APP_TIMEOUT_MS,
  );
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    radius: String(SEARCH_RADIUS_METERS / 1_000),
    limit: String(MAX_RESULTS),
  });

  try {
    const response = await fetch(
      `${ISLAMIC_APP_MASAJID_URL}?${params.toString()}`,
      {
        headers: { Accept: 'application/json' },
        signal: combineSignals(signal, timeoutController),
      },
    );

    if (!response.ok) throw new Error(`ISLAMIC_APP_${response.status}`);

    const payload = (await response.json()) as IslamicAppResponse;
    const checkedAt = new Date().toISOString();

    return (payload.data?.mosques ?? [])
      .map((mosque): NearbyMosque | null => {
        if (
          !mosque.slug ||
          !isFiniteNumber(mosque.lat) ||
          !isFiniteNumber(mosque.lng)
        ) {
          return null;
        }

        const distanceMeters = getDistanceMeters(
          latitude,
          longitude,
          mosque.lat,
          mosque.lng,
        );

        if (distanceMeters > SEARCH_RADIUS_METERS) return null;

        return {
          id: `islamic-app-${mosque.slug}`,
          name: mosque.name ?? 'Mosquée sans nom renseigné',
          arabicName: mosque.name_ar,
          address:
            mosque.address ??
            ([mosque.city, mosque.country].filter(Boolean).join(', ') ||
              'Adresse non renseignée'),
          latitude: mosque.lat,
          longitude: mosque.lng,
          distanceMeters,
          distanceLabel: formatDistance(distanceMeters),
          walkingTimeLabel: formatWalkingTime(distanceMeters),
          source: 'islamic_app',
          sourceUrl:
            mosque.url ??
            `https://islamic.app/m/${encodeURIComponent(mosque.slug)}`,
          lastCheckedAt: checkedAt,
        };
      })
      .filter((mosque): mosque is NearbyMosque => mosque !== null)
      .sort((first, second) => first.distanceMeters - second.distanceMeters)
      .slice(0, MAX_RESULTS);
  } finally {
    clearTimeout(timeoutId);
  }
}

function mergeOptional<T>(first: T | undefined, second: T | undefined) {
  return first ?? second;
}

function mergeMosques(
  current: NearbyMosque,
  incoming: NearbyMosque,
): NearbyMosque {
  const currentHasAddress = current.address !== 'Adresse non renseignée';
  const incomingHasAddress = incoming.address !== 'Adresse non renseignée';

  return {
    ...current,
    alternativeName: mergeOptional(
      current.alternativeName,
      incoming.alternativeName,
    ),
    arabicName: mergeOptional(current.arabicName, incoming.arabicName),
    address:
      !currentHasAddress && incomingHasAddress
        ? incoming.address
        : current.address,
    phone: mergeOptional(current.phone, incoming.phone),
    email: mergeOptional(current.email, incoming.email),
    website: mergeOptional(current.website, incoming.website),
    openingHours: mergeOptional(
      current.openingHours,
      incoming.openingHours,
    ),
    operator: mergeOptional(current.operator, incoming.operator),
    denomination: mergeOptional(
      current.denomination,
      incoming.denomination,
    ),
    wheelchair: mergeFeatureStates(
      current.wheelchair ?? 'unknown',
      incoming.wheelchair ?? 'unknown',
    ),
    womenSpace: mergeFeatureStates(
      current.womenSpace ?? 'unknown',
      incoming.womenSpace ?? 'unknown',
    ),
    ablutions: mergeFeatureStates(
      current.ablutions ?? 'unknown',
      incoming.ablutions ?? 'unknown',
    ),
    parking: mergeFeatureStates(
      current.parking ?? 'unknown',
      incoming.parking ?? 'unknown',
    ),
    toilets: mergeFeatureStates(
      current.toilets ?? 'unknown',
      incoming.toilets ?? 'unknown',
    ),
    languages: [
      ...new Set([
        ...(current.languages ?? []),
        ...(incoming.languages ?? []),
      ]),
    ],
    serviceTimes: mergeOptional(
      current.serviceTimes,
      incoming.serviceTimes,
    ),
  };
}

function findCertainDuplicateIndex(
  mosques: NearbyMosque[],
  candidate: NearbyMosque,
) {
  const candidateName = normalizeText(candidate.name);

  if (!candidateName || candidate.name === 'Mosquée sans nom renseigné') {
    return -1;
  }

  return mosques.findIndex((existing) => {
    const existingName = normalizeText(existing.name);

    const distance = getDistanceMeters(
      existing.latitude,
      existing.longitude,
      candidate.latitude,
      candidate.longitude,
    );

    if (distance <= DUPLICATE_DISTANCE_METERS && existingName === candidateName) {
      return true;
    }

    if (distance > PROBABLE_DUPLICATE_DISTANCE_METERS) return false;

    const nameMatch = namesLikelyMatch(existingName, candidateName);
    const addressMatch = addressesLikelyMatch(existing.address, candidate.address);

    // Google and OSM frequently use slightly different names for the same
    // building. Require either a strong name match or a matching address.
    return nameMatch || addressMatch;
  });
}

function textTokens(value: string) {
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter((token) => token.length >= 3 && !/^\d+$/.test(token)),
  );
}

function namesLikelyMatch(first: string, second: string) {
  if (!first || !second) return false;
  if (first === second || first.includes(second) || second.includes(first)) return true;
  const left = textTokens(first);
  const right = textTokens(second);
  const overlap = [...left].filter((token) => right.has(token)).length;
  return overlap >= 2 || (overlap === 1 && left.size === 1 && right.size === 1);
}

function addressesLikelyMatch(first: string, second: string) {
  const normalizedFirst = normalizeText(first);
  const normalizedSecond = normalizeText(second);
  if (
    normalizedFirst.length > 0 &&
    normalizedFirst === normalizedSecond
  ) {
    return true;
  }

  const left = textTokens(first);
  const right = textTokens(second);
  const overlap = [...left].filter((token) => right.has(token));
  const firstNumber = normalizedFirst.match(/\b\d+[a-z]?\b/)?.[0];
  const secondNumber = normalizedSecond.match(/\b\d+[a-z]?\b/)?.[0];

  return Boolean(
    firstNumber &&
      secondNumber &&
      firstNumber === secondNumber &&
      overlap.length >= 2,
  );
}

function mergeMosqueLists(
  primary: NearbyMosque[],
  secondary: NearbyMosque[],
) {
  const merged = [...primary];

  for (const candidate of secondary) {
    const duplicateIndex = merged.findIndex(
      (mosque) => mosque.id === candidate.id,
    );
    const nearbyDuplicateIndex =
      duplicateIndex >= 0
        ? duplicateIndex
        : findCertainDuplicateIndex(merged, candidate);

    if (nearbyDuplicateIndex >= 0) {
      merged[nearbyDuplicateIndex] = mergeMosques(
        merged[nearbyDuplicateIndex],
        candidate,
      );
    } else {
      merged.push(candidate);
    }
  }

  return merged
    .sort(
      (first, second) =>
        first.distanceMeters - second.distanceMeters,
    )
    .slice(0, MAX_RESULTS);
}

export async function getNearbyMosques(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<NearbyMosque[]> {
  const { getNearbyMosquesFromGoogle } = await import('./googleNearbyMosques');
  const nominatimPromise = getNearbyMosquesFromNominatim(
    latitude,
    longitude,
    signal,
  )
    .then((mosques) => ({ mosques, error: null as unknown }))
    .catch((error: unknown) => ({
      mosques: [] as NearbyMosque[],
      error,
    }));
  const photonPromise = getNearbyMosquesFromPhoton(
    latitude,
    longitude,
    signal,
  )
    .then((mosques) => ({ mosques, error: null as unknown }))
    .catch((error: unknown) => ({
      mosques: [] as NearbyMosque[],
      error,
    }));
  const islamicAppPromise = getNearbyMosquesFromIslamicApp(
    latitude,
    longitude,
    signal,
  )
    .then((mosques) => ({ mosques, error: null as unknown }))
    .catch((error: unknown) => ({
      mosques: [] as NearbyMosque[],
      error,
    }));
  const googlePromise = getNearbyMosquesFromGoogle(latitude, longitude, signal)
    .then((mosques) => ({ mosques, error: null as unknown }))
    .catch((error: unknown) => ({ mosques: [] as NearbyMosque[], error }));
  let payload: OverpassResponse;

  try {
    payload = await requestOverpass(
      buildOverpassQuery(latitude, longitude),
      signal,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'AbortError' &&
      signal?.aborted
    ) {
      throw error;
    }

    const [nominatim, photon, islamicApp, google] = await Promise.all([
      nominatimPromise,
      photonPromise,
      islamicAppPromise,
      googlePromise,
    ]);

    if (nominatim.error && photon.error && islamicApp.error && google.error) throw error;

    return mergeMosqueLists(
      mergeMosqueLists(nominatim.mosques, photon.mosques),
      mergeMosqueLists(islamicApp.mosques, google.mosques),
    );
  }

  const mosques: NearbyMosque[] = [];
  const checkedAt = new Date().toISOString();

  for (const element of payload.elements ?? []) {
    const coordinates = getCoordinates(element);
    if (!coordinates) continue;

    const tags = element.tags ?? {};
    if (!isCandidateMosque(tags)) continue;

    const distanceMeters = getDistanceMeters(
      latitude,
      longitude,
      coordinates.latitude,
      coordinates.longitude,
    );

    const womenSpace = mergeFeatureStates(
      normalizeFeature(tags.female),
      normalizeFeature(tags.women),
      normalizeFeature(tags['prayer_room:female']),
      normalizeFeature(tags.female_prayer_space),
    );

    const ablutions = mergeFeatureStates(
      normalizeFeature(tags.ablution),
      normalizeFeature(tags.ablutions),
      normalizeFeature(tags.wudu),
      normalizeFeature(tags.washing_facilities),
    );

    const parking = mergeFeatureStates(
      normalizeFeature(tags.parking),
      normalizeFeature(tags['parking:condition']),
      normalizeFeature(tags['parking:access']),
    );

    const toilets = mergeFeatureStates(
      normalizeFeature(tags.toilets),
      normalizeFeature(tags['toilets:access']),
    );

    const mosque: NearbyMosque = {
      id: `${element.type}-${element.id}`,
      name:
        tags['name:fr'] ??
        tags.name ??
        tags['name:ar'] ??
        tags.operator ??
        'Mosquée sans nom renseigné',
      alternativeName:
        tags.alt_name ??
        tags.short_name ??
        tags.official_name,
      arabicName: tags['name:ar'],
      address: buildAddress(tags),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      distanceMeters,
      distanceLabel: formatDistance(distanceMeters),
      walkingTimeLabel: formatWalkingTime(distanceMeters),
      phone:
        tags.phone ??
        tags['contact:phone'] ??
        tags['contact:mobile'],
      email: tags.email ?? tags['contact:email'],
      website:
        tags.website ??
        tags['contact:website'] ??
        tags.url,
      openingHours: tags.opening_hours,
      operator:
        tags.operator ??
        tags['operator:name'] ??
        tags.owner,
      denomination:
        tags.denomination ??
        tags['muslim:denomination'],
      wheelchair: normalizeFeature(tags.wheelchair),
      womenSpace,
      ablutions,
      parking,
      toilets,
      languages: parseLanguages(tags),
      serviceTimes:
        tags.service_times ??
        tags['service:times'] ??
        tags.prayer_times,
      source: 'openstreetmap',
      sourceUrl: buildSourceUrl(element),
      lastCheckedAt: checkedAt,
    };

    const duplicateIndex = findCertainDuplicateIndex(mosques, mosque);

    if (duplicateIndex >= 0) {
      mosques[duplicateIndex] = mergeMosques(
        mosques[duplicateIndex],
        mosque,
      );
    } else {
      mosques.push(mosque);
    }
  }

  const [nominatim, photon, islamicApp, google] = await Promise.all([
    nominatimPromise,
    photonPromise,
    islamicAppPromise,
    googlePromise,
  ]);

  return mergeMosqueLists(
    mergeMosqueLists(
      mergeMosqueLists(mosques, photon.mosques),
      nominatim.mosques,
    ),
    mergeMosqueLists(islamicApp.mosques, google.mosques),
  );
}
