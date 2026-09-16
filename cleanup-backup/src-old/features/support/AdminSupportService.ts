import { getValidSession } from "../auth/SupabaseAuthService";
import { isOummahAdminSession } from "../auth/AdminAccess";

export type AdminSupportTicket = {
  id: string;
  userId: string;
  userEmail: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  unreadByAdmin: boolean;
};

export type AdminSupportMessage = {
  id: string;
  senderType: "user" | "admin";
  senderEmail: string | null;
  body: string;
  createdAt: string;
};

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error("ADMIN_SUPABASE_NOT_CONFIGURED");
  }

  return { url, key };
}

async function rpc<T>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const session = await getValidSession(true);

  if (!isOummahAdminSession(session)) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  const { url, key } = configuration();

  const response = await fetch(
    `${url}/rest/v1/rpc/${name}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${session!.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error(
      (await response.text().catch(() => "")) ||
        "ADMIN_SUPPORT_REQUEST_FAILED",
    );
  }

  return (await response.json()) as T;
}

export async function getAdminSupportTickets(
  status: string | null,
): Promise<AdminSupportTicket[]> {
  const rows = await rpc<Array<{
    id: string;
    user_id: string;
    user_email: string | null;
    category: string;
    priority: string;
    status: string;
    subject: string;
    created_at: string;
    updated_at: string;
    last_message_at: string;
    unread_by_admin: boolean;
  }>>("admin_list_support_tickets", {
    p_status: status,
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email ?? "Adresse inconnue",
    category: row.category,
    priority: row.priority,
    status: row.status,
    subject: row.subject,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
    unreadByAdmin: row.unread_by_admin,
  }));
}

export async function getAdminSupportMessages(
  ticketId: string,
): Promise<AdminSupportMessage[]> {
  const rows = await rpc<Array<{
    id: string;
    sender_type: "user" | "admin";
    sender_email: string | null;
    body: string;
    created_at: string;
  }>>("admin_list_support_messages", {
    p_ticket_id: ticketId,
  });

  return rows.map((row) => ({
    id: row.id,
    senderType: row.sender_type,
    senderEmail: row.sender_email,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function adminReplySupportTicket(
  ticketId: string,
  body: string,
): Promise<void> {
  await rpc("admin_reply_support_ticket", {
    p_ticket_id: ticketId,
    p_body: body.trim(),
  });

  void notifySupportReply(ticketId).catch(() => undefined);
}

export async function adminUpdateSupportTicket(
  ticketId: string,
  status: string,
  priority: string,
): Promise<void> {
  await rpc("admin_update_support_ticket", {
    p_ticket_id: ticketId,
    p_status: status,
    p_priority: priority,
  });
}


export type AdminSupportCounts = {
  open: number;
  inProgress: number;
  urgent: number;
  unread: number;
};

export async function getAdminSupportCounts(): Promise<AdminSupportCounts> {
  const raw = await rpc<{
    open_count: number;
    in_progress_count: number;
    urgent_count: number;
    unread_count: number;
  }>("admin_get_support_counts");

  return {
    open: Number(raw.open_count ?? 0),
    inProgress: Number(raw.in_progress_count ?? 0),
    urgent: Number(raw.urgent_count ?? 0),
    unread: Number(raw.unread_count ?? 0),
  };
}

export async function notifySupportReply(
  ticketId: string,
): Promise<void> {
  const session = await getValidSession(true);
  if (!isOummahAdminSession(session)) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  const { url, key } = configuration();

  const response = await fetch(
    `${url}/functions/v1/send-support-reply-push`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${session!.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticketId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("SUPPORT_PUSH_FAILED");
  }
}
