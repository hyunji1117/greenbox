self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  self.registration.showNotification(data.title || '푸시 알림 테스트', {
    body: data.body || '푸시 메시지 수신',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
  });
});

// 알림 클릭 동작
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
