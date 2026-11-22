// app/components/fridge/shelves/ShelfTour.test.tsx

import React, { useRef, useState } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/lib/analytics/gtag', () => ({ track: vi.fn() }));

import { resetGuideQueueForTest } from '@/app/components/fridge/sharing/SpotlightGuide';
import {
  requestShelfTourAgain,
  resetShelfTourForTest,
  setShelfTourStep,
  shelfTourItemAdded,
} from '@/app/lib/shelves/shelfTour';
import { ShelfTourList, ShelfTourStart } from './ShelfTour';

// 선반 보기 소개를 본 상태 (둘러보기는 소개가 끝난 뒤에 시작한다)
const seenShelfGuides = (userId: string) => {
  localStorage.setItem(`greenbox_auto_place_prompt_seen_${userId}`, '1');
};

const Start: React.FC<{
  isOpen?: boolean;
  isBlocked?: boolean;
  onOpenDoors?: () => void;
  onOpenFirstShelf?: () => void;
}> = ({
  isOpen = true,
  isBlocked = false,
  onOpenDoors = vi.fn(),
  onOpenFirstShelf = vi.fn(),
}) => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}>
      <button type="button" aria-label="냉장실 1번 선반, 0개">
        1
      </button>
      <ShelfTourStart
        userId="u1"
        isOpen={isOpen}
        isBlocked={isBlocked}
        doorsRef={ref}
        onOpenDoors={onOpenDoors}
        onOpenFirstShelf={onOpenFirstShelf}
      />
    </div>
  );
};

// 선반 목록에 있는 것들 (방금 넣은 식재료 카드가 있을 때)
const ListScreen: React.FC<{
  withItem?: boolean;
  onEat?: () => void;
  onStats?: () => void;
}> = ({ withItem = true, onEat = vi.fn(), onStats = vi.fn() }) => {
  const [eaten, setEaten] = useState(false);
  return (
    <>
      <input aria-label="추가할 식재료 이름" />
      <div data-tour="add-tools">
        <button type="button" aria-label="사진으로 찾기" />
        <button type="button" aria-label="말로 넣기" />
      </div>
      {withItem && !eaten && (
        <article data-tour-new="true" data-item-id="9">
          <button type="button" data-tour="item-name">
            두부
          </button>
          <button
            type="button"
            data-tour="item-eat"
            onClick={() => {
              setEaten(true);
              onEat();
            }}
          >
            먹음
          </button>
        </article>
      )}
      <button type="button" data-nav-tab="stats" onClick={onStats}>
        통계
      </button>
      <ShelfTourList userId="u1" />
    </>
  );
};

describe('선반 둘러보기', () => {
  beforeEach(() => {
    localStorage.clear();
    resetShelfTourForTest();
    resetGuideQueueForTest();
  });
  afterEach(() => {
    cleanup();
    resetGuideQueueForTest();
  });

  it('소개를 본 뒤 냉장실 1번 선반에 테두리를 두고, 선반을 직접 누르면 그 선반에 간다', () => {
    seenShelfGuides('u1');
    const onOpenFirstShelf = vi.fn();
    render(<Start onOpenFirstShelf={onOpenFirstShelf} />);
    const dialog = screen.getByRole('dialog', { name: '선반 선택해요' });
    // 상자에는 버튼이 없다. 비춘 선반을 직접 누른다
    expect(screen.queryByRole('button', { name: '다음' })).toBeNull();
    expect(screen.queryByRole('button', { name: '시작하기' })).toBeNull();
    fireEvent.click(
      within(dialog).getByRole('button', { name: '냉장실 1번 선반 열기' }),
    );
    expect(onOpenFirstShelf).toHaveBeenCalled();
  });

  it('소개를 아직 안 봤거나, 다른 안내가 떠 있으면 시작하지 않는다', () => {
    render(<Start />);
    expect(screen.queryByRole('dialog')).toBeNull();
    cleanup();
    seenShelfGuides('u1');
    render(<Start isBlocked />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('문이 닫혀 있으면 열고 시작한다', () => {
    seenShelfGuides('u1');
    const onOpenDoors = vi.fn();
    render(<Start isOpen={false} onOpenDoors={onOpenDoors} />);
    expect(onOpenDoors).toHaveBeenCalled();
  });

  it('6장: 직접 해 보는 장은 실제로 누르고, 알려 주는 장은 다음으로만 넘어가며 한 번만 본다', async () => {
    const onEat = vi.fn();
    const onStats = vi.fn();
    render(<ListScreen onEat={onEat} onStats={onStats} />);
    act(() => setShelfTourStep(2));

    // 2) 입력창을 직접 누르고, 하나 넣으면 다음 장
    const add = await screen.findByRole('dialog', { name: '식재료 추가해요' });
    expect(within(add).queryByRole('button', { name: '다음' })).toBeNull();
    fireEvent.click(
      within(add).getByRole('button', { name: '식재료 이름 입력창' }),
    );
    expect(document.activeElement).toBe(
      screen.getByLabelText('추가할 식재료 이름'),
    );
    act(() => shelfTourItemAdded());

    // 3) 사진과 음성: 비춘 곳을 눌러도 넘어가지 않고 다음으로만
    const tools = await screen.findByRole('dialog', {
      name: '사진과 음성으로도 추가 가능해요',
    });
    fireEvent.click(
      within(tools).getByRole('button', {
        name: '사진으로 찾기와 말로 넣기 버튼',
      }),
    );
    expect(
      screen.getByRole('dialog', { name: '사진과 음성으로도 추가 가능해요' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    // 4) 선반 옮기기는 알려 주기만 (상세를 열지 않는다)
    await screen.findByRole('dialog', {
      name: '이름을 누르면\n다른 선반으로 옮길 수 있어요',
    });
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    // 5) 먹음은 알려 주기만 한다. 2장에서 넣은 것은 실제로 넣을 식재료라 먹음으로 만들지 않는다
    const eat = await screen.findByRole('dialog', {
      name: '다 먹으면 먹음 눌러요',
    });
    fireEvent.click(
      within(eat).getByRole('button', { name: '방금 넣은 식재료 먹음' }),
    );
    expect(onEat).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    // 6) 통계는 비추며 알려 주기만 하고 끝 (통계로 옮겨 가지 않는다)
    await screen.findByRole('dialog', {
      name: '다 먹은 음식은\n통계에서 다시 꺼낼 수 있어요 😅',
    });
    fireEvent.click(screen.getByRole('button', { name: '시작하기' }));
    expect(onStats).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem('greenbox_guide_shelf_tour_seen_u1')).toBe('1');
  });

  it('장 사이에 비출 것을 기다리는 동안에도 화면을 어둡게 덮어 둔다', () => {
    render(<ListScreen />);
    act(() => setShelfTourStep(3));
    // 아직 안내가 뜨기 전 (비출 곳이 자리를 잡기를 기다리는 중)
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.querySelector('.fixed.inset-0')).not.toBeNull();
  });

  it('안내 제목 앞에 가이드 표시를 붙인다', async () => {
    render(<ListScreen />);
    act(() => setShelfTourStep(3));
    expect((await screen.findByRole('dialog')).textContent).toContain(
      '가이드사진과 음성으로도 추가 가능해요',
    );
  });

  it('비출 것이 없으면 그 장은 건너뛴다 (방금 넣은 식재료가 없을 때)', async () => {
    render(<ListScreen withItem={false} />);
    act(() => setShelfTourStep(4));
    expect(
      await screen.findByRole(
        'dialog',
        { name: '다 먹은 음식은\n통계에서 다시 꺼낼 수 있어요 😅' },
        { timeout: 5000 },
      ),
    ).toBeTruthy();
  });

  it('본 뒤에도 베타를 다시 켜면 다시 시작한다', () => {
    seenShelfGuides('u1');
    localStorage.setItem('greenbox_guide_shelf_tour_seen_u1', '1');
    render(<Start />);
    expect(screen.queryByRole('dialog')).toBeNull();
    cleanup();
    requestShelfTourAgain();
    render(<Start />);
    screen.getByRole('dialog', { name: '선반 선택해요' });
  });
});
