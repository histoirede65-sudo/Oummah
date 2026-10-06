import { getValidSession } from '../../auth/SupabaseAuthService';

/**
 * Annonces et événements des mosquées : proposés par les utilisateurs connectés, affichés après
 * validation par un administrateur.
 */

export type MosquePostKind = 'announcement' | 'event';

export type MosquePost = {
  id: string;
  kind: MosquePostKind;
  title: string;
  body?: string;
  /** ISO date-time. Required for events. */
  startsAt?: string;
  endsAt?: string;
  publishedAt: string;
};

export type MosquePostProposal = MosquePost & {
  mosqueId: string;
  mosqueName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

type PostRow = {
  id: string; kind: string; title: string; body: string | null;
  starts_at: string | null; ends_at: string | null; published_at?: string; created_at?: string;
  mosque_id?: string; mosque_name?: string; status?: string;
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!url || !anon) throw new Error('SUPABASE_NOT_CONFIGURED');
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: anon, Authorization: `Bearer ${token ?? anon}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(await response.text());
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function toPost(row: PostRow): MosquePost {
  return {
    id: row.id,
    kind: row.kind === 'event' ? 'event' : 'announcement',
    title: row.title,
    body: row.body ?? undefined,
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    publishedAt: row.published_at ?? row.created_at ?? new Date().toISOString(),
  };
}

/** Current announcements and upcoming events of a mosque. Empty offline. */
export async function getMosquePosts(mosqueId: string): Promise<MosquePost[]> {
  const rows = await request<PostRow[]>('rpc/get_mosque_posts', {
    method: 'POST', body: JSON.stringify({ p_mosque_id: mosqueId }),
  }).catch(() => []);
  return rows.map(toPost);
}

export async function proposeMosquePost(input: {
  mosqueId: string;
  mosqueName: string;
  kind: MosquePostKind;
  title: string;
  body?: string;
  startsAt?: Date;
  endsAt?: Date;
}) {
  const session = await getValidSession(true);
  if (!session?.accessToken || !session.user?.id) throw new Error('AUTH_REQUIRED');
  try {
    await request('mosque_posts', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        mosque_id: input.mosqueId,
        mosque_name: input.mosqueName,
        kind: input.kind,
        title: input.title.trim(),
        body: input.body?.trim() || null,
        starts_at: input.startsAt?.toISOString() ?? null,
        ends_at: input.endsAt?.toISOString() ?? null,
        submitted_by: session.user.id,
        status: 'pending',
      }),
    }, session.accessToken);
  } catch (error) {
    if (error instanceof Error && error.message.includes('MOSQUE_POST_LIMIT')) throw new Error('MOSQUE_POST_LIMIT');
    throw error;
  }
}

export async function adminListMosquePosts(): Promise<MosquePostProposal[]> {
  const session = await getValidSession();
  if (!session?.accessToken) throw new Error('AUTH_REQUIRED');
  const rows = await request<PostRow[]>('rpc/admin_list_mosque_posts', {
    method: 'POST', body: JSON.stringify({ p_status: 'pending' }),
  }, session.accessToken);
  return rows.map((row) => ({
    ...toPost(row),
    mosqueId: row.mosque_id ?? '',
    mosqueName: row.mosque_name ?? '',
    status: row.status === 'approved' || row.status === 'rejected' ? row.status : 'pending',
    createdAt: row.created_at ?? '',
  }));
}

export async function adminReviewMosquePost(id: string, approve: boolean) {
  const session = await getValidSession();
  if (!session?.accessToken) throw new Error('AUTH_REQUIRED');
  await request('rpc/admin_review_mosque_post', {
    method: 'POST', body: JSON.stringify({ p_id: id, p_approve: approve }),
  }, session.accessToken);
}
