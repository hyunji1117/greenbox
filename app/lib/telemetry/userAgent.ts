// app/lib/telemetry/userAgent.ts
// 브라우저 정보 문자열은 저장하지 않고, 기기 종류와 브라우저 이름만 뽑아 쓴다

export type Device = 'mobile' | 'desktop';

export function deviceOf(userAgent: string): Device {
  return /Mobi|Android|iPhone|iPad/i.test(userAgent) ? 'mobile' : 'desktop';
}

// 순서가 중요하다: Edge와 삼성 인터넷, 크롬 iOS도 문자열에 Chrome이나 Safari가 들어 있다
export function browserOf(userAgent: string): string {
  if (/Edg\//.test(userAgent)) return 'edge';
  if (/SamsungBrowser/.test(userAgent)) return 'samsung';
  if (/KAKAOTALK/i.test(userAgent)) return 'kakaotalk';
  if (/CriOS|Chrome\//.test(userAgent)) return 'chrome';
  if (/FxiOS|Firefox\//.test(userAgent)) return 'firefox';
  if (/Safari\//.test(userAgent)) return 'safari';
  return 'other';
}
