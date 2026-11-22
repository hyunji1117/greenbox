// app/components/fridge/shelves/ShelfTour.tsx
// 선반 둘러보기 안내 6장 (2026-11-20, 2026-11-22 먹음은 알려 주기만). 장마다 "가이드" 표시와 큰 제목 한 줄. 상자는 글 길이에 맞춘다
// - 직접 해 보는 장: 다음 버튼 없이 깜빡이는 테두리를 누르면 실제 그 버튼이 눌린다
// - 알려 주기만 하는 장: 다음 버튼으로만 넘어간다 (다른 곳은 눌러도 아무 일이 없다)
// 1) 냉장고: 냉장실 1번 선반 "선반 선택해요" → 그 선반 목록으로
// 2) 입력창 "식재료 추가해요" → 입력창을 누르면 비켜 주고, 실제로 하나 넣으면 다음 장
// 3) 사진과 음성 묶음 "사진과 음성으로도 추가 가능해요" (다음)
// 4) 방금 넣은 식재료 이름 "이름을 누르면 다른 선반으로 옮길 수 있어요" (다음)
// 5) 방금 넣은 식재료 먹음 "다 먹으면 먹음 눌러요" (다음). 누르게 하지 않는다: 2장에서 넣은 것은 실제로 넣을 식재료라
//    먹음으로 만들면 되돌릴 생각만 남았다 (사용자 확인 2026-11-22). 되돌리기는 실제로 먹음을 누를 때 알림에서 본다
// 6) 아래 메뉴 통계 "다 먹은 음식은 통계에서 다시 꺼낼 수 있어요 😅" (시작하기)
// - 단위 바꾸기, 통계로 실제 이동하는 장은 뺐다: 단계가 많고 화면이 어두워졌다 밝아졌다 해 어지러웠다 (사용자 확인)
// - 장과 장 사이에는 화면을 계속 어둡게 두고 비추는 자리만 옮긴다 (깜빡이지 않게)
// - 비출 것이 없으면 그 장은 건너뛴다. 선반 보기 소개가 끝난 뒤에 시작하고, 끝나면 냉장고로 돌아가
//   밀어서 닫기, 알림장 안내가 이어진다

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

// 비출 것을 찾는 간격과 최대 기다림
const TARGET_POLL_MS = 50;
const TARGET_WAIT_MS = 1500;
// 찾은 뒤 움직임(알림, 시트가 올라오는 0.3초)이 끝나기를 기다리는 시간
const SETTLE_MS = 350;
import SpotlightGuide, {
  useIsGuideQueued,
} from '@/app/components/fridge/sharing/SpotlightGuide';
import { isIntroDone } from '@/app/lib/shelves/autoPlacePrompt';
import {
  finishShelfTour,
  setShelfTourStep,
  TOUR_LAST_STEP,
  TOUR_WAIT_ADD,
  useShelfTourStep,
  wantsShelfTour,
} from '@/app/lib/shelves/shelfTour';

// 그때그때 화면에서 찾는 비출 곳 (다른 화면 조각의 요소라 ref를 넘겨받기 어렵다)
const targetOf = (selector: string, root?: () => HTMLElement | null) => ({
  get current(): HTMLElement | null {
    const scope = root?.() ?? document;
    return scope.querySelector<HTMLElement>(selector);
  },
});

interface TourStep {
  selector: string;
  title: string;
  spotLabel: string;
  // 직접 눌러 보는 장 (다음 버튼 없음). 누르면 실제 그 버튼을 누른다
  tap?: boolean;
}

const LIST_STEPS: Record<number, TourStep> = {
  2: {
    selector: '[aria-label="추가할 식재료 이름"]',
    title: '식재료 추가해요',
    spotLabel: '식재료 이름 입력창',
    tap: true,
  },
  3: {
    // 사진과 음성 버튼을 감싼 칸을 한 상자로 비춘다 (따로 두 군데 비추면 흩어져 보였다)
    selector: '[data-tour="add-tools"]',
    title: '사진과 음성으로도 추가 가능해요',
    spotLabel: '사진으로 찾기와 말로 넣기 버튼',
  },
  4: {
    // 방금 넣은 식재료. 생소한 선반 옮기기만 알려 준다 (상세를 열지 않는다)
    selector: '[data-tour-new="true"] [data-tour="item-name"]',
    title: '이름을 누르면\n다른 선반으로 옮길 수 있어요',
    spotLabel: '방금 넣은 식재료 이름',
  },
  5: {
    selector: '[data-tour-new="true"] [data-tour="item-eat"]',
    title: '다 먹으면 먹음 눌러요',
    spotLabel: '방금 넣은 식재료 먹음',
  },
  6: {
    selector: '[data-nav-tab="stats"]',
    title: '다 먹은 음식은\n통계에서 다시 꺼낼 수 있어요 😅',
    spotLabel: '아래 메뉴의 통계',
  },
};

interface ShelfTourStartProps {
  userId: string | undefined;
  isOpen: boolean;
  // 예전 식재료 배치 안내나 알림 첫 질문이 떠 있으면 기다린다
  isBlocked: boolean;
  doorsRef: React.RefObject<HTMLElement | null>;
  onOpenDoors: () => void;
  onOpenFirstShelf: () => void;
}

// 1장: 냉장고 화면
export const ShelfTourStart: React.FC<ShelfTourStartProps> = ({
  userId,
  isOpen,
  isBlocked,
  doorsRef,
  onOpenDoors,
  onOpenFirstShelf,
}) => {
  const step = useShelfTourStep();
  const guideBusy = useIsGuideQueued();
  const firstShelf = useMemo(
    () => targetOf('[aria-label^="냉장실 1번 선반"]', () => doorsRef.current),
    [doorsRef],
  );

  useEffect(() => {
    if (step !== null || !userId || isBlocked || guideBusy) return;
    // 선반 보기 소개("이제 냉장고를 한눈에 봐요!")가 끝난 뒤에 시작한다
    if (!isIntroDone(userId)) return;
    if (!wantsShelfTour(userId)) return;
    if (!isOpen) onOpenDoors();
    setShelfTourStep(1);
  }, [step, userId, isBlocked, guideBusy, isOpen, onOpenDoors]);

  if (step !== 1 || !isOpen) return null;
  return (
    <SpotlightGuide
      guide="shelf_tour"
      target={firstShelf}
      title="선반 선택해요"
      spotLabel="냉장실 1번 선반 열기"
      tapSpotOnly
      badge="가이드"
      onClose={() => {
        setShelfTourStep(2);
        onOpenFirstShelf();
      }}
    />
  );
};

// 비출 것을 찾고, 없으면 그 장을 건너뛰고, 있으면 안내를 띄우는 공통 부분
const TourStepGuide: React.FC<{
  step: number;
  current: TourStep;
  selector: string;
  userId: string | undefined;
  onTap?: (target: HTMLElement) => void;
  // 마지막 장에서 시작하기를 눌렀을 때 (냉장고로 돌아가 밀어서 닫기, 알림장 안내로 이어진다)
  onFinish?: () => void;
}> = ({ step, current, selector, userId, onTap, onFinish }) => {
  const target = useMemo(() => targetOf(selector), [selector]);
  // 기다리는 장 번호(20)가 마지막 장 번호보다 커서 크기로 비교하지 않는다
  const isLast = step === TOUR_LAST_STEP;
  // 비출 것이 화면에 나타날 때까지 잠깐 기다린다 (막 나타나 움직이는 알림 등).
  // 나타난 뒤에 안내를 그려야 비출 자리를 잴 수 있다. 어느 장까지 준비됐는지 장 번호로 기억한다
  const [readyStep, setReadyStep] = useState<number | null>(null);
  const ready = readyStep === step;
  useEffect(() => {
    let waited = 0;
    let settle = 0;
    const timer = window.setInterval(() => {
      if (document.querySelector(selector)) {
        window.clearInterval(timer);
        // 막 나타난 것은 아직 움직이는 중이다 (아래에서 올라오는 알림과 시트). 자리를 잡은 뒤에 비춘다
        settle = window.setTimeout(() => setReadyStep(step), SETTLE_MS);
        return;
      }
      waited += TARGET_POLL_MS;
      if (waited < TARGET_WAIT_MS) return;
      // 끝내 없으면 그 장은 건너뛴다
      window.clearInterval(timer);
      if (isLast) finishShelfTour(userId);
      else setShelfTourStep(step + 1);
    }, TARGET_POLL_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(settle);
    };
  }, [step, selector, isLast, userId]);

  // 기다리는 동안에도 화면을 같은 어둡기로 덮어 둔다 (장 사이에 밝아졌다 어두워지는 깜빡임이 없게)
  if (!ready) {
    return createPortal(
      <div
        aria-hidden
        className="fixed inset-0 z-[60] bg-[rgba(17,12,34,0.55)]"
      />,
      document.body,
    );
  }
  return (
    <SpotlightGuide
      // 장마다 새로 그려 비출 곳과 상자 위치를 다시 잰다
      key={step}
      guide="shelf_tour"
      target={target}
      title={current.title}
      spotLabel={current.spotLabel}
      tapSpotOnly={current.tap}
      badge="가이드"
      // 장 사이에 어둡게 덮어 둔 화면에서 이어지므로 서서히 나타나는 효과 없이 바로 바꾼다
      fadeIn={false}
      closeLabel={isLast ? '시작하기' : '다음'}
      onClose={() => {
        const element = target.current;
        if (current.tap && element && onTap) {
          onTap(element);
          return;
        }
        if (isLast) {
          finishShelfTour(userId);
          onFinish?.();
        } else setShelfTourStep(step + 1);
      }}
    />
  );
};

// 2~6장: 선반 목록
export const ShelfTourList: React.FC<{
  userId: string | undefined;
  onFinish?: () => void;
}> = ({ userId, onFinish }) => {
  const step = useShelfTourStep();
  const current = step !== null ? LIST_STEPS[step] : undefined;
  if (!current || step === null) return null;
  return (
    <TourStepGuide
      step={step}
      current={current}
      selector={current.selector}
      userId={userId}
      onFinish={onFinish}
      onTap={element => {
        if (step === 2) {
          // 입력창을 눌렀으면 비켜 주고, 하나 넣을 때까지 기다린다 (FridgeQuickAdd가 알려 준다)
          setShelfTourStep(TOUR_WAIT_ADD);
          (element as HTMLInputElement).focus();
          return;
        }
        // 실제 그 버튼을 누른다
        setShelfTourStep(step + 1);
        element.click();
      }}
    />
  );
};
