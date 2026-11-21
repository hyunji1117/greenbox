// app/components/settings/GuideTestCard.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GUIDE_PAGES, GUIDE_TEST_KEY } from '@/app/lib/testing/guideTest';
import GuideTestCard, { replayGuides } from './GuideTestCard';

describe('GuideTestCard', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('켜야 아래 메뉴의 탭 목록이 나오고, 안내가 없는 탭은 누를 수 없다', () => {
    render(<GuideTestCard />);
    expect(screen.queryByRole('button', { name: /탭 가이드 보기/ })).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: '가이드 테스트' }));
    expect(localStorage.getItem(GUIDE_TEST_KEY)).toBe('1');
    const tabs = screen.getAllByRole('button', { name: /탭 가이드 보기/ });
    expect(tabs.map(tab => tab.textContent?.split(' ')[0])).toEqual([
      '홈',
      '냉장고',
      '리스트',
      '통계',
      '마이',
    ]);
    const fridge = screen.getByRole('button', {
      name: /냉장고 탭 가이드 보기/,
    });
    expect((fridge as HTMLButtonElement).disabled).toBe(false);
    const home = screen.getByRole('button', { name: /홈 탭 가이드 보기/ });
    expect((home as HTMLButtonElement).disabled).toBe(true);
    expect(home.textContent).toContain('안내 없음');
  });

  it('탭을 고르면 그 탭 안내 기록만 지우고 그 탭을 새로 연다', () => {
    localStorage.setItem('greenbox_guide_members_count_seen_u1', '1');
    localStorage.setItem('greenbox_guide_fridge_switch_seen_u1', '1');
    localStorage.setItem('greenbox_owner_guide_seen_f1', '["2"]');
    localStorage.setItem('greenbox_guide_shelf_board_seen_u1', '1');
    localStorage.setItem('greenbox_guide_shelf_swipe_seen_u1', '1');
    localStorage.setItem('greenbox_internal_traffic', '1');
    const navigate = vi.fn();
    replayGuides(
      GUIDE_PAGES.filter(page => page.tab === 'fridge'),
      navigate,
    );
    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem('greenbox_internal_traffic')).toBe('1');
    expect(navigate).toHaveBeenCalledWith('/?tab=fridge');
  });
});
