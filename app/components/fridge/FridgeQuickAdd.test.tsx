// app/components/fridge/FridgeQuickAdd.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';
import FridgeQuickAdd from './FridgeQuickAdd';

const mutate = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/items/useItems', () => ({
  useCreateItem: () => ({ mutate, isPending: false, isError: false }),
}));
// 사진으로 찾기 화면은 PhotoAddSheet.test.tsx에서 따로 확인한다
vi.mock('./PhotoAddSheet', () => ({ default: () => null }));

const input = () => screen.getByLabelText('추가할 식재료 이름');
const submit = () => fireEvent.click(screen.getByLabelText('식재료 추가'));

describe('FridgeQuickAdd', () => {
  beforeEach(() => {
    mutate.mockReset();
  });
  afterEach(cleanup);

  it('비어 있을 때 + 를 누르면 카메라와 음성을 펼치고, 이름을 적으면 + 가 바로 추가가 된다', () => {
    render(<FridgeQuickAdd category="fridge" items={[]} />);
    expect(input().getAttribute('placeholder')).toBe(
      '식재료 직접 입력 (예: 오이)',
    );

    const toggle = screen.getByRole('button', {
      name: '사진이나 음성으로 넣기',
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(
      screen
        .getByRole('button', { name: '사진, 음성 접기' })
        .getAttribute('aria-expanded'),
    ).toBe('true');
    expect(screen.getByRole('button', { name: '사진으로 찾기' })).toBeTruthy();

    // 버튼 밖을 누르면 다시 + 로 접는다
    fireEvent.pointerDown(document.body);
    expect(
      screen
        .getByRole('button', { name: '사진이나 음성으로 넣기' })
        .getAttribute('aria-expanded'),
    ).toBe('false');

    fireEvent.change(input(), { target: { value: '오이' } });
    expect(screen.getByRole('button', { name: '식재료 추가' })).toBeTruthy();
  });

  it('펼친 음성으로 말한 이름은 입력창에 넣어 확인 후 등록한다', () => {
    class FakeRecognition {
      lang = '';
      interimResults = false;
      continuous = false;
      maxAlternatives = 1;
      onresult: ((e: unknown) => void) | null = null;
      onerror = null;
      onend: (() => void) | null = null;
      start() {
        this.onresult?.({
          results: [
            Object.assign([{ transcript: '양파.' }], { isFinal: true }),
          ],
        });
      }
      stop() {}
      abort() {}
    }
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
    render(<FridgeQuickAdd category="fridge" items={[]} />);

    fireEvent.click(
      screen.getByRole('button', { name: '사진이나 음성으로 넣기' }),
    );
    fireEvent.click(screen.getByRole('button', { name: '말로 넣기' }));

    expect((input() as HTMLInputElement).value).toBe('양파');
    expect(mutate).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('이름을 다듬어 현재 칸에 수량 1로 추가하고 성공하면 입력을 비운다', () => {
    mutate.mockImplementation((_input, options) =>
      options.onSuccess({ id: '9' }),
    );
    const onAdded = vi.fn();
    render(<FridgeQuickAdd category="freezer" items={[]} onAdded={onAdded} />);

    fireEvent.change(input(), { target: { value: '  만두 ' } });
    submit();

    expect(mutate.mock.calls[0][0]).toEqual({
      name: '만두',
      category: 'freezer',
      quantity: 1,
    });
    expect(input()).toHaveProperty('value', '');
    expect(onAdded).toHaveBeenCalledWith('9');
    expect(document.activeElement).toBe(input());
  });

  it('실패하면 입력한 내용을 유지한다', () => {
    render(<FridgeQuickAdd category="fridge" items={[]} />);

    fireEvent.change(input(), { target: { value: '우유' } });
    submit();

    expect(input()).toHaveProperty('value', '우유');
  });

  it('공백만 입력하면 추가하지 않는다', () => {
    render(<FridgeQuickAdd category="fridge" items={[]} />);

    fireEvent.change(input(), { target: { value: '   ' } });
    fireEvent.submit(input());

    expect(mutate).not.toHaveBeenCalled();
  });

  it('입력창을 누르기 전에는 추천이 닫혀 있고 누르면 펼쳐진다', () => {
    const { container } = render(
      <FridgeQuickAdd category="fridge" items={[]} />,
    );
    // 추천 영역 (입력창 옆 카메라, 음성 펼침도 inert를 쓰므로 추천 영역만 고른다)
    const panel = () => container.querySelector('.min-h-0[inert]');

    expect(panel()).not.toBeNull();
    fireEvent.focus(input());
    expect(panel()).toBeNull();
  });

  it('전에 먹은 품목을 누르면 냉장고가 아니라 리스트로 보낸다', () => {
    const onRebuy = vi.fn();
    render(
      <FridgeQuickAdd
        category="fridge"
        items={[
          { name: '꽈리고추', category: 'fridge', finished: true } as Item,
        ]}
        alwaysShowSuggestions
        onRebuy={onRebuy}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '꽈리고추' }));

    expect(onRebuy).toHaveBeenCalledWith('꽈리고추');
    expect(mutate).not.toHaveBeenCalled();
  });

  it('제안을 누르면 해당 이름으로 바로 추가한다', () => {
    render(
      <FridgeQuickAdd category="pantry" items={[]} alwaysShowSuggestions />,
    );

    fireEvent.click(screen.getByRole('button', { name: '라면' }));

    expect(mutate.mock.calls[0][0]).toMatchObject({
      name: '라면',
      category: 'pantry',
    });
  });
});
