'use client';
// app/components/fridge/shelves/AutoPlaceCheck.tsx
// 선반 보기 정식 전환: 예전 목록에서 넣은 식재료를 냉장고에 배치하는 안내 (2026-11-20)
// - 서버가 먼저 추천 자리에 넣어 두고(점선 테두리), 냉장고를 처음 열 때 화면 가운데에 세 장으로 알린다
//   장마다 큰 제목 한 줄만 둔다 (아래 작은 글씨는 첫눈에 들어오지 않아서, 사용자 확인 2026-11-20)
//   1) NEW "이제 냉장고를 한눈에 봐요!" → 다음
//   2) "예전에 넣은 식재료를 배치해 볼까요?" + 들어갈 식재료 이름 → 다음
//   3) "추천 위치를 보고, 식재료를 원하는 위치에 넣어 주세요" → 추천으로 넣기
// - "나중에"는 두지 않는다. 미루면 들어간 줄 모르고 같은 식재료를 또 넣게 된다 (사용자 확인 2026-11-20)
//   그래서 어떤 식재료가 들어가는지 이름으로 보여 주고, 다시 넣으려 할 때도 "이미 있어요"로 막는다 (PlaceSheet)
// - 안내가 뜨면 뒤에서 냉장고 문을 열어, 점선으로 들어간 모습을 바로 보게 한다
// - 자리 확정은 선반 목록의 각 카드에서 한다 ("추천 자리에 넣었어요 / 여기 둘게요 / 옮기기", ShelfItemCard)
// - 사람마다 한 번 띄운다 (기기별로 기억). 신규 고객은 소개 한 장, 예전 식재료가 있는 기존 사용자는 세 장
//   다른 안내(함께 보는 사람 등)가 끝난 뒤에 뜨고, 끝나면 선반 둘러보기 → 밀어서 닫기, 알림장 안내가 이어진다
// - 정식 적용 전 베타 동안에는 선반 보기 스위치를 켤 때마다 다시 띄운다 (app/lib/shelves/autoPlacePrompt.ts)

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGridIcon, PackageOpenIcon } from 'lucide-react';
import { useIsGuideQueued } from '@/app/components/fridge/sharing/SpotlightGuide';
import { track } from '@/app/lib/analytics/gtag';
import type { Item } from '@/app/lib/schemas/item';
import {
  readPromptState,
  savePromptDone,
} from '@/app/lib/shelves/autoPlacePrompt';

// 안내에 이름으로 보여 주는 식재료 수. 나머지는 "외 N개"
const NAMES_SHOWN = 12;

// lucide의 shelving-unit 아이콘 (지금 쓰는 lucide-react 0.544에는 없어 같은 모양을 그대로 옮겼다, ISC)
const ShelvingUnitIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 12V9a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
    <path d="M16 20v-3a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3" />
    <path d="M20 22V2" />
    <path d="M4 12h16" />
    <path d="M4 20h16" />
    <path d="M4 2v20" />
    <path d="M4 4h16" />
  </svg>
);

interface AutoPlaceCheckProps {
  // 소개는 사람마다 한 번
  userId: string;
  items: Item[];
  // 안내가 뜨면 뒤에서 냉장고 문을 연다
  onOpenDoors: () => void;
  // 안내가 떠 있는 동안 다른 선반 안내(알림장, 밀어서 닫기)를 미루기 위해 알린다
  onActiveChange?: (active: boolean) => void;
}

const AutoPlaceCheck: React.FC<AutoPlaceCheckProps> = ({
  userId,
  items,
  onOpenDoors,
  onActiveChange,
}) => {
  // 소개를 이미 봤는지, 베타를 다시 켜서 다시 띄워야 하는지. 서버가 그린 첫 화면과 맞추려고 화면이 붙은 뒤에 읽는다
  const [promptState, setPromptState] = useState<{
    seen: boolean;
    again: boolean;
  } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const guideBusy = useIsGuideQueued();
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setPromptState(readPromptState(userId));
  }, [userId]);

  const placed = items.filter(item => item.autoPlaced && !item.finished);
  // 신규 고객이든 기존 사용자든 아직 소개를 못 봤으면 띄운다
  const wanted =
    promptState !== null && (promptState.again || !promptState.seen);
  const show = wanted && !guideBusy;
  // 배치할 예전 식재료가 있을 때만(목록 보기를 쓰던 기존 사용자) 이름과 추천 위치 장을 보여 준다.
  // 없으면 소개 한 장만 보고 "다음"으로 선반 둘러보기에 이어진다
  const hasNames = placed.length > 0;
  const steps: (1 | 2 | 3)[] = hasNames ? [1, 2, 3] : [1];

  // 뜨는 순간 뒤에서 문을 연다 (움직임 줄이기 설정이면 문도 바로 열린다)
  const latest = useRef({ onOpenDoors, onActiveChange });
  useEffect(() => {
    latest.current = { onOpenDoors, onActiveChange };
  }, [onOpenDoors, onActiveChange]);
  useEffect(() => {
    latest.current.onActiveChange?.(show);
    if (show) latest.current.onOpenDoors();
  }, [show]);
  useEffect(() => {
    if (show) buttonRef.current?.focus();
  }, [show, step]);

  if (!show || typeof document === 'undefined') return null;

  const finish = () => {
    savePromptDone(userId);
    setPromptState({ seen: true, again: false });
    track('shelf_auto_prompt_done', { count: placed.length });
  };
  const isLast = step === steps[steps.length - 1];
  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setStep(steps[steps.indexOf(step) + 1]);
  };
  const names = placed.slice(0, NAMES_SHOWN).map(item => item.name);
  const rest = placed.length - names.length;

  return createPortal(
    // 화면 가운데 안내. 바깥을 눌러도 닫히지 않는다 (다른 안내와 같은 규칙). 뒤의 냉장고가 보이게 조금 옅게 가린다
    <div className="motion-safe:animate-tab-fade fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div aria-hidden className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auto-place-prompt-title"
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1EDFA] text-[#6B46C1]">
          {step === 1 ? (
            <ShelvingUnitIcon size={26} />
          ) : step === 2 ? (
            <PackageOpenIcon size={26} aria-hidden />
          ) : (
            <LayoutGridIcon size={26} aria-hidden />
          )}
        </span>
        {step === 1 ? (
          <>
            <p className="mt-3 flex justify-center">
              <span className="rounded-full bg-[#6B46C1] px-2 py-0.5 text-[11px] leading-none font-bold tracking-wide text-white">
                NEW
              </span>
            </p>
            <h2
              id="auto-place-prompt-title"
              className="mt-2 text-lg font-bold text-balance text-gray-900"
            >
              이제 냉장고를 한눈에 봐요!
            </h2>
          </>
        ) : step === 3 ? (
          <h2
            id="auto-place-prompt-title"
            className="mt-3 text-lg font-bold text-balance text-gray-900"
          >
            추천 위치를 보고,
            <br />
            식재료를 원하는 위치에 넣어 주세요
          </h2>
        ) : (
          <>
            <h2
              id="auto-place-prompt-title"
              className="mt-3 text-lg font-bold text-balance text-gray-900"
            >
              예전에 넣은 식재료를
              <br />
              배치해 볼까요?
            </h2>
            {/* 어떤 식재료가 들어가는지 이름으로 보여 준다 (들어간 줄 모르고 또 넣지 않게) */}
            <ul
              aria-label="배치할 식재료"
              className="mt-3 flex flex-wrap justify-center gap-1.5"
            >
              {names.map((name, index) => (
                <li
                  key={`${name}-${index}`}
                  className="rounded-full border-[1.5px] border-dashed border-[#6B46C1] px-2.5 py-0.5 text-xs font-medium text-[#553C9A]"
                >
                  {name}
                </li>
              ))}
              {rest > 0 && (
                <li className="px-1 py-0.5 text-xs text-gray-500">
                  외 {rest}개
                </li>
              )}
            </ul>
          </>
        )}
        {/* 몇 번째 장인지 */}
        <div aria-hidden className="mt-4 flex justify-center gap-1.5">
          {steps.map(dot => (
            <span
              key={dot}
              className={`h-1.5 rounded-full transition-all ${
                step === dot ? 'w-4 bg-[#6B46C1]' : 'w-1.5 bg-[#DCD3F3]'
              }`}
            />
          ))}
        </div>
        <button
          ref={buttonRef}
          type="button"
          onClick={next}
          className="mt-4 h-12 w-full rounded-xl bg-[#6B46C1] text-sm font-semibold text-white"
        >
          {isLast && hasNames ? '추천으로 넣기' : '다음'}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default AutoPlaceCheck;
