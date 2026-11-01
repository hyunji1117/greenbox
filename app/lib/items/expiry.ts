// app/lib/items/expiry.ts
// 유통기한 날짜 계산. 시간대에 따라 날짜가 밀리지 않도록 날짜만 비교한다

const DAY_MS = 86_400_000;
// 연도를 입력하는 도중의 값(0002-11-01 등)이 저장되지 않도록 막는 하한
const EARLIEST_DATE = '2000-01-01';

export const EXPIRY_SOON_DAYS = 3;

export function isSavableExpiryDate(value: string): boolean {
  return value >= EARLIEST_DATE;
}

export function daysUntilExpiry(expiryDate: string, now = new Date()): number {
  const [year, month, day] = expiryDate.split('-').map(Number);
  const expiry = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expiry - today) / DAY_MS);
}

export function expiryLabel(days: number): string {
  if (days === 0) return '오늘까지';
  return days > 0 ? `${days}일 남음` : `${-days}일 지남`;
}
