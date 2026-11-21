// app/lib/speech/placeAnswer.ts
// "오이! 어디에 넣을까요?"에 말로 한 답을 선반 번호로 바꾼다 (음성으로 넣기, 2026-11-20)
// - "추천대로", "그대로", "네" → 추천 선반
// - "맨 위", "맨 아래", "가운데" → 위치
// - "3번", "삼 번", "세 번째", "셋째 칸", "3층" → 번호
// - 다른 칸("냉동실 2번"인데 지금 냉장실)을 말하면 고르지 않고 알려 준다 (여기서는 칸을 바꾸지 않는다)

import type { Category } from '@/app/lib/schemas/item';

export type PlaceAnswer =
  | { kind: 'shelf'; shelf: number }
  | { kind: 'other-category'; category: Category }
  | { kind: 'unknown' };

const CATEGORY_WORDS: [Category, RegExp][] = [
  ['freezer', /냉동/],
  ['fridge', /냉장/],
  ['pantry', /상온|실온|찬장/],
];

// 한자어 수(일 이 삼 …)와 고유어 수(한/첫 두 세 네 …)를 번호로
const SINO: Record<string, number> = {
  일: 1,
  이: 2,
  삼: 3,
  사: 4,
  오: 5,
  육: 6,
  칠: 7,
};
const NATIVE: [RegExp, number][] = [
  [/(첫|한|하나)/, 1],
  [/(두|둘)/, 2],
  [/(세|셋)/, 3],
  [/(네|넷)/, 4],
  [/다섯/, 5],
  [/여섯/, 6],
  [/일곱/, 7],
];

function numberIn(text: string): number | null {
  const digit = text.match(/(\d+)/);
  if (digit) return Number(digit[1]);
  // "삼 번", "삼번", "삼 칸", "삼층"
  const sino = text.match(/([일이삼사오육칠])\s*(번|칸|층|단)/);
  if (sino) return SINO[sino[1]];
  // "세 번째", "셋째", "두 번째 칸"
  if (/(번째|째)/.test(text)) {
    for (const [pattern, value] of NATIVE) {
      if (pattern.test(text)) return value;
    }
  }
  return null;
}

export function parsePlaceAnswer(
  spoken: string,
  category: Category,
  shelfCount: number,
  recommended: number,
): PlaceAnswer {
  const text = spoken.replace(/[.,!?。]/g, '').trim();
  if (!text) return { kind: 'unknown' };

  const mentioned = CATEGORY_WORDS.find(([, pattern]) => pattern.test(text));
  if (mentioned && mentioned[0] !== category) {
    return { kind: 'other-category', category: mentioned[0] };
  }

  if (/추천|그대로|거기|좋아|^(네|응|예|그래)/.test(text)) {
    return { kind: 'shelf', shelf: recommended };
  }

  const number = numberIn(text);
  if (number !== null) {
    return number >= 1 && number <= shelfCount
      ? { kind: 'shelf', shelf: number }
      : { kind: 'unknown' };
  }

  if (/(맨|제일|가장)\s*(위|윗)/.test(text) || /^위/.test(text)) {
    return { kind: 'shelf', shelf: 1 };
  }
  if (/(맨|제일|가장)\s*(아래|밑)/.test(text) || /^(아래|밑)/.test(text)) {
    return { kind: 'shelf', shelf: shelfCount };
  }
  if (/가운데|중간/.test(text)) {
    return { kind: 'shelf', shelf: Math.ceil(shelfCount / 2) };
  }
  return { kind: 'unknown' };
}

// 들은 말이 써지는 모습: 한 글자마다 첫소리 → 완성 글자 ("ㅇ → 오 → 오ㅇ → 오이")
const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
export function typingFrames(word: string): string[] {
  const frames: string[] = [];
  const chars = Array.from(word);
  chars.forEach((ch, index) => {
    const prefix = chars.slice(0, index).join('');
    const code = ch.charCodeAt(0) - 0xac00;
    if (code >= 0 && code < 11172) {
      frames.push(prefix + INITIALS[Math.floor(code / 588)]);
    }
    frames.push(prefix + ch);
  });
  return frames;
}
