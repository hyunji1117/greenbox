// Service Worker 버전 관리
const CACHE_NAME = 'greenbox-v1';
const urlsToCache = [
  '/',
  '/greenbox-seven.vercel.app', // 오프라인 페이지
];

// Service Worker 설치
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    }),
  );
  // 즉시 활성화
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  // 즉시 클라이언트 제어
  self.clients.claim();
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 캐시에 있으면 캐시에서 반환
      if (response) {
        return response;
      }

      // 네트워크 요청
      return fetch(event.request)
        .then(response => {
          // 유효하지 않은 응답 체크
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response;
          }

          // 응답 복제 (캐시 저장용)
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // 오프라인 상태일 때 오프라인 페이지 반환
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
    }),
  );
});

// 푸시 알림
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/our-fridge_logo2.png',
    badge: '/our-fridge_logo2.png',
  };

  event.waitUntil(self.registration.showNotification('Greenbox', options));
});
