// app/components/fridge/sharing/FridgeHeader.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FridgeHeader from './FridgeHeader';

const fridgeState = vi.hoisted(() => ({ data: undefined as unknown }));
vi.mock('@/app/lib/fridges/useCurrentFridge', () => ({
  useCurrentFridge: () => ({ data: fridgeState.data }),
}));
const goToTab = vi.hoisted(() => vi.fn());
vi.mock('@/app/lib/navigation/tabs', () => ({ goToTab }));
// 냉장고 바꾸기 시트는 따로 확인한다
vi.mock('@/app/components/fridge/sharing/FridgeSwitcherSheet', () => ({
  default: () => null,
}));

const fridge = {
  id: '1',
  name: '내 냉장고',
  hasCustomName: false,
  role: 'owner',
  myNotifyLevel: 'watched',
  myUserId: '7',
  members: [{ userId: '7', name: '현지', image: null, role: 'owner' }],
  pendingRequestCount: 1,
  fridgeCount: 1,
};

describe('FridgeHeader', () => {
  beforeEach(() => {
    localStorage.clear();
    goToTab.mockReset();
    fridgeState.data = fridge;
  });
  afterEach(cleanup);

  it('사람 수는 누를 수 없는 보기 전용 칸이고, 오른쪽 끝에 받은 버튼을 둔다', () => {
    localStorage.setItem('greenbox_guide_members_count_seen_7', '1');
    render(<FridgeHeader trailing={<button type="button">문 닫기</button>} />);
    const count = screen.getByRole('status', {
      name: '이 냉장고를 보는 사람 1명',
    });
    expect(count.tagName).toBe('DIV');
    expect(screen.queryByRole('button', { name: /함께 보는 사람/ })).toBeNull();
    expect(screen.getByRole('button', { name: '문 닫기' })).toBeTruthy();
  });

  it('처음 들어오면 사람 수 안내를 한 번 보이고, 마이로 가기를 누르면 마이로 간다', () => {
    const { unmount } = render(<FridgeHeader />);
    expect(screen.getByRole('dialog').textContent).toContain(
      '가족 초대는 하단 마이에서 할 수 있어요',
    );
    fireEvent.click(screen.getByRole('button', { name: '마이로 가기' }));
    expect(goToTab).toHaveBeenCalledWith('settings');
    expect(screen.queryByRole('dialog')).toBeNull();

    unmount();
    render(<FridgeHeader />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('알림 첫 질문에 답하기 전에는 안내를 기다린다', () => {
    fridgeState.data = { ...fridge, myNotifyLevel: null };
    render(<FridgeHeader />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
