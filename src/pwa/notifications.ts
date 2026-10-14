// System notifications while the app is open. There is no push server, so nothing
// arrives when SmartOperation is closed.

/** Shown next to every place that sets up notifications. */
export const PUSH_NOTE =
  'Уведомления приходят, только пока SmartOperation открыт (вкладка или установленное приложение). Push без сервера невозможен, а сервера у SmartOperation нет — данные не покидают устройство.';

export function notificationsSupported(): boolean {
  return 'Notification' in window;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

/** Shows a system notification if allowed; through the service worker where the constructor is not (Android). */
export async function systemNotify(title: string, body: string): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;
  const options: NotificationOptions = { body, icon, badge: icon, tag: title };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      return;
    }
    new Notification(title, options);
  } catch {
    // Some browsers refuse silently; the in-app bar still shows the alert.
  }
}
