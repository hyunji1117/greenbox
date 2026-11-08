// app/components/fridge/FridgeItemSearch.test.tsx

import React, { useState } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FridgeItemSearch, { findItems, JUMP_DELAY_MS } from './FridgeItemSearch';

const items = [
  { id: '1', name: '우유', category: 'fridge' as const },
  { id: '2', name: '방울토마토', category: 'fridge' as const },
  { id: '3', name: '냉동 우유 아이스크림', category: 'freezer' as const },
];

// 실제 화면처럼 찾는 글자를 바깥에서 들고 있는 감싸개
function Harness({
  onJump,
  onAddToList,
}: {
  onJump: (item: (typeof items)[number]) => void;
  onAddToList?: (name: string) => void;
}) {
  const [query, setQuery] = useState('');
  return (
    <FridgeItemSearch
      items={items}
      query={query}
      onQueryChange={setQuery}
      onJump={onJump}
      jumpedId={null}
      onAddToList={onAddToList}
    />
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('findItems', () => {
  it('띄어쓰기를 무시하고, 이름이 같거나 앞부분이 같은 품목을 먼저 준다', () => {
    expect(findItems(items, '방울 토마토').map(i => i.id)).toEqual(['2']);
    expect(findItems(items, '우유').map(i => i.id)).toEqual(['1', '3']);
    expect(findItems(items, '  ')).toEqual([]);
  });
});

describe('FridgeItemSearch', () => {
  it('찾은 첫 품목으로 잠깐 뒤에 옮겨 가고, 다른 칸 품목은 골라서 옮겨 간다', () => {
    vi.useFakeTimers();
    const onJump = vi.fn();
    render(<Harness onJump={onJump} />);

    fireEvent.change(
      screen.getByRole('searchbox', { name: '냉장고에서 품목 찾기' }),
      {
        target: { value: '우유' },
      },
    );
    expect(onJump).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(JUMP_DELAY_MS));
    expect(onJump).toHaveBeenCalledWith(items[0]);

    fireEvent.click(
      screen.getByRole('button', { name: /냉동 우유 아이스크림/ }),
    );
    expect(onJump).toHaveBeenLastCalledWith(items[2]);
  });

  it('냉장고에 없는 품목이면 장볼 리스트에 담을지 묻는다', () => {
    const onAddToList = vi.fn();
    render(<Harness onJump={vi.fn()} onAddToList={onAddToList} />);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '수박' },
    });
    expect(screen.getByRole('status').textContent).toContain(
      '냉장고에 ‘수박’이 없어요. 장볼 리스트에 담을까요?',
    );
    fireEvent.click(screen.getByRole('button', { name: '장볼 리스트에 담기' }));
    expect(onAddToList).toHaveBeenCalledWith('수박');
  });

  it('음성 인식을 지원하면 입력창 대신 누르면 듣는 음성 바를 보인다', () => {
    vi.stubGlobal('webkitSpeechRecognition', class {});
    render(<Harness onJump={vi.fn()} />);
    expect(screen.getByText('음성으로 재료를 찾아요')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: '말로 품목 찾기' }).textContent,
    ).toContain('음성으로 재료를 찾아요');
    expect(screen.getByRole('button', { name: '말로 품목 찾기' })).toBeTruthy();
    expect(screen.queryByRole('searchbox')).toBeNull();
    vi.unstubAllGlobals();
  });
});
