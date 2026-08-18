import { networkRepository, type NetworkRepository } from '../network';
import { storageService, type StorageServiceContract } from '../storage';

export type CacheResourceKind = 'surahs' | 'verses' | 'audio' | 'metadata' | 'reciters' | 'prayers' | 'dalil' | 'user';

export interface CachePolicy {
  ttlMs: number;
  revalidateAfterMs: number;
}

export interface CacheRequest<T> {
  kind: CacheResourceKind;
  key: string;
  loader: () => Promise<T>;
  policy?: Partial<CachePolicy>;
  forceRefresh?: boolean;
}

export interface CacheErrorEvent {
  kind: CacheResourceKind;
  key: string;
  operation: 'read' | 'write' | 'remove' | 'fetch' | 'parse';
  error: unknown;
  background: boolean;
}

export interface CacheRepositoryContract {
  getOrFetch<T>(request: CacheRequest<T>): Promise<T>;
  refresh<T>(request: Omit<CacheRequest<T>, 'forceRefresh'>): Promise<T>;
  invalidate(kind: CacheResourceKind, key?: string): Promise<void>;
}

interface CacheEnvelope<T> {
  schemaVersion: 1;
  kind: CacheResourceKind;
  value: T;
  storedAt: number;
  validatedAt: number;
  expiresAt: number;
}

export class OfflineCacheMissError extends Error {
  readonly code = 'OFFLINE_CACHE_MISS';

  constructor(readonly kind: CacheResourceKind, readonly cacheKey: string) {
    super(`No cached ${kind} data is available while offline.`);
    this.name = 'OfflineCacheMissError';
  }
}

const CACHE_PREFIX = 'oummah:core-cache:v1:';
const HOUR = 60 * 60 * 1_000;
const DAY = 24 * HOUR;

export const DEFAULT_CACHE_POLICIES: Readonly<Record<CacheResourceKind, CachePolicy>> = {
  surahs: { ttlMs: 7 * DAY, revalidateAfterMs: DAY },
  verses: { ttlMs: 30 * DAY, revalidateAfterMs: 7 * DAY },
  audio: { ttlMs: 6 * HOUR, revalidateAfterMs: HOUR },
  metadata: { ttlMs: 7 * DAY, revalidateAfterMs: DAY },
  reciters: { ttlMs: DAY, revalidateAfterMs: 6 * HOUR },
  prayers: { ttlMs: 6 * HOUR, revalidateAfterMs: HOUR },
  dalil: { ttlMs: DAY, revalidateAfterMs: 6 * HOUR },
  user: { ttlMs: HOUR, revalidateAfterMs: 15 * 60 * 1_000 },
};

function fullKey(kind: CacheResourceKind, key: string) {
  return `${CACHE_PREFIX}${kind}:${key}`;
}

function isEnvelope<T>(value: unknown, kind: CacheResourceKind): value is CacheEnvelope<T> {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<CacheEnvelope<T>>;
  return entry.schemaVersion === 1
    && entry.kind === kind
    && typeof entry.storedAt === 'number'
    && typeof entry.validatedAt === 'number'
    && typeof entry.expiresAt === 'number'
    && 'value' in entry;
}

/** Persistent stale-while-revalidate boundary shared by every data repository. */
export class CacheRepository implements CacheRepositoryContract {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly storage: StorageServiceContract = storageService,
    private readonly network: NetworkRepository = networkRepository,
    private readonly now: () => number = Date.now,
    private readonly onError?: (event: CacheErrorEvent) => void,
  ) {}

  async getOrFetch<T>(request: CacheRequest<T>): Promise<T> {
    const key = fullKey(request.kind, request.key);
    const cached = await this.read<T>(request.kind, key);
    const policy = { ...DEFAULT_CACHE_POLICIES[request.kind], ...request.policy };

    if (cached) {
      const shouldRefresh = request.forceRefresh
        || this.now() >= cached.expiresAt
        || this.now() - cached.validatedAt >= policy.revalidateAfterMs;
      if (shouldRefresh) void this.revalidateInBackground(request, key, policy);
      return cached.value;
    }

    if (await this.online() === false) throw new OfflineCacheMissError(request.kind, request.key);
    return this.fetchAndStore(request, key, policy, false);
  }

  async refresh<T>(request: Omit<CacheRequest<T>, 'forceRefresh'>): Promise<T> {
    const key = fullKey(request.kind, request.key);
    const policy = { ...DEFAULT_CACHE_POLICIES[request.kind], ...request.policy };
    if (await this.online() === false) {
      const cached = await this.read<T>(request.kind, key);
      if (cached) return cached.value;
      throw new OfflineCacheMissError(request.kind, request.key);
    }
    return this.fetchAndStore(request, key, policy, false);
  }

  async invalidate(kind: CacheResourceKind, key?: string) {
    if (key) return this.safeRemove(kind, fullKey(kind, key));
    let keys: readonly string[] = [];
    try {
      keys = await this.storage.keys();
    } catch (error) {
      this.report({ kind, key: '*', operation: 'read', error, background: false });
    }
    await Promise.all(keys
      .filter((item) => item.startsWith(`${CACHE_PREFIX}${kind}:`))
      .map((item) => this.safeRemove(kind, item)));
  }

  private async online() {
    return this.network.isOnline().catch(() => undefined);
  }

  private async read<T>(kind: CacheResourceKind, key: string): Promise<CacheEnvelope<T> | null> {
    let raw: string | null;
    try {
      raw = await this.storage.getString(key);
    } catch (error) {
      this.report({ kind, key, operation: 'read', error, background: false });
      return null;
    }
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isEnvelope<T>(parsed, kind)) return parsed;
    } catch (error) {
      this.report({ kind, key, operation: 'parse', error, background: false });
    }
    await this.safeRemove(kind, key);
    return null;
  }

  private fetchAndStore<T>(
    request: Omit<CacheRequest<T>, 'forceRefresh'>,
    key: string,
    policy: CachePolicy,
    background: boolean,
  ): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const task = request.loader()
      .then(async (value) => {
        const timestamp = this.now();
        const envelope: CacheEnvelope<T> = {
          schemaVersion: 1,
          kind: request.kind,
          value,
          storedAt: timestamp,
          validatedAt: timestamp,
          expiresAt: timestamp + policy.ttlMs,
        };
        try {
          await this.storage.setString(key, JSON.stringify(envelope));
        } catch (error) {
          this.report({ kind: request.kind, key, operation: 'write', error, background });
        }
        return value;
      })
      .catch((error) => {
        this.report({ kind: request.kind, key, operation: 'fetch', error, background });
        throw error;
      })
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, task);
    return task;
  }

  private async revalidateInBackground<T>(
    request: Omit<CacheRequest<T>, 'forceRefresh'>,
    key: string,
    policy: CachePolicy,
  ) {
    if (await this.online() === false) return;
    await this.fetchAndStore(request, key, policy, true).catch(() => undefined);
  }

  private async safeRemove(kind: CacheResourceKind, key: string) {
    try {
      await this.storage.remove(key);
    } catch (error) {
      this.report({ kind, key, operation: 'remove', error, background: false });
    }
  }

  private report(event: CacheErrorEvent) {
    this.onError?.(event);
  }
}

export const cacheRepository = new CacheRepository();
