import { getValidSession } from "../auth/SupabaseAuthService";

export type AnalyticsEventName =
  | "screen_view"
  | "wasil_question"
  | "app_open";

export type AnalyticsModule =
  | "home"
  | "quran"
  | "audio"
  | "hadith"
  | "dua"
  | "dhikr"
  | "mosques"
  | "qibla"
  | "goals"
  | "calendar"
  | "profile"
  | "wasil"
  | "premium"
  | "other";

type TrackEventInput = {
  eventName: AnalyticsEventName;
  module: AnalyticsModule;
  route?: string;
  metadata?: Record<string, unknown>;
};

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) return null;
  return { url, key };
}

export function moduleFromRoute(route: string): AnalyticsModule {
  const normalized = route.toLowerCase();

  if (normalized === "/" || normalized.includes("/(tabs)/index")) return "home";
  if (normalized.includes("quran") || normalized.includes("surah")) return "quran";
  if (normalized.includes("listen") || normalized.includes("audio")) return "audio";
  if (normalized.includes("hadith")) return "hadith";
  if (normalized.includes("dua")) return "dua";
  if (normalized.includes("dhikr")) return "dhikr";
  if (normalized.includes("mosque")) return "mosques";
  if (normalized.includes("qibla")) return "qibla";
  if (normalized.includes("goal") || normalized.includes("hifz")) return "goals";
  if (normalized.includes("calendar")) return "calendar";
  if (normalized.includes("profile")) return "profile";
  if (normalized.includes("dalil") || normalized.includes("wasil")) return "wasil";
  if (normalized.includes("premium")) return "premium";

  return "other";
}

export async function trackAnalyticsEvent(
  input: TrackEventInput,
): Promise<void> {
  const config = configuration();
  if (!config) return;

  const session = await getValidSession().catch(() => null);
  if (!session) return;

  await fetch(`${config.url}/rest/v1/analytics_events`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      event_name: input.eventName,
      module: input.module,
      route: input.route?.slice(0, 240) ?? null,
      metadata: input.metadata ?? {},
    }),
  }).catch(() => undefined);
}
