/* Web Push Service Worker for Vibes Arc */

// ─── Activation immediate du SW ─────────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting(); // Active immediatement le nouveau SW sans attendre
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // Prend le controle de tous les onglets ouverts
});

// ─── Web Push ────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    try {
      data = { body: event.data ? event.data.text() : '' };
    } catch {
      data = {};
    }
  }

  const title = data.title || 'Vibes Arc';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

