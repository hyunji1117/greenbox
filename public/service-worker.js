// public/service-worker.js

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title || '알림', {
      body: data.body || '새로운 알림이 도착했습니다',
      icon: '/our-fridge_logo2_192_bgwhite.png',
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
