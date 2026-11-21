// app/components/fridge/shelves/AutoPlaceCheck.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';

const track = vi.hoisted(() => vi.fn());
vi.mock('@/app/lib/analytics/gtag', () => ({ track }));

import AutoPlaceCheck from './AutoPlaceCheck';
import {
  isIntroDone,
  requestPromptAgain,
} from '@/app/lib/shelves/autoPlacePrompt';

const item = (id: string, name: string, autoPlaced: boolean): Item => ({
  id,
  name,
  category: 'fridge',
  quantity: 1,
  eatenQuantity: 0,
  addedBy: { id: '7', name: '현지', isMember: true },
  addedAt: new Date(),
  comments: [],
  finished: false,
  expiryDate: '2026-11-30',
  watched: false,
  shelf: 2,
  autoPlaced,
  updatedAt: null,
  unit: null,
});

const items = [
  item('1', '버섯', true),
  item('2', '두부', true),
  item('3', '우유', false),
];

describe('AutoPlaceCheck (선반 보기 소개)', () => {
  beforeEach(() => {
    localStorage.clear();
    track.mockReset();
  });
  afterEach(cleanup);

  it('기존 사용자: 소개 → 예전 식재료 이름 → 추천 위치, 뜨면 뒤에서 문을 연다 (나중에 없음)', async () => {
    const onOpenDoors = vi.fn();
    const onActiveChange = vi.fn();
    render(
      <AutoPlaceCheck
        userId="u1"
        items={items}
        onOpenDoors={onOpenDoors}
        onActiveChange={onActiveChange}
      />,
    );
    const first = await screen.findByRole('dialog', {
      name: '이제 냉장고를 한눈에 봐요!',
    });
    expect(first.textContent).toContain('NEW');
    expect(onOpenDoors).toHaveBeenCalled();
    expect(onActiveChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole('button', { name: '나중에' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    const names = screen.getByRole('list', { name: '배치할 식재료' });
    expect(names.textContent).toContain('버섯');
    expect(names.textContent).toContain('두부');
    expect(names.textContent).not.toContain('우유');

    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.click(screen.getByRole('button', { name: '추천으로 넣기' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onActiveChange).toHaveBeenLastCalledWith(false);
    expect(isIntroDone('u1')).toBe(true);
    expect(track).toHaveBeenCalledWith('shelf_auto_prompt_done', { count: 2 });
  });

  it('신규 고객: 예전 식재료가 없으면 소개 한 장만 보고 다음으로 끝난다', async () => {
    render(
      <AutoPlaceCheck
        userId="u2"
        items={[item('3', '우유', false)]}
        onOpenDoors={vi.fn()}
      />,
    );
    await screen.findByRole('dialog', { name: '이제 냉장고를 한눈에 봐요!' });
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(isIntroDone('u2')).toBe(true);
  });

  it('사람마다 한 번만 띄우고, 베타를 다시 켜면 다시 띄운다', async () => {
    const { unmount } = render(
      <AutoPlaceCheck userId="u1" items={[]} onOpenDoors={vi.fn()} />,
    );
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    unmount();

    render(<AutoPlaceCheck userId="u1" items={[]} onOpenDoors={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    cleanup();

    requestPromptAgain();
    render(<AutoPlaceCheck userId="u1" items={[]} onOpenDoors={vi.fn()} />);
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('많으면 12개까지만 이름으로 보여 주고 나머지는 외 N개', async () => {
    const many = Array.from({ length: 15 }, (_, i) =>
      item(String(i), `식재료${i}`, true),
    );
    render(<AutoPlaceCheck userId="u1" items={many} onOpenDoors={vi.fn()} />);
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    const names = screen.getByRole('list', { name: '배치할 식재료' });
    expect(names.querySelectorAll('li')).toHaveLength(13);
    expect(names.textContent).toContain('외 3개');
  });
});
