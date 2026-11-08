// app/consent/RestartNotice.tsx
// 예전 버전 앱이 동의 화면 주소로 옮겨 왔을 때 보여 주는 안내 (이미 동의한 사람)
// 닫기 버튼이나 다른 화면으로 가는 길을 두지 않는다. 앱을 완전히 닫았다 다시 열면 첫 화면이 최신 버전으로 열린다

import { RefreshCwIcon } from 'lucide-react';

export default function RestartNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1B1430] px-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="restart-title"
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1EDFA] text-[#6B46C1]">
          <RefreshCwIcon size={24} aria-hidden />
        </span>
        <h1
          id="restart-title"
          className="mt-4 text-lg font-semibold text-gray-900"
        >
          새 버전이 나왔어요
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          앱을 완전히 닫았다가 다시 열어 주세요.
          <br />
          다시 열면 새 버전으로 이어서 쓸 수 있어요.
        </p>
        <p className="mt-4 rounded-xl bg-[#F8F6FD] px-3 py-2 text-xs leading-relaxed text-gray-500">
          아이폰: 화면 아래에서 위로 밀어 올려 앱을 닫아요
          <br />
          안드로이드: 최근 앱 버튼에서 위로 밀어 닫아요
        </p>
      </div>
    </main>
  );
}
