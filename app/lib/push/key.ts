// app/lib/push/key.ts
// VAPID 공개 키 변환과 비교

export function urlBase64ToUint8Array(base64String: string) {
  // URL-safe base64 → Uint8Array 변환
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

// 구독에 쓰인 키가 현재 키와 다르면 서버가 보낸 푸시를 푸시 서비스가 거절한다
export function isSameKey(subscribed: ArrayBuffer | null, current: Uint8Array) {
  if (!subscribed) return false;
  const bytes = new Uint8Array(subscribed);
  return (
    bytes.length === current.length &&
    bytes.every((byte, i) => byte === current[i])
  );
}
