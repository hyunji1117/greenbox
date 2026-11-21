import { describe, expect, it } from 'vitest';
import { parsePlaceAnswer, typingFrames } from './placeAnswer';

const ask = (spoken: string) => parsePlaceAnswer(spoken, 'fridge', 5, 4);

describe('parsePlaceAnswer', () => {
  it('추천을 받는 말은 추천 선반', () => {
    expect(ask('추천대로')).toEqual({ kind: 'shelf', shelf: 4 });
    expect(ask('그대로 넣어 줘')).toEqual({ kind: 'shelf', shelf: 4 });
    expect(ask('네')).toEqual({ kind: 'shelf', shelf: 4 });
  });

  it('번호는 숫자, 한자어, 고유어 서수 모두 받는다', () => {
    expect(ask('3번')).toEqual({ kind: 'shelf', shelf: 3 });
    expect(ask('냉장실 2번 선반')).toEqual({ kind: 'shelf', shelf: 2 });
    expect(ask('삼 번')).toEqual({ kind: 'shelf', shelf: 3 });
    expect(ask('오층')).toEqual({ kind: 'shelf', shelf: 5 });
    expect(ask('세 번째 칸')).toEqual({ kind: 'shelf', shelf: 3 });
    expect(ask('첫째')).toEqual({ kind: 'shelf', shelf: 1 });
  });

  it('위치로도 받는다', () => {
    expect(ask('맨 위')).toEqual({ kind: 'shelf', shelf: 1 });
    expect(ask('제일 아래')).toEqual({ kind: 'shelf', shelf: 5 });
    expect(ask('가운데')).toEqual({ kind: 'shelf', shelf: 3 });
  });

  it('없는 선반이나 알아듣지 못한 말은 고르지 않는다', () => {
    expect(ask('9번')).toEqual({ kind: 'unknown' });
    expect(ask('글쎄')).toEqual({ kind: 'unknown' });
    expect(ask('')).toEqual({ kind: 'unknown' });
  });

  it('다른 칸을 말하면 고르지 않고 알려 준다', () => {
    expect(ask('냉동실 2번')).toEqual({
      kind: 'other-category',
      category: 'freezer',
    });
  });
});

describe('typingFrames', () => {
  it('글자마다 첫소리부터 써진다', () => {
    expect(typingFrames('오이')).toEqual(['ㅇ', '오', '오ㅇ', '오이']);
    expect(typingFrames('두부')).toEqual(['ㄷ', '두', '두ㅂ', '두부']);
  });
});
