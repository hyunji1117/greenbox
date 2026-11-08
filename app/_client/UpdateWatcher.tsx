// app/_client/UpdateWatcher.tsx
// 새 버전을 배포하면 모든 사용자가 새 버전을 쓰게 한다 (설치한 앱은 닫지 않으면 예전 화면이 계속 남는다)
// - 앱을 다시 열거나 다른 앱에서 돌아올 때 새 버전이 있으면 묻지 않고 새로 받아 연다
// - 쓰는 도중에 새 버전이 나오면(3분마다 확인, 또는 서버가 예전 버전 요청을 거절하면) 화면 전체를 업데이트 안내로 덮는다
//   업데이트를 누르면 캐시를 지우고 새로 받아 다시 연다. 그래도 예전이면 앱을 완전히 닫았다 열도록 안내한다

'use client';

import { useEffect, useState } from 'react';
import { Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { track } from '@/app/lib/analytics/gtag';
import { UPDATE_REQUIRED_EVENT } from '@/app/lib/app/version';
import {
  alreadyReloadedFor,
  fetchDeployedVersion,
  isNewerDeployed,
  reloadToVersion,
} from '@/app/lib/app/updateCheck';

// 쓰는 동안에도 자주 확인한다
const CHECK_INTERVAL_MS = 3 * 60 * 1000;

export default function UpdateWatcher() {
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
    // 서버가 예전 버전 요청을 거절하면 기다리지 않고 바로 업데이트 화면을 띄운다
    const onUpdateRequired = async () => {
      const deployed = await fetchDeployedVersion();
      if (!cancelled) setNewVersion(deployed ?? '최신');
    };
    window.addEventListener(UPDATE_REQUIRED_EVENT, onUpdateRequired);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => void check(false), CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(UPDATE_REQUIRED_EVENT, onUpdateRequired);
      clearInterval(timer);
    };
  }, []);

  if (!newVersion) return null;
  // 이미 한 번 새로 받았는데도 예전 버전이면 캐시가 남은 것이라 앱을 완전히 닫았다 열어야 한다
  const needsRestart = alreadyReloadedFor(newVersion);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="update-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1B1430]/70 px-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1EDFA] text-[#6B46C1]">
          <RefreshCwIcon size={24} aria-hidden />
        </span>
        <h2
          id="update-title"
          className="mt-4 text-lg font-semibold text-gray-900"
        >
          새 버전이 나왔어요
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          {needsRestart
            ? '앱을 완전히 닫았다가 다시 열어 주세요. 다시 열면 새 버전으로 바뀌어요.'
            : '업데이트를 누르면 앱을 새로 받아 다시 열어요. 업데이트한 뒤에 계속 쓸 수 있어요.'}
        </p>
        <p className="mt-1 text-xs text-gray-400">새 버전 {newVersion}</p>
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => {
            setIsUpdating(true);
            track('app_updated', { how: 'button' });
            void reloadToVersion(newVersion);
          }}
          className="mt-5 flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-[#6B46C1] text-sm font-semibold text-white active:bg-[#553C9A] disabled:opacity-70"
        >
          {isUpdating ? (
            <Loader2Icon size={18} className="motion-safe:animate-spin" />
          ) : (
            <RefreshCwIcon size={18} />
          )}
          {needsRestart ? '다시 시도' : '업데이트'}
        </button>
      </div>
    </div>
  );
}
