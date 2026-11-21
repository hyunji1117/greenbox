// app/components/fridge/PhotoAddSheet.test.tsx

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/app/lib/api/apiFetch';
import PhotoAddSheet from './PhotoAddSheet';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  mutateAsync: vi.fn(),
}));

vi.mock('@/app/lib/api/apiFetch', async importOriginal => ({
  ...(await importOriginal<typeof import('@/app/lib/api/apiFetch')>()),
  apiFetch: mocks.apiFetch,
}));
vi.mock('@/app/lib/vision/resizeImage', () => ({
  prepareImage: async () => ({ base64: 'aGVsbG8=', mediaType: 'image/jpeg' }),
}));
vi.mock('@/app/lib/items/useItems', () => ({
  useAddPurchasedItems: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));

const photo = new File(['x'], 'fridge.jpg', { type: 'image/jpeg' });

function renderSheet(
  props: Partial<React.ComponentProps<typeof PhotoAddSheet>> = {},
) {
  const onAdded = vi.fn();
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <PhotoAddSheet
        file={photo}
        onClose={vi.fn()}
        onRetake={vi.fn()}
        onAdded={onAdded}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onAdded };
}

describe('PhotoAddSheet', () => {
  beforeEach(() => {
    mocks.apiFetch.mockReset();
    mocks.mutateAsync.mockReset();
  });
  afterEach(cleanup);

  it('찾은 후보를 모두 보여 주고, 틀린 것은 지우고 고친 내용 그대로 넣는다', async () => {
    mocks.apiFetch.mockResolvedValue({
      items: [
        { name: '우유', category: 'fridge', quantity: 1 },
        { name: '만두', category: 'freezer', quantity: 2 },
      ],
    });
    mocks.mutateAsync.mockResolvedValue([true]);
    const { onAdded } = renderSheet();

    expect(
      await screen.findByRole('button', { name: '2개 냉장고에 넣기' }),
    ).toBeTruthy();
    expect(mocks.apiFetch).toHaveBeenCalledTimes(1);

    // 만두는 지우고, 우유는 이름과 수량을 고친다
    fireEvent.click(screen.getByRole('button', { name: '만두 지우기' }));
    fireEvent.change(screen.getAllByLabelText('식재료 이름')[0], {
      target: { value: '저지방 우유' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: '저지방 우유 수량 늘리기' }),
    );
    fireEvent.click(screen.getByRole('button', { name: '1개 냉장고에 넣기' }));

    await waitFor(() =>
      expect(onAdded).toHaveBeenCalledWith(1, ['fridge'], []),
    );
    expect(mocks.mutateAsync).toHaveBeenCalledWith([
      { name: '저지방 우유', category: 'fridge', quantity: 2 },
    ]);
  });

  it('장보기에서 쓰면 보관 위치 없이 남긴 것만 리스트에 담고 냉장고에는 넣지 않는다', async () => {
    mocks.apiFetch.mockResolvedValue({
      items: [
        { name: '우유', category: 'fridge', quantity: 1 },
        { name: '만두', category: 'freezer', quantity: 2 },
      ],
    });
    const onPickToList = vi.fn();
    const { onAdded } = renderSheet({ onPickToList });

    fireEvent.click(await screen.findByRole('button', { name: '우유 지우기' }));
    expect(screen.queryByRole('radiogroup')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '1개 리스트에 담기' }));

    expect(onPickToList).toHaveBeenCalledWith([{ name: '만두', quantity: 2 }]);
    expect(onAdded).toHaveBeenCalledWith(1);
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('빠진 식재료는 맨 아래에서 직접 추가해 함께 넣는다', async () => {
    mocks.apiFetch.mockResolvedValue({
      items: [{ name: '우유', category: 'fridge', quantity: 1 }],
    });
    mocks.mutateAsync.mockResolvedValue([true, true]);
    renderSheet();
    fireEvent.change(await screen.findByLabelText('빠진 식재료 직접 추가'), {
      target: { value: '두부' },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));
    fireEvent.click(screen.getByRole('button', { name: '2개 냉장고에 넣기' }));
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith([
        { name: '우유', category: 'fridge', quantity: 1 },
        { name: '두부', category: 'fridge', quantity: 1 },
      ]),
    );
  });

  it('선반 보기면 줄마다 추천 자리를 채우고, 자리를 눌러 바꾼 자리로 넣는다', async () => {
    mocks.apiFetch.mockResolvedValue({
      items: [
        { name: '오이', category: 'fridge', quantity: 2 },
        { name: '만두', category: 'freezer', quantity: 1 },
      ],
    });
    mocks.mutateAsync.mockResolvedValue([true, true]);
    renderSheet({
      placeCounts: { fridge: 5, freezer: 3, pantry: 2 },
      items: [],
    });

    const cucumber = await screen.findByRole('button', {
      name: '오이 자리 바꾸기, 지금 냉장실 맨 아래 5번 선반',
    });
    fireEvent.click(cucumber);
    fireEvent.click(screen.getByRole('radio', { name: '2번 선반, 0개' }));
    expect(
      screen.getByRole('button', {
        name: '오이 자리 바꾸기, 지금 냉장실 2번 선반',
      }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '2개 냉장고에 넣기' }));
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith([
        { name: '오이', category: 'fridge', quantity: 2, shelf: 2 },
        { name: '만두', category: 'freezer', quantity: 1, shelf: 1 },
      ]),
    );
  });

  it('구매 완료로 열면 산 식재료를 바로 보여 주고, 넣은 장보기 항목을 알려 준다', async () => {
    mocks.mutateAsync.mockResolvedValue([true]);
    const onAdded = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PhotoAddSheet
          file={null}
          initial={[{ id: '31', name: '우유', quantity: 2 }]}
          onClose={vi.fn()}
          onAdded={onAdded}
          placeCounts={{ fridge: 5, freezer: 3, pantry: 2 }}
          items={[]}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('dialog', { name: '산 식재료 넣기' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '1개 냉장고에 넣기' }));
    await waitFor(() =>
      expect(onAdded).toHaveBeenCalledWith(1, ['fridge'], ['31']),
    );
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it('식재료를 못 찾으면 다시 찍기를 권한다', async () => {
    mocks.apiFetch.mockResolvedValue({ items: [] });
    renderSheet();
    expect(
      await screen.findByText(/식재료를 찾지 못했어요. 조금 더 가까이/),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: '다시 찍기' })).toBeTruthy();
  });

  it('기능이 꺼져 있으면 이름으로 등록하라고 안내한다', async () => {
    mocks.apiFetch.mockRejectedValue(
      new ApiError(503, '/api/items/recognize', null),
    );
    renderSheet();
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      '사진으로 찾기는 아직 준비 중이에요. 이름을 적어 등록해 주세요',
    );
  });
});
