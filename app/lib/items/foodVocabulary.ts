// app/lib/items/foodVocabulary.ts
// 음성으로 들은 이름이 식재료 이름인지 확인한다. 잘못 들은 말("오", "어제")이 품목으로 등록되지 않게 한다
// - 아는 식재료 이름이 들어 있으면 그대로 쓴다 ("유기농 우유"는 우유가 들어 있어 통과)
// - 세 글자 이상인데 한 글자만 다르면 아는 이름으로 고친다 ("파프리가" → "파프리카")
// - 그 밖에는 모르는 이름으로 보고 다시 말할지 묻는다 (직접 글자로 적은 이름은 확인하지 않는다)

import { mockItems } from '@/app/data/mockItems';
import { normalizeName, synonymWords } from '@/app/lib/items/nameMatch';
import { GUIDE_KEYWORDS } from '@/app/lib/items/storageGuide';

// 보관 기간 표와 장보기 사진 목록에 없는 흔한 식재료와 양념
const COMMON_FOODS = [
  '가지',
  '감',
  '건새우',
  '견과',
  '고사리',
  '고춧가루',
  '고추장',
  '곤약',
  '굴소스',
  '김',
  '꽁치',
  '꿀',
  '낙지',
  '냉면',
  '녹두',
  '느타리',
  '다시마',
  '닭발',
  '대구',
  '대추',
  '도라지',
  '도토리묵',
  '동태',
  '된장',
  '들기름',
  '레몬',
  '마',
  '매실',
  '멸치',
  '명란',
  '모시조개',
  '목살',
  '무말랭이',
  '문어',
  '물',
  '미나리',
  '미역',
  '바지락',
  '배추김치',
  '버섯',
  '베이킹파우더',
  '부추',
  '북어',
  '블랙올리브',
  '비트',
  '삼겹살',
  '새송이',
  '샐러드',
  '샐러리',
  '셀러리',
  '설탕',
  '소금',
  '수제비',
  '순대',
  '숙주나물',
  '스파게티',
  '식빵',
  '식초',
  '쌈장',
  '쑥갓',
  '아몬드',
  '알타리',
  '앞다리',
  '애플망고',
  '양상추',
  '연근',
  '연두부',
  '열무',
  '옥수수',
  '올리브',
  '올리브유',
  '요플레',
  '우동',
  '우엉',
  '유부',
  '육포',
  '자몽',
  '잡채',
  '장어',
  '젓갈',
  '조갯살',
  '주꾸미',
  '쭈꾸미',
  '참기름',
  '참치',
  '청경채',
  '체리',
  '초콜릿',
  '총각김치',
  '취나물',
  '카레',
  '케일',
  '코코넛',
  '콜라비',
  '크림',
  '크림치즈',
  '키위',
  '토란',
  '통조림',
  '파스타',
  '팥',
  '편육',
  '표고',
  '피자',
  '한우',
  '호두',
  '홍합',
  '황태',
  '후추',
  '훈제연어',
  '흑미',
  '아이스크림',
  '주스',
  '맥주',
  '와인',
  '탄산수',
  '생수',
  '커피',
  '차',
  '두유',
  '어린잎',
  '루꼴라',
  '바질',
  '로즈마리',
];

const vocabulary = (extra: readonly string[]) => {
  const words = new Set<string>();
  for (const word of [
    ...GUIDE_KEYWORDS,
    ...mockItems.map(item => item.name),
    ...COMMON_FOODS,
    ...synonymWords(),
    ...extra,
  ]) {
    const normalized = normalizeName(word);
    if (normalized) words.add(normalized);
  }
  return [...words];
};

function oneEditApart(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (a.length < b.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

export type FoodNameCheck =
  | { status: 'known'; name: string }
  | { status: 'corrected'; name: string; heard: string }
  | { status: 'unknown'; heard: string };

// extra: 이 냉장고에 넣은 적 있는 이름처럼 집마다 쓰는 이름
export function checkFoodName(
  spoken: string,
  extra: readonly string[] = [],
): FoodNameCheck {
  const heard = spoken.trim();
  const target = normalizeName(heard);
  if (!target) return { status: 'unknown', heard };
  const words = vocabulary(extra);
  // 한 글자 식재료(무, 배, 게, 굴 등)는 그 한 글자만 말했을 때만, 두 글자 이상은 이름 안에 들어 있으면 통과
  if (
    words.some(word =>
      word.length === 1 ? target === word : target.includes(word),
    )
  ) {
    return { status: 'known', name: heard };
  }
  const close = words.find(
    word => word.length >= 3 && oneEditApart(target, word),
  );
  if (close) return { status: 'corrected', name: close, heard };
  return { status: 'unknown', heard };
}
