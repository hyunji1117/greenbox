// worker/index.js
// next-pwa 커스텀 워커: 빌드 시 번들링되어 sw.js에 importScripts로 포함된다.
// (별도 서비스워커를 등록하면 같은 scope의 precache SW를 대체하므로 여기로 합침)

self.addEventListener('push', event => {
  // JSON이 아닌 텍스트 페이로드(예: DevTools 테스트 푸시)는 본문으로 사용
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '알림', {
      body: data.body || '새로운 알림이 도착했습니다',
      icon: '/our-fridge_logo2_192_bgwhite.png',
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
