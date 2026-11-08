// app/components/fridge/FridgeItemSearch.test.tsx

import React, { useState } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FridgeItemSearch, { findItems, JUMP_DELAY_MS } from './FridgeItemSearch';

const items = [
  { id: '1', name: '우유', category: 'fridge' as const },
  { id: '2', name: '방울토마토', category: 'fridge' as const },
  { id: '3', name: '냉동 우유 아이스크림', category: 'freezer' as const },
  { id: '4', name: '달걀', category: 'fridge' as const },
];

// 실제 화면처럼 찾는 글자를 바깥에서 들고 있는 감싸개
function Harness({
  onJump,
  onAddToList,
  onShowMany,
}: {
  onJump: (item: (typeof items)[number]) => void;
  onAddToList?: (name: string) => void;
  onShowMany?: (list: (typeof items)[number][], query: string) => void;
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
      onShowMany={onShowMany}
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
  it('하나만 찾으면 그 카드로 옮겨 가고, 여러 개면 찾은 품목을 모아 보여 준다', () => {
    vi.useFakeTimers();
    const onJump = vi.fn();
    const onShowMany = vi.fn();
    render(<Harness onJump={onJump} onShowMany={onShowMany} />);
    const box = screen.getByRole('searchbox', { name: '냉장고에서 품목 찾기' });

    fireEvent.change(box, { target: { value: '방울토마토' } });
    act(() => vi.advanceTimersByTime(JUMP_DELAY_MS));
    expect(onJump).toHaveBeenCalledWith(items[1]);

    fireEvent.change(box, { target: { value: '우유' } });
    act(() => vi.advanceTimersByTime(JUMP_DELAY_MS));
    expect(onShowMany).toHaveBeenCalledWith([items[0], items[2]], '우유');
    expect(onJump).toHaveBeenCalledTimes(1);
  });

  it('계란이라고 해도 달걀만 있으면 달걀로 옮겨 간다', () => {
    vi.useFakeTimers();
    const onJump = vi.fn();
    render(<Harness onJump={onJump} />);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '계란' },
    });
    act(() => vi.advanceTimersByTime(JUMP_DELAY_MS));
    expect(onJump).toHaveBeenCalledWith(items[3]);
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

  // 말한 글자를 들려준 뒤 끝내는 가짜 음성 인식
  const fakeVoice = (transcript: string, stops: { count: number }) =>
    class FakeRecognition {
      onresult: ((e: unknown) => void) | null = null;
      onerror = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(
          () =>
            this.onresult?.({
              results: [Object.assign([{ transcript }], { isFinal: true })],
            }),
          20,
        );
      }
      stop() {
        stops.count += 1;
        this.onend?.();
      }
      abort() {}
    };

  it('음성으로 찾으면 카드로 옮겨 간 뒤 바로 음성을 끄고 바를 처음 상태로 돌린다', async () => {
    const stops = { count: 0 };
    vi.stubGlobal('webkitSpeechRecognition', fakeVoice('방울토마토', stops));
    const onJump = vi.fn();
    render(<Harness onJump={onJump} />);
    fireEvent.click(screen.getByRole('button', { name: '말로 품목 찾기' }));

    await waitFor(() => expect(onJump).toHaveBeenCalledWith(items[1]));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '말로 품목 찾기' }).textContent,
      ).toContain('음성으로 재료를 찾아요'),
    );
    expect(stops.count).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it('못 찾아도 한 번 듣고 끝나면 바를 처음 상태로 돌리고 없다는 안내만 남긴다', async () => {
    class EndingRecognition {
      onresult: ((e: unknown) => void) | null = null;
      onerror = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(
          () =>
            this.onresult?.({
              results: [
                Object.assign([{ transcript: '수박' }], { isFinal: true }),
              ],
            }),
          20,
        );
        setTimeout(() => this.onend?.(), 60);
      }
      stop() {
        this.onend?.();
      }
      abort() {}
    }
    vi.stubGlobal('webkitSpeechRecognition', EndingRecognition);
    render(<Harness onJump={vi.fn()} onAddToList={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '말로 품목 찾기' }));

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        '냉장고에 ‘수박’이 없어요',
      ),
    );
    expect(
      screen.getByRole('button', { name: '말로 품목 찾기' }).textContent,
    ).toContain('음성으로 재료를 찾아요');
    vi.unstubAllGlobals();
  });
});
