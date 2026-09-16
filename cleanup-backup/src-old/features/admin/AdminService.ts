import { getValidSession } from "../auth/SupabaseAuthService";
import { isOummahAdminSession } from "../auth/AdminAccess";

export type AdminDashboard = {
  usersTotal: number;
  usersToday: number;
  mosquePending: number;
  mosqueApproved: number;
  mosqueRejected: number;
  walletsTotal: number;
  creditsAvailable: number;
  creditsSpent: number;
  mosqueReportsPending: number;
  adminActionsToday: number;
};

export type AdminUserRow = {
  userId: string;
  email: string;
  createdAt: string;
  balance: number;
  totalSpent: number;
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

async function rpc<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  const session = await getValidSession(true);
  if (!isOummahAdminSession(session)) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  const { url, key } = configuration();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session!.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || "ADMIN_REQUEST_FAILED");
  }

  return (await response.json()) as T;
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const raw = await rpc<{
    users_total?: number;
    users_today?: number;
    mosque_pending?: number;
    mosque_approved?: number;
    mosque_rejected?: number;
    wallets_total?: number;
    credits_available?: number;
    credits_spent?: number;
    mosque_reports_pending?: number;
    admin_actions_today?: number;
  }>("admin_get_dashboard");

  return {
    usersTotal: Number(raw.users_total ?? 0),
    usersToday: Number(raw.users_today ?? 0),
    mosquePending: Number(raw.mosque_pending ?? 0),
    mosqueApproved: Number(raw.mosque_approved ?? 0),
    mosqueRejected: Number(raw.mosque_rejected ?? 0),
    walletsTotal: Number(raw.wallets_total ?? 0),
    creditsAvailable: Number(raw.credits_available ?? 0),
    creditsSpent: Number(raw.credits_spent ?? 0),
    mosqueReportsPending: Number(raw.mosque_reports_pending ?? 0),
    adminActionsToday: Number(raw.admin_actions_today ?? 0),
  };
}

export async function getAdminUsers(
  search = "",
  limit = 50,
): Promise<AdminUserRow[]> {
  const rows = await rpc<Array<{
    user_id: string;
    email: string | null;
    created_at: string;
    balance: number | null;
    total_spent: number | null;
  }>>("admin_list_users", {
    p_search: search.trim() || null,
    p_limit: Math.min(100, Math.max(1, limit)),
  });

  return rows.map((row) => ({
    userId: row.user_id,
    email: row.email ?? "Adresse inconnue",
    createdAt: row.created_at,
    balance: Number(row.balance ?? 0),
    totalSpent: Number(row.total_spent ?? 0),
  }));
}

export async function adjustAdminUserCredits(
  userId: string,
  amount: number,
  reason: string,
) {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error("ADMIN_CREDIT_AMOUNT_INVALID");
  }

  return rpc<{ balance: number }>("admin_adjust_wasil_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason.trim() || "Ajustement administrateur",
  });
}


export type AdminActivityKind =
  | "mosque_review"
  | "mosque_report"
  | "credit_adjustment";

export type AdminActivityRow = {
  id: string;
  kind: AdminActivityKind;
  title: string;
  description: string;
  adminEmail: string | null;
  createdAt: string;
  amount: number | null;
  status: string | null;
};

export async function getAdminActivity(
  limit = 100,
): Promise<AdminActivityRow[]> {
  const rows = await rpc<Array<{
    id: string;
    kind: AdminActivityKind;
    title: string;
    description: string;
    admin_email: string | null;
    created_at: string;
    amount: number | null;
    status: string | null;
  }>>("admin_list_activity", {
    p_limit: Math.min(200, Math.max(1, limit)),
  });

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    adminEmail: row.admin_email,
    createdAt: row.created_at,
    amount: row.amount === null ? null : Number(row.amount),
    status: row.status,
  }));
}


export type AdminUserDetail = {
  userId: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  balance: number;
  totalSpent: number;
  adjustmentCount: number;
  adjustmentTotal: number;
};

export type AdminUserCreditAdjustment = {
  id: string;
  amount: number;
  reason: string;
  adminEmail: string | null;
  createdAt: string;
};

export async function getAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail> {
  const raw = await rpc<{
    user_id: string;
    email: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    balance: number | null;
    total_spent: number | null;
    adjustment_count: number | null;
    adjustment_total: number | null;
  }>("admin_get_user_detail", {
    p_user_id: userId,
  });

  return {
    userId: raw.user_id,
    email: raw.email ?? "Adresse inconnue",
    createdAt: raw.created_at,
    lastSignInAt: raw.last_sign_in_at,
    balance: Number(raw.balance ?? 0),
    totalSpent: Number(raw.total_spent ?? 0),
    adjustmentCount: Number(raw.adjustment_count ?? 0),
    adjustmentTotal: Number(raw.adjustment_total ?? 0),
  };
}

export async function getAdminUserCreditHistory(
  userId: string,
  limit = 100,
): Promise<AdminUserCreditAdjustment[]> {
  const rows = await rpc<Array<{
    id: string;
    amount: number;
    reason: string;
    admin_email: string | null;
    created_at: string;
  }>>("admin_list_user_credit_adjustments", {
    p_user_id: userId,
    p_limit: Math.min(200, Math.max(1, limit)),
  });

  return rows.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    reason: row.reason,
    adminEmail: row.admin_email,
    createdAt: row.created_at,
  }));
}


export type OummahAdminRole =
  | "owner"
  | "admin"
  | "mosque_moderator"
  | "support";

export type OummahAdminRow = {
  userId: string;
  email: string;
  role: OummahAdminRole;
  createdAt: string;
  createdByEmail: string | null;
};

export async function getAdminMembers(): Promise<OummahAdminRow[]> {
  const rows = await rpc<Array<{
    user_id: string;
    email: string | null;
    role: OummahAdminRole;
    created_at: string;
    created_by_email: string | null;
  }>>("admin_list_admin_members");

  return rows.map((row) => ({
    userId: row.user_id,
    email: row.email ?? "Adresse inconnue",
    role: row.role,
    createdAt: row.created_at,
    createdByEmail: row.created_by_email,
  }));
}

export async function addAdminMember(
  email: string,
  role: OummahAdminRole,
): Promise<void> {
  await rpc("admin_add_admin_member", {
    p_email: email.trim().toLowerCase(),
    p_role: role,
  });
}

export async function updateAdminMemberRole(
  userId: string,
  role: OummahAdminRole,
): Promise<void> {
  await rpc("admin_update_admin_member_role", {
    p_user_id: userId,
    p_role: role,
  });
}

export async function removeAdminMember(
  userId: string,
): Promise<void> {
  await rpc("admin_remove_admin_member", {
    p_user_id: userId,
  });
}


export type AdminAnnouncementStatus = "draft" | "published" | "archived";
export type AdminAnnouncementAudience = "all" | "free" | "premium";
export type AdminAnnouncementRow = {
  id:string; title:string; body:string; audience:AdminAnnouncementAudience;
  status:AdminAnnouncementStatus; actionLabel:string|null; actionRoute:string|null;
  startsAt:string; endsAt:string|null; showOnHome:boolean; showInNotifications:boolean;
  createdAt:string; updatedAt:string;
};
export type SaveAdminAnnouncementInput = Omit<AdminAnnouncementRow,"id"|"createdAt"|"updatedAt"> & { id?:string };

export async function getAdminAnnouncements():Promise<AdminAnnouncementRow[]> {
  const rows=await rpc<Array<any>>("admin_list_announcements");
  return rows.map(row=>({id:row.id,title:row.title,body:row.body,audience:row.audience,status:row.status,actionLabel:row.action_label,actionRoute:row.action_route,startsAt:row.starts_at,endsAt:row.ends_at,showOnHome:row.show_on_home,showInNotifications:row.show_in_notifications,createdAt:row.created_at,updatedAt:row.updated_at}));
}
export async function saveAdminAnnouncement(input:SaveAdminAnnouncementInput):Promise<void>{
  await rpc("admin_save_announcement",{p_id:input.id??null,p_title:input.title,p_body:input.body,p_audience:input.audience,p_status:input.status,p_action_label:input.actionLabel,p_action_route:input.actionRoute,p_starts_at:input.startsAt,p_ends_at:input.endsAt,p_show_on_home:input.showOnHome,p_show_in_notifications:input.showInNotifications});
}
export async function archiveAdminAnnouncement(id:string):Promise<void>{await rpc("admin_archive_announcement",{p_id:id});}
