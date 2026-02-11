// notifications.js
export function requestNotificationPermission() {
  if (!("Notification" in window)) return Promise.resolve(false);
  if (Notification.permission === "granted") return Promise.resolve(true);
  if (Notification.permission !== "denied") {
    return Notification.requestPermission().then(p => p === "granted");
  }
  return Promise.resolve(false);
}

export function showBrowserNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: '/favicon.ico' });
}
