// @ts-ignore -- Supabase Edge uses Deno imports with explicit TypeScript extensions.
import type { EdgeHandler } from './runtime.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
} as const;

export class RequestError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders,
      'Cache-Control': 'no-store',
    },
  });
}

export function handleGet(handler: EdgeHandler): EdgeHandler {
  return async (request) => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

    try {
      return await handler(request);
    } catch (error: unknown) {
      if (error instanceof RequestError) return json({ error: error.message }, error.status);
      console.error('Quran Edge Function failed', error instanceof Error ? error.message : 'Unknown error');
      return json({ error: 'Service temporarily unavailable' }, 503);
    }
  };
}

export function integerParameter(
  searchParams: URLSearchParams,
  name: string,
  minimum: number,
  maximum: number,
  options: { required?: boolean; fallback?: number } = {},
): number | undefined {
  const raw = searchParams.get(name);
  if (raw === null || raw === '') {
    if (options.required) throw new RequestError(`Missing query parameter: ${name}`);
    return options.fallback;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RequestError(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}

export function languageParameter(searchParams: URLSearchParams): string {
  const language = searchParams.get('language')?.trim() || 'fr';
  if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(language)) {
    throw new RequestError('Invalid language parameter');
  }
  return language;
}

export function idListParameter(searchParams: URLSearchParams, name: string): number[] | undefined {
  const value = searchParams.get(name)?.trim();
  if (!value) return undefined;
  if (!/^\d+(?:,\d+)*$/.test(value)) throw new RequestError(`Invalid ${name} parameter`);
  return value.split(',').map(Number);
}
