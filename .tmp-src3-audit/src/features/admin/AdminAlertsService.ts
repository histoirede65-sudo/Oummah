import { getValidSession } from "../auth/SupabaseAuthService";
import { isOummahAdminSession } from "../auth/AdminAccess";

export type AdminAlertSeverity = "info" | "warning" | "critical";
export type AdminAlertStatus = "open" | "resolved" | "ignored";

export type AdminAlert = {
  id: string;
  alertType: string;
  severity: AdminAlertSeverity;
  status: AdminAlertStatus;
  title: string;
  description: string;
  sourceKey: string;
  metadata: Record<string, unknown>;
  firstDetectedAt: string;
  lastDetectedAt: string;
  resolvedAt: string | null;
  ignoredAt: string | null;
  handledByEmail: string | null;
  handlingNote: string | null;
};

export type AdminAlertCounts = {
  open: number;
  critical: number;
  warning: number;
  info: number;
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
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session!.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text().catch(() => "");

  if (!response.ok) {
    throw new Error(responseText || "ADMIN_ALERT_REQUEST_FAILED");
  }

  if (!responseText.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error("ADMIN_ALERT_INVALID_RESPONSE");
  }
}

export async function refreshAdminAlerts(): Promise<void> {
  await rpc("admin_refresh_system_alerts");
}

export async function getAdminAlertCounts(
  refresh = false,
): Promise<AdminAlertCounts> {
  if (refresh) {
    await refreshAdminAlerts();
  }

  const raw = await rpc<{
    open_count?: number;
    critical_count?: number;
    warning_count?: number;
    info_count?: number;
  }>("admin_get_alert_counts");

  return {
    open: Number(raw.open_count ?? 0),
    critical: Number(raw.critical_count ?? 0),
    warning: Number(raw.warning_count ?? 0),
    info: Number(raw.info_count ?? 0),
  };
}

export async function getAdminAlerts(
  status: AdminAlertStatus,
): Promise<AdminAlert[]> {
  const rows = await rpc<Array<{
    id: string;
    alert_type: string;
    severity: AdminAlertSeverity;
    status: AdminAlertStatus;
    title: string;
    description: string;
    source_key: string;
    metadata: Record<string, unknown> | null;
    first_detected_at: string;
    last_detected_at: string;
    resolved_at: string | null;
    ignored_at: string | null;
    handled_by_email: string | null;
    handling_note: string | null;
  }>>("admin_list_system_alerts", {
    p_status: status,
    p_limit: 200,
  });

  return rows.map((row) => ({
    id: row.id,
    alertType: row.alert_type,
    severity: row.severity,
    status: row.status,
    title: row.title,
    description: row.description,
    sourceKey: row.source_key,
    metadata: row.metadata ?? {},
    firstDetectedAt: row.first_detected_at,
    lastDetectedAt: row.last_detected_at,
    resolvedAt: row.resolved_at,
    ignoredAt: row.ignored_at,
    handledByEmail: row.handled_by_email,
    handlingNote: row.handling_note,
  }));
}

export async function updateAdminAlert(
  alertId: string,
  status: AdminAlertStatus,
  note?: string,
): Promise<void> {
  await rpc("admin_update_system_alert", {
    p_alert_id: alertId,
    p_status: status,
    p_note: note?.trim() || null,
  });
}


export type AdminAlertHealth = {
  status: "healthy" | "warning" | "critical" | "never_run";
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  cronEnabled: boolean;
  cronSchedule: string | null;
  runs24h: number;
  failures24h: number;
};

export type AdminAlertSetting = {
  alertType: string;
  enabled: boolean;
  criticalPushEnabled: boolean;
  label: string;
  description: string;
  updatedAt: string;
};

export async function getAdminAlertHealth(): Promise<AdminAlertHealth> {
  const raw = await rpc<{
    status?: AdminAlertHealth["status"];
    last_run_at?: string | null;
    last_success_at?: string | null;
    last_failure_at?: string | null;
    last_error?: string | null;
    cron_enabled?: boolean;
    cron_schedule?: string | null;
    runs_24h?: number;
    failures_24h?: number;
  }>("admin_get_alert_monitor_health");

  return {
    status: raw.status ?? "never_run",
    lastRunAt: raw.last_run_at ?? null,
    lastSuccessAt: raw.last_success_at ?? null,
    lastFailureAt: raw.last_failure_at ?? null,
    lastError: raw.last_error ?? null,
    cronEnabled: Boolean(raw.cron_enabled),
    cronSchedule: raw.cron_schedule ?? null,
    runs24h: Number(raw.runs_24h ?? 0),
    failures24h: Number(raw.failures_24h ?? 0),
  };
}

export async function getAdminAlertSettings(): Promise<AdminAlertSetting[]> {
  const rows = await rpc<Array<{
    alert_type: string;
    enabled: boolean;
    critical_push_enabled: boolean;
    label: string;
    description: string;
    updated_at: string;
  }>>("admin_list_alert_settings");

  return rows.map((row) => ({
    alertType: row.alert_type,
    enabled: Boolean(row.enabled),
    criticalPushEnabled: Boolean(row.critical_push_enabled),
    label: row.label,
    description: row.description,
    updatedAt: row.updated_at,
  }));
}

export async function updateAdminAlertSetting(
  alertType: string,
  enabled: boolean,
  criticalPushEnabled: boolean,
): Promise<void> {
  await rpc("admin_update_alert_setting", {
    p_alert_type: alertType,
    p_enabled: enabled,
    p_critical_push_enabled: criticalPushEnabled,
  });
}

export async function runAdminAlertMonitorNow(): Promise<void> {
  await rpc("admin_run_alert_monitor_now");
}
