// app/components/fridge/shelves/ItemDetailSheet.test.tsx

import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  mutate: vi.fn(),
  deleteMutate: vi.fn(),
}));
vi.mock('@/app/lib/items/useItems', () => ({
  useUpdateItem: () => ({
    mutateAsync: mocks.mutateAsync,
    mutate: mocks.mutate,
    isPending: false,
  }),
  useDeleteItem: () => ({ mutate: mocks.deleteMutate, isPending: false }),
}));
vi.mock('@/app/lib/analytics/gtag', () => ({ track: vi.fn() }));

import ItemDetailSheet from './ItemDetailSheet';

const tofu = {
  id: '5',
  name: '두부',
  category: 'fridge' as const,
  quantity: 1,
  eatenQuantity: 0,
  addedBy: { id: '7', name: '현지', isMember: true },
  addedAt: new Date(),
  comments: [],
  finished: false,
  expiryDate: '2026-11-30',
  watched: false,
  shelf: 4,
  updatedAt: null,
  unit: null,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ItemDetailSheet 선반 옮기기', () => {
  it('선반을 누르면 바로 옮기지 않고, 지금 → 옮길 자리를 보여 준 뒤 버튼으로 옮긴다', async () => {
    mocks.mutateAsync.mockResolvedValue({});
    render(
      <ItemDetailSheet
        item={tofu}
        counts={{ fridge: 5, freezer: 3, pantry: 2 }}
        items={[tofu]}
        onClose={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole('radio', { name: '냉장실 2번 선반, 0개' }),
    );
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(
      screen.getByRole('radio', { name: '냉장실 4번 선반, 지금 여기' }),
    ).toBeTruthy();

    // 지금 자리를 다시 누르면 고른 것이 지워진다
    fireEvent.click(
      screen.getByRole('radio', { name: '냉장실 4번 선반, 지금 여기' }),
    );
    expect(screen.queryByRole('button', { name: /번으로 옮기기/ })).toBeNull();

    fireEvent.click(
      screen.getByRole('radio', { name: '냉장실 2번 선반, 0개' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: '냉장실 4번 → 2번으로 옮기기' }),
    );
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        id: '5',
        updates: { shelf: 2 },
      }),
    );
  });

  it('냉동실이나 상온 선반으로도 옮길 수 있다 (칸과 선반을 함께 바꾼다)', async () => {
    mocks.mutateAsync.mockResolvedValue({});
    render(
      <ItemDetailSheet
        item={tofu}
        counts={{ fridge: 5, freezer: 3, pantry: 2 }}
        items={[tofu]}
        onClose={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole('radio', { name: '냉동실 1번 선반, 0개' }),
    );
    expect(
      screen.getByRole('radio', { name: '냉장실 4번 선반, 지금 여기' }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', {
        name: '냉장실 4번 → 냉동실 1번으로 옮기기',
      }),
    );
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        id: '5',
        updates: { category: 'freezer', shelf: 1 },
      }),
    );
  });

  it('앱이 놓은 식재료는 "○○! 여기 둘까요?"로 자리 확정부터 묻고, 확정 전에는 수량과 유통기한을 보여 주지 않는다', async () => {
    mocks.mutateAsync.mockResolvedValue({});
    render(
      <ItemDetailSheet
        item={{ ...tofu, autoPlaced: true }}
        counts={{ fridge: 5, freezer: 3, pantry: 2 }}
        items={[tofu]}
        onClose={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('dialog', { name: '두부! 여기 둘까요?' }),
    ).toBeTruthy();
    expect(screen.queryByText('총수량')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '여기 둘게요' }));
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        id: '5',
        updates: { shelf: 4 },
      }),
    );
  });

  it('제목의 이름을 누르면 고칠 수 있고, 저장하면 앞뒤 공백을 지운 이름으로 바꾼다', () => {
    render(
      <ItemDetailSheet
        item={tofu}
        counts={{ fridge: 5, freezer: 3, pantry: 2 }}
        items={[tofu]}
        onClose={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '두부, 이름 고치기' }));
    const input = screen.getByRole('textbox', { name: '식재료 이름' });
    fireEvent.change(input, { target: { value: '  연두부 ' } });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { id: '5', updates: { name: '연두부' } },
      expect.anything(),
    );
    expect(screen.queryByRole('textbox', { name: '식재료 이름' })).toBeNull();
  });

  it('빈 이름은 저장하지 않고, 바깥을 누르면 고치기를 그만둔다', () => {
    render(
      <ItemDetailSheet
        item={tofu}
        counts={{ fridge: 5, freezer: 3, pantry: 2 }}
        items={[tofu]}
        onClose={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '두부, 이름 고치기' }));
    const input = screen.getByRole('textbox', { name: '식재료 이름' });
    fireEvent.change(input, { target: { value: '   ' } });
    expect(
      (screen.getByRole('button', { name: '저장' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.blur(input);
    expect(screen.queryByRole('textbox', { name: '식재료 이름' })).toBeNull();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('버림과 잘못 넣었어요를 나누고, 잘못 넣었어요는 한 번 더 물은 뒤 지운다', () => {
    const onDiscard = vi.fn();
    const onClose = vi.fn();
    mocks.deleteMutate.mockImplementation((_id, options) =>
      options?.onSuccess?.(),
    );
    render(
      <ItemDetailSheet
        item={tofu}
        counts={{ fridge: 5, freezer: 3, pantry: 2 }}
        items={[tofu]}
        onClose={onClose}
        onDiscard={onDiscard}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '잘못 넣었어요' }));
    expect(mocks.deleteMutate).not.toHaveBeenCalled();
    expect(screen.getByText('두부를 지울까요?')).toBeTruthy();
    // 취소하면 다시 두 버튼으로
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.getByRole('button', { name: '버림' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '잘못 넣었어요' }));
    fireEvent.click(screen.getByRole('button', { name: '지우기' }));
    expect(mocks.deleteMutate).toHaveBeenCalledWith('5', expect.anything());
    expect(onClose).toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('자리 확정 화면에서도 버렸어요와 잘못 넣었어요를 고를 수 있다', () => {
    const onDiscard = vi.fn();
    render(
      <ItemDetailSheet
        item={{ ...tofu, autoPlaced: true }}
        counts={{ fridge: 5, freezer: 3, pantry: 2 }}
        items={[tofu]}
        onClose={vi.fn()}
        onDiscard={onDiscard}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '잘못 넣었어요' }));
    expect(screen.getByText('두부를 지울까요?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    fireEvent.click(screen.getByRole('button', { name: '버렸어요' }));
    expect(onDiscard).toHaveBeenCalledWith(
      expect.objectContaining({ id: '5' }),
    );
  });
});
