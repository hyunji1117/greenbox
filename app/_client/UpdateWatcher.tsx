// app/_client/UpdateWatcher.tsx
// 새 버전을 배포하면 열려 있던 앱도 새 버전으로 바꾼다 (설치한 앱은 닫지 않으면 예전 화면이 계속 남는다)
// - 앱을 다시 열거나 다른 앱에서 돌아올 때 새 버전이 있으면 바로 새로 불러온다 (쓰던 화면이 없는 때라 안전)
// - 쓰는 도중에는 강제로 바꾸지 않고 아래에 안내를 띄운다 (입력하던 글이 날아가지 않게)

'use client';

import { useEffect, useState } from 'react';
import { RefreshCwIcon } from 'lucide-react';
import { track } from '@/app/lib/analytics/gtag';
import {
  alreadyReloadedFor,
  fetchDeployedVersion,
  isNewerDeployed,
  reloadToVersion,
} from '@/app/lib/app/updateCheck';

// 쓰는 동안에도 가끔 확인한다
const CHECK_INTERVAL_MS = 10 * 60 * 1000;

export default function UpdateWatcher() {
  const [newVersion, setNewVersion] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;
    let cancelled = false;

    const check = async (returning: boolean) => {
      const deployed = await fetchDeployedVersion();
      if (cancelled || !deployed || !isNewerDeployed(deployed)) return;
      if (returning && !alreadyReloadedFor(deployed)) {
        track('app_updated', { how: 'auto' });
        void reloadToVersion(deployed);
        return;
      }
      setNewVersion(deployed);
    };

    void check(true);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => void check(false), CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, []);

  if (!newVersion) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] z-50 flex justify-center px-4 md:bottom-6"
    >
      <div className="flex items-center gap-2 rounded-2xl bg-[#2E1F5C] py-2 pr-2 pl-4 text-sm text-white shadow-lg">
        <span>새 버전이 나왔어요</span>
        <button
          type="button"
          onClick={() => {
            track('app_updated', { how: 'button' });
            void reloadToVersion(newVersion);
          }}
          className="flex h-[42px] items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold text-[#2E1F5C] active:bg-[#F1EDFA]"
        >
          <RefreshCwIcon size={16} />
          새로 고침
        </button>
      </div>
    </div>
  );
}
