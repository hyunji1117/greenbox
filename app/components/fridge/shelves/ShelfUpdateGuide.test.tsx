// app/components/fridge/shelves/ShelfUpdateGuide.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/lib/analytics/gtag', () => ({ track: vi.fn() }));

import FridgeShelfView from './FridgeShelfView';
import { SHELF_GUIDE_COPY } from './ShelfUpdateGuide';

// 밀어서 닫기, 알림장 안내는 선반 보기 소개와 둘러보기가 끝난 뒤에 이어진다. 둘 다 본 상태에서 확인한다
beforeEach(() => {
  localStorage.setItem('greenbox_auto_place_prompt_seen_u1', '1');
  localStorage.setItem('greenbox_guide_shelf_tour_seen_u1', '1');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

const renderView = ({
  isOpen,
  blocked = false,
  onBoardClick = vi.fn(),
}: {
  isOpen: boolean;
  blocked?: boolean;
  onBoardClick?: () => void;
}) => {
  const onOpenChange = vi.fn();
  const view = (open: boolean) => (
    <FridgeShelfView
      items={[]}
      counts={{ fridge: 2, freezer: 2, pantry: 2 }}
      onOpenShelf={() => {}}
      onAddShelf={() => {}}
      onRemoveShelf={() => {}}
      isChanging={false}
      notice=""
      isOpen={open}
      onOpenChange={onOpenChange}
      doorContent={
        <button
          type="button"
          data-guide-target="door-notes"
          onClick={onBoardClick}
        >
          알림장
        </button>
      }
      guideUserId="u1"
      guidesBlocked={blocked}
    />
  );
  const result = render(view(isOpen));
  return {
    ...result,
    onOpenChange,
    rerenderOpen: (open: boolean) => result.rerender(view(open)),
  };
};

describe('ShelfUpdateGuide', () => {
  it('문이 닫혀 있으면 알림장 안내를 한 번만 보여 주고, 열어 보기는 알림장을 연다', () => {
    const onBoardClick = vi.fn();
    renderView({ isOpen: false, onBoardClick });
    const dialog = screen.getByRole('dialog', {
      name: SHELF_GUIDE_COPY.board.title,
    });
    // 설명은 한 줄에 한 문장씩
    expect(dialog.querySelectorAll('p > span.block')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: '열어 보기' }));
    expect(onBoardClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();

    cleanup();
    renderView({ isOpen: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('문을 열면 밀어서 닫기 안내가 뜨고, 문 닫아 보기는 문을 닫는다', () => {
    localStorage.setItem('greenbox_guide_shelf_board_seen_u1', '1');
    const { onOpenChange } = renderView({ isOpen: true });
    screen.getByRole('dialog', { name: SHELF_GUIDE_COPY.swipe.title });
    fireEvent.click(screen.getByRole('button', { name: '문 닫아 보기' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(localStorage.getItem('greenbox_guide_shelf_swipe_seen_u1')).toBe(
      '1',
    );
  });

  it('알림 첫 질문처럼 먼저 끝나야 하는 것이 있으면 안내를 미룬다', () => {
    renderView({ isOpen: false, blocked: true });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('알림장 안내를 닫고 문을 열면 다음 안내로 이어진다', () => {
    const { rerenderOpen } = renderView({ isOpen: false });
    fireEvent.click(screen.getByRole('button', { name: '시작하기' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    rerenderOpen(true);
    screen.getByRole('dialog', { name: SHELF_GUIDE_COPY.swipe.title });
  });

  it('소개나 둘러보기를 아직 안 봤으면 미룬다 (소개가 먼저 뜬다)', () => {
    localStorage.removeItem('greenbox_guide_shelf_tour_seen_u1');
    renderView({ isOpen: false });
    expect(
      screen.queryByRole('dialog', { name: SHELF_GUIDE_COPY.board.title }),
    ).toBeNull();
  });
});
