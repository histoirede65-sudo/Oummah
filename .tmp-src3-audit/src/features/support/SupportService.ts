import { getValidSession } from "../auth/SupabaseAuthService";

export type SupportTicketCategory =
  | "bug"
  | "help"
  | "suggestion"
  | "account"
  | "other";

export type SupportTicketPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type SupportTicket = {
  id: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  subject: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  unreadByUser: boolean;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
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
    throw new Error("SUPPORT_SUPABASE_NOT_CONFIGURED");
  }

  return { url, key };
}

async function authenticatedFetch(
  path: string,
  init: RequestInit,
) {
  const session = await getValidSession(true);

  if (!session) {
    throw new Error("AUTH_REQUIRED");
  }

  const { url, key } = configuration();

  return fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function createSupportTicket(input: {
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  subject: string;
  message: string;
}): Promise<string> {
  const response = await authenticatedFetch(
    "/rest/v1/rpc/create_support_ticket",
    {
      method: "POST",
      body: JSON.stringify({
        p_category: input.category,
        p_priority: input.priority,
        p_subject: input.subject.trim(),
        p_message: input.message.trim(),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      (await response.text().catch(() => "")) ||
        "SUPPORT_TICKET_CREATE_FAILED",
    );
  }

  return (await response.json()) as string;
}

export async function getMySupportTickets(): Promise<SupportTicket[]> {
  const response = await authenticatedFetch(
    "/rest/v1/rpc/list_my_support_tickets",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    throw new Error("SUPPORT_TICKETS_LOAD_FAILED");
  }

  const rows = (await response.json()) as Array<{
    id: string;
    category: SupportTicketCategory;
    priority: SupportTicketPriority;
    status: SupportTicketStatus;
    subject: string;
    created_at: string;
    updated_at: string;
    last_message_at: string;
    unread_by_user: boolean;
  }>;

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    priority: row.priority,
    status: row.status,
    subject: row.subject,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
    unreadByUser: row.unread_by_user,
  }));
}

export async function getSupportTicketMessages(
  ticketId: string,
): Promise<SupportMessage[]> {
  const response = await authenticatedFetch(
    "/rest/v1/rpc/list_my_support_messages",
    {
      method: "POST",
      body: JSON.stringify({
        p_ticket_id: ticketId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("SUPPORT_MESSAGES_LOAD_FAILED");
  }

  const rows = (await response.json()) as Array<{
    id: string;
    ticket_id: string;
    sender_type: "user" | "admin";
    sender_email: string | null;
    body: string;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    ticketId: row.ticket_id,
    senderType: row.sender_type,
    senderEmail: row.sender_email,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function replyToSupportTicket(
  ticketId: string,
  body: string,
): Promise<void> {
  const response = await authenticatedFetch(
    "/rest/v1/rpc/reply_to_my_support_ticket",
    {
      method: "POST",
      body: JSON.stringify({
        p_ticket_id: ticketId,
        p_body: body.trim(),
      }),
    },
  );

  if (!response.ok) {
    throw new Error("SUPPORT_REPLY_FAILED");
  }
}


export async function getMyUnreadSupportCount(): Promise<number> {
  const response = await authenticatedFetch(
    "/rest/v1/rpc/get_my_unread_support_count",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );

  if (!response.ok) return 0;

  return Number(await response.json()) || 0;
}
