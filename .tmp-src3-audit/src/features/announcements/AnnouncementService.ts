import { getPremiumAccess } from "../premium/PremiumAccessService";

export type AnnouncementAudience = "all" | "free" | "premium";
export type AnnouncementPlacement = "home" | "notifications";

export type PublicAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  actionLabel: string | null;
  actionRoute: string | null;
  startsAt: string;
  endsAt: string | null;
  showOnHome: boolean;
  showInNotifications: boolean;
  createdAt: string;
};

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();
  if (!url || !key) throw new Error("ANNOUNCEMENT_SUPABASE_NOT_CONFIGURED");
  return { url, key };
}

export async function getActiveAnnouncements(
  placement: AnnouncementPlacement,
): Promise<PublicAnnouncement[]> {
  const { url, key } = configuration();
  const premium = await getPremiumAccess().catch(() => null);
  const audience = premium?.isPremium ? "premium" : "free";

  const response = await fetch(`${url}/rest/v1/rpc/get_active_announcements`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_placement: placement, p_audience: audience }),
  });

  if (!response.ok) return [];
  const rows = (await response.json()) as Array<{
    id: string; title: string; body: string; audience: AnnouncementAudience;
    action_label: string|null; action_route: string|null; starts_at: string;
    ends_at: string|null; show_on_home: boolean; show_in_notifications: boolean;
    created_at: string;
  }>;
  return rows.map(row=>({
    id:row.id,title:row.title,body:row.body,audience:row.audience,
    actionLabel:row.action_label,actionRoute:row.action_route,startsAt:row.starts_at,
    endsAt:row.ends_at,showOnHome:row.show_on_home,
    showInNotifications:row.show_in_notifications,createdAt:row.created_at,
  }));
}
