// app/lib/notifications/pushOpen.ts
// 알림을 눌러 열린 주소(?from=push&kind=&v=&d=)를 읽어 열기 기록을 남기고, 주소에서 그 값을 지운다
// 지우지 않으면 새로고침이나 주소 공유 때 다시 기록되므로 바로 지운다

export interface PushOpen {
  kind: 'daily' | 'weekly';
  variant: string;
  period: string;
}

export function readPushOpen(search: string): PushOpen | null {
  const params = new URLSearchParams(search);
  if (params.get('from') !== 'push') return null;
  const kind = params.get('kind');
  const variant = params.get('v') ?? '';
  const period = params.get('d') ?? '';
  if (kind !== 'daily' && kind !== 'weekly') return null;
  if (!/^[A-Z]$/.test(variant) || !/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return null;
  }
  return { kind, variant, period };
}

// 탭 같은 나머지 값은 남기고 알림 표시만 지운 주소
export function withoutPushParams(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  for (const key of ['from', 'kind', 'v', 'd']) params.delete(key);
  const rest = params.toString();
  return rest ? `${pathname}?${rest}` : pathname;
}
