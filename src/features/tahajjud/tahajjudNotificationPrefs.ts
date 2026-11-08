import * as Notifications from 'expo-notifications';
import { storageService } from '../../core/storage/StorageService';
import { getValidSession } from '../auth/SupabaseAuthService';
import { isNotificationPermissionGranted } from '../notifications/NotificationPermissions';
import { getDuaWallAlerts, setDuaWallAlerts } from './duaWall';
import { loadTahajjudSettings, saveTahajjudSettings } from './TahajjudStore';
import { ensureTahajjudNotificationPermission, refreshTahajjudNotifications } from './tahajjudService';

/**
 * Réglages de notification du Qiyam partagés par l'accueil du module et l'écran Notifications :
 * début du dernier tiers (sur le téléphone) et nouvelles duas du mur (sur le compte).
 * Les deux sont activés par défaut ; chacun peut les couper.
 */

const DEFAULTS_APPLIED_KEY = 'oummah.tahajjud.notificationDefaults.v1';

export type QiyamNotificationState = { start: boolean; duas: boolean | null };

/** `duas` vaut null quand personne n'est connecté (le réglage est lié au compte). */
export async function loadQiyamNotificationState(): Promise<QiyamNotificationState> {
  await applyQiyamNotificationDefaults();
  const settings = await loadTahajjudSettings();
  const session = await getValidSession().catch(() => null);
  const duas = session ? await getDuaWallAlerts().catch(() => false) : null;
  return { start: settings.notifications.start, duas };
}

export async function setQiyamStartNotification(on: boolean) {
  if (on && !(await ensureTahajjudNotificationPermission())) return false;
  const settings = await loadTahajjudSettings();
  await saveTahajjudSettings({ ...settings, notifications: { ...settings.notifications, start: on } });
  void refreshTahajjudNotifications(true);
  return true;
}

export async function setQiyamDuaNotification(on: boolean) {
  if (!(await getValidSession().catch(() => null))) return false;
  if (on && !(await ensureTahajjudNotificationPermission())) return false;
  await setDuaWallAlerts(on);
  return true;
}

/**
 * Une seule fois : active les deux notifications pour qui n'a encore rien réglé, sans jamais
 * demander l'autorisation ici (elles ne partent que si les notifications sont déjà autorisées).
 */
async function applyQiyamNotificationDefaults() {
  const session = await getValidSession().catch(() => null);
  const applied = (await storageService.get<{ start?: boolean; duas?: string }>(DEFAULTS_APPLIED_KEY).catch(() => null)) ?? {};
  let changed = false;

  if (!applied.start) {
    const settings = await loadTahajjudSettings();
    const untouched = !settings.alarm.enabled && !Object.values(settings.notifications).some(Boolean);
    if (untouched) {
      await saveTahajjudSettings({ ...settings, notifications: { ...settings.notifications, start: true } });
      void refreshTahajjudNotifications(true);
    }
    applied.start = true;
    changed = true;
  }

  if (session && applied.duas !== session.user.id) {
    const permission = await Notifications.getPermissionsAsync().catch(() => null);
    if (permission && isNotificationPermissionGranted(permission)) {
      await setDuaWallAlerts(true).catch(() => undefined);
      applied.duas = session.user.id;
      changed = true;
    }
  }

  if (changed) await storageService.set(DEFAULTS_APPLIED_KEY, applied).catch(() => undefined);
}
