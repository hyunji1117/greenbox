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

  it('찾은 후보를 모두 고른 채로 보여 주고, 고친 내용 그대로 고른 것만 넣는다', async () => {
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

    // 만두는 빼고, 우유는 이름과 수량을 고친다
    fireEvent.click(screen.getByRole('button', { name: '만두 넣기 선택' }));
    fireEvent.change(screen.getAllByLabelText('식재료 이름')[0], {
      target: { value: '저지방 우유' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: '저지방 우유 수량 늘리기' }),
    );
    fireEvent.click(screen.getByRole('button', { name: '1개 냉장고에 넣기' }));

    await waitFor(() => expect(onAdded).toHaveBeenCalledWith(1));
    expect(mocks.mutateAsync).toHaveBeenCalledWith([
      { name: '저지방 우유', category: 'fridge', quantity: 2 },
    ]);
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
