export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type MosqueRoute = {
  coordinates: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
  distanceLabel: string;
  durationLabel: string;
};

type OsrmRouteResponse = {
  code?: string;
  message?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      coordinates?: Array<[number, number]>;
      type?: string;
    };
  }>;
};

const OSRM_ENDPOINT = 'https://router.project-osrm.org';

function formatRouteDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) {
    return `${Math.max(1, Math.round(distanceMeters))} m`;
  }

  return `${(distanceMeters / 1_000).toFixed(
    distanceMeters < 10_000 ? 1 : 0,
  )} km`;
}

function formatRouteDuration(durationSeconds: number) {
  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours} h ${minutes}` : `${hours} h`;
}

export async function getWalkingRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
  signal?: AbortSignal,
): Promise<MosqueRoute> {
  const coordinates =
    `${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}`;

  const url =
    `${OSRM_ENDPOINT}/route/v1/driving/${coordinates}` +
    '?overview=full&geometries=geojson&steps=false';

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`ROUTE_${response.status}`);
  }

  const payload = (await response.json()) as OsrmRouteResponse;
  const route = payload.routes?.[0];
  const geometry = route?.geometry?.coordinates;

  if (
    payload.code !== 'Ok' ||
    !route ||
    typeof route.distance !== 'number' ||
    typeof route.duration !== 'number' ||
    !Array.isArray(geometry) ||
    geometry.length < 2
  ) {
    throw new Error(payload.message || 'ROUTE_NOT_FOUND');
  }

  return {
    coordinates: geometry.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    })),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    distanceLabel: formatRouteDistance(route.distance),
    durationLabel: formatRouteDuration(route.duration),
  };
}