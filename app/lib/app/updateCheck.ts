// app/lib/app/updateCheck.ts
// 새 버전 확인. 열려 있는 화면의 버전(빌드할 때 넣은 값)과 지금 배포된 버전을 비교한다

import { APP_VERSION } from '@/app/lib/app/version';

// 같은 버전으로 여러 번 새로 불러오지 않게 기억한다 (캐시 때문에 바로 바뀌지 않아도 반복하지 않게)
export const RELOADED_FOR_KEY = 'greenbox_reloaded_for_version';

export async function fetchDeployedVersion(): Promise<string | null> {
  try {
    const res = await fetch('/api/version', { cache: 'no-store' });
    if (!res.ok) return null;
    const body = (await res.json()) as { version?: unknown };
    return typeof body.version === 'string' ? body.version : null;
  } catch {
    return null;
  }
}

export function isNewerDeployed(deployed: string | null): boolean {
  return Boolean(deployed) && deployed !== APP_VERSION;
}

// 이 버전으로 이미 한 번 새로 불러왔는지
export function alreadyReloadedFor(version: string): boolean {
  try {
    return sessionStorage.getItem(RELOADED_FOR_KEY) === version;
  } catch {
    return false;
  }
}

// 앱을 새로 받아 다시 연다 (종료했다 다시 켠 것과 같게)
// 저장해 둔 화면 파일(캐시)을 모두 지우고, 서비스 워커도 새 버전을 받게 한 뒤 새로 불러온다
export async function reloadToVersion(version: string): Promise<void> {
  try {
    sessionStorage.setItem(RELOADED_FOR_KEY, version);
  } catch {
    // 기억하지 못해도 새로 불러오기는 한다
  }
  try {
    const keys = (await window.caches?.keys()) ?? [];
    await Promise.all(keys.map(key => window.caches.delete(key)));
  } catch {
    // 캐시를 지우지 못해도 새로 불러오기는 한다
  }
  try {
    await (await navigator.serviceWorker?.getRegistration())?.update();
  } catch {
    // 서비스 워커가 없거나 막혀도 새로 불러오기는 한다
  }
  window.location.reload();
}
