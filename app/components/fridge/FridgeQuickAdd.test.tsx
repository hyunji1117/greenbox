// app/components/fridge/FridgeQuickAdd.test.tsx

import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';
import FridgeQuickAdd from './FridgeQuickAdd';

const mutate = vi.hoisted(() => vi.fn());

vi.mock('@/app/lib/items/useItems', () => ({
  useCreateItem: () => ({
    mutate,
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useUpdateItem: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
}));
// 사진으로 찾기 화면은 PhotoAddSheet.test.tsx에서 따로 확인한다. 여기서는 넣은 뒤 알림만 보려고 onAdded만 잡아 둔다
const photoSheet = vi.hoisted(() => ({
  onAdded: undefined as
    | undefined
    | ((count: number, categories?: string[]) => void),
}));
vi.mock('./PhotoAddSheet', () => ({
  default: (props: {
    onAdded: (count: number, categories?: string[]) => void;
  }) => {
    photoSheet.onAdded = props.onAdded;
    return null;
  },
}));

const input = () => screen.getByLabelText('추가할 식재료 이름');
const submit = () => fireEvent.click(screen.getByLabelText('식재료 추가'));

describe('FridgeQuickAdd', () => {
  beforeEach(() => {
    mutate.mockReset();
  });
  afterEach(cleanup);

  it('비어 있을 때 카메라와 음성이 처음부터 보이고, 이름을 적으면 그 자리에 + (바로 추가)가 나온다', () => {
    render(<FridgeQuickAdd category="fridge" items={[]} />);
    expect(input().getAttribute('placeholder')).toBe('식재료 직접 추가');
    expect(screen.getByRole('button', { name: '사진으로 찾기' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '식재료 추가' })).toBeNull();

    fireEvent.change(input(), { target: { value: '오이' } });
    expect(screen.getByRole('button', { name: '식재료 추가' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '사진으로 찾기' })).toBeNull();
  });

  // 말한 글자를 차례로 들려준 뒤 끝내는 가짜 음성 인식 (말하는 도중 "오" → 끝에 "오이")
  const fakeRecognition = (transcripts: string[]) =>
    class FakeRecognition {
      lang = '';
      interimResults = false;
      continuous = false;
      maxAlternatives = 1;
      onresult: ((e: unknown) => void) | null = null;
      onerror = null;
      onend: (() => void) | null = null;
      start() {
        transcripts.forEach((transcript, index) =>
          setTimeout(
            () =>
              this.onresult?.({
                results: [Object.assign([{ transcript }], { isFinal: false })],
              }),
            150 * (index + 1),
          ),
        );
        setTimeout(() => this.onend?.(), 150 * (transcripts.length + 1));
      }
      stop() {}
      abort() {}
    };

  const speak = async (transcripts: string[]) => {
    vi.stubGlobal('webkitSpeechRecognition', fakeRecognition(transcripts));
    render(<FridgeQuickAdd category="fridge" items={[]} />);
    fireEvent.click(screen.getByRole('button', { name: '말로 넣기' }));
  };

  it('말하는 동안에는 등록할 수 없고, 다 들은 뒤 식재료 이름이면 입력창에 넣는다', async () => {
    await speak(['오', '오이.']);
    // 말하는 도중에는 + 가 등록 버튼이 되지 않는다
    await waitFor(() =>
      expect(screen.getByText(/듣고 있어요: ‘오’/)).toBeTruthy(),
    );
    expect(screen.queryByRole('button', { name: '식재료 추가' })).toBeNull();

    await waitFor(() =>
      expect((input() as HTMLInputElement).value).toBe('오이'),
    );
    expect(screen.getByRole('button', { name: '식재료 추가' })).toBeTruthy();
    expect(mutate).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('식재료가 아닌 말로 들리면 넣지 않고 다시 말할지 묻는다', async () => {
    await speak(['오']);
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        '‘오’는 식재료 이름이 아닌 것 같아요',
      ),
    );
    expect((input() as HTMLInputElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: '그대로 넣기' }));
    expect((input() as HTMLInputElement).value).toBe('오');
    vi.unstubAllGlobals();
  });

  it('한 글자 틀리게 들리면 아는 이름으로 고쳐 넣는다', async () => {
    await speak(['파프리가']);
    await waitFor(() =>
      expect((input() as HTMLInputElement).value).toBe('파프리카'),
    );
    expect(screen.getByText(/‘파프리가’를 ‘파프리카’/)).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it('선반 보기에서 "오이"라고 말하면 입력창을 거치지 않고 자리를 묻고, "3번"이라고 답하면 3번 선반에 넣는다', async () => {
    mutate.mockImplementation((_input, options) =>
      options.onSuccess({ id: '9' }),
    );
    // 처음 듣기는 이름, 두 번째 듣기(시트가 연 마이크)는 자리
    const turns = [['오이'], ['3번']];
    let turn = 0;
    const Base = fakeRecognition([]);
    class TurnRecognition extends Base {
      start() {
        const said = turns[turn] ?? [];
        turn += 1;
        said.forEach((transcript, index) =>
          setTimeout(
            () =>
              this.onresult?.({
                results: [Object.assign([{ transcript }], { isFinal: false })],
              }),
            100 * (index + 1),
          ),
        );
        setTimeout(() => this.onend?.(), 100 * (said.length + 1));
      }
    }
    vi.stubGlobal('webkitSpeechRecognition', TurnRecognition);
    render(
      <FridgeQuickAdd
        category="fridge"
        items={[]}
        placeCounts={{ fridge: 5, freezer: 3, pantry: 2 }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '말로 넣기' }));

    const dialog = await screen.findByRole('dialog', {
      name: '오이! 어디에 넣을까요?',
    });
    expect(dialog.textContent).toContain('들은 말');
    expect(dialog.textContent).toContain('예시');
    expect((input() as HTMLInputElement).value).toBe('');

    await waitFor(() =>
      expect(mutate.mock.calls[0]?.[0]).toMatchObject({
        name: '오이',
        shelf: 3,
      }),
    );
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

  it('선반 보기에서 자리가 정해지지 않았으면 저장 전에 어디에 넣을지 묻고, 고른 선반에 넣는다', () => {
    mutate.mockImplementation((_input, options) =>
      options.onSuccess({ id: '9' }),
    );
    render(
      <FridgeQuickAdd
        category="fridge"
        items={[]}
        placeCounts={{ fridge: 5, freezer: 3, pantry: 2 }}
      />,
    );
    fireEvent.change(input(), { target: { value: '오이' } });
    submit();
    // 아직 저장하지 않고 묻는다
    expect(mutate).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: '오이! 어디에 넣을까요?' }),
    ).toBeTruthy();
    expect(screen.getByText('냉장실 맨 아래 5번 선반')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '추천 자리에 넣기' }));
    expect(mutate.mock.calls[0][0]).toEqual({
      name: '오이',
      category: 'fridge',
      quantity: 1,
      shelf: 5,
    });
    expect(screen.getByRole('status').textContent).toContain(
      '냉장실 맨 아래 5번 선반에 넣었어요',
    );
  });

  it('자리를 묻는 시트를 닫으면 저장하지 않고, 선반을 직접 눌러 넣을 수도 있다', () => {
    render(
      <FridgeQuickAdd
        category="fridge"
        items={[]}
        placeCounts={{ fridge: 5, freezer: 3, pantry: 2 }}
      />,
    );
    fireEvent.change(input(), { target: { value: '우유' } });
    submit();
    fireEvent.click(screen.getAllByRole('button', { name: '닫기' })[0]);
    expect(mutate).not.toHaveBeenCalled();

    submit();
    fireEvent.click(screen.getByRole('radio', { name: '1번 선반, 0개' }));
    expect(mutate.mock.calls[0][0]).toMatchObject({ name: '우유', shelf: 1 });
  });

  it('같은 이름이 이미 있으면 "그 버섯이에요"로 새로 넣지 않고 있던 것을 확인한다', async () => {
    const mushroom = {
      id: '41',
      name: '버섯',
      category: 'fridge' as const,
      quantity: 1,
      eatenQuantity: 0,
      addedBy: { id: '7', name: '현지', isMember: true },
      addedAt: new Date(),
      comments: [],
      finished: false,
      expiryDate: '2026-11-30',
      watched: false,
      shelf: 5,
      autoPlaced: true,
      updatedAt: null,
      unit: null,
    };
    render(
      <FridgeQuickAdd
        category="fridge"
        items={[mushroom]}
        placeCounts={{ fridge: 5, freezer: 3, pantry: 2 }}
      />,
    );
    fireEvent.change(input(), { target: { value: '버섯' } });
    submit();
    fireEvent.click(screen.getByRole('button', { name: '그 버섯이에요' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        '냉장고에 있던 버섯을 확인했어요 (냉장실 맨 아래 5번 선반)',
      ),
    );
    expect(mutate).not.toHaveBeenCalled();
    expect((input() as HTMLInputElement).value).toBe('');
  });

  it('선반을 열고 넣을 때는 자리를 다시 묻지 않는다', () => {
    render(
      <FridgeQuickAdd
        category="fridge"
        items={[]}
        shelf={2}
        placeCounts={{ fridge: 5, freezer: 3, pantry: 2 }}
      />,
    );
    fireEvent.change(input(), { target: { value: '우유' } });
    submit();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(mutate.mock.calls[0][0]).toMatchObject({ name: '우유', shelf: 2 });
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

  it('넣은 냉장고와 칸을 알림 문구에 함께 보여 준다', () => {
    mutate.mockImplementation((_input, options) =>
      options.onSuccess({ id: '10' }),
    );
    render(
      <FridgeQuickAdd category="freezer" items={[]} fridgeName="기흥 냉장고" />,
    );
    fireEvent.change(input(), { target: { value: '새우' } });
    submit();
    expect(screen.getByRole('status').textContent).toContain(
      '기흥 냉장고 냉동실에 넣었어요',
    );
  });

  it('사진으로 넣은 품목이 모두 다른 칸이면 그 칸을 보여 달라고 알린다', () => {
    const onShowCategory = vi.fn();
    render(
      <FridgeQuickAdd
        category="fridge"
        items={[]}
        fridgeName="기흥 냉장고"
        onShowCategory={onShowCategory}
      />,
    );
    act(() => photoSheet.onAdded?.(1, ['freezer']));
    expect(onShowCategory).toHaveBeenCalledWith(
      'freezer',
      expect.stringContaining('기흥 냉장고 냉동실에 1개를 넣었어요'),
    );
  });

  it('사진으로 넣은 품목이 지금 칸에도 있으면 칸을 바꾸지 않고 여기서 알린다', () => {
    const onShowCategory = vi.fn();
    render(
      <FridgeQuickAdd
        category="fridge"
        items={[]}
        fridgeName="기흥 냉장고"
        onShowCategory={onShowCategory}
      />,
    );
    act(() => photoSheet.onAdded?.(2, ['fridge', 'freezer']));
    expect(onShowCategory).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toContain(
      '기흥 냉장고에 냉장실 1개, 냉동실 1개를 넣었어요',
    );
  });
});
