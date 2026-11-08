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
      // 누르면 열 주소. 같은 사이트 경로만 받는다
      data: {
        url:
          typeof data.url === 'string' && data.url.startsWith('/')
            ? data.url
            : '/',
      },
    }),
  );
});

// 요약 알림은 냉장고 탭과 함께 어떤 알림이었는지(종류, 문구, 날짜)를 주소에 담아 연다 (열기 기록용)
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(self.clients.openWindow(url));
});
