import * as Notifications from "expo-notifications";

export function isNotificationPermissionGranted(
  status: Notifications.NotificationPermissionsStatus,
) {
  return (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}
