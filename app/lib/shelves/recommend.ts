// app/lib/shelves/recommend.ts
// 식재료를 넣을 때 "어디에 넣을까요?"의 추천 자리와 이유 한 줄 (docs/decisions/0012-shelf-view-beta.md)
// 선반은 번호만 있으므로(1번이 맨 위) 위치로 말한다. 실제 냉장고의 공기 흐름을 생활 말로 옮긴다
// - 찬 공기는 아래로 모인다: 아래쪽이 더 차갑다 → 고기, 생선
// - 맨 아래 칸은 찬 바람을 덜 맞는다: 덜 마른다 → 채소, 과일
// - 문을 열 때 온도가 덜 바뀌는 가운데 → 유제품, 두부, 달걀
// - 자주 꺼내는 것은 눈에 잘 띄는 위 칸 → 반찬, 음료, 소스
// 전에 같은 이름을 둔 선반이 있으면 그 자리를 먼저 추천한다. 꽉 찬 선반은 피하고 가장 여유 있는 선반으로 바꾼다

import type { Category, Item } from '@/app/lib/schemas/item';
import { SHELF_FULL_AT, type ShelfCounts } from '@/app/lib/shelves/rules';

export type FoodGroup = 'produce' | 'meat' | 'dairy' | 'ready' | 'drink';

// 두 글자 이상은 이름에 들어 있으면, 한 글자는 이름이 그 글자와 같을 때만 맞춘다 ("배"가 "배추"에 걸리지 않게)
// 소스와 음료를 먼저 본다 ("고추장"이 채소 "고추"에 걸리지 않게)
const GROUPS: [FoodGroup, string[]][] = [
  [
    'drink',
    [
      '주스',
      '음료',
      '콜라',
      '사이다',
      '생수',
      '탄산수',
      '맥주',
      '소주',
      '와인',
      '막걸리',
      '커피',
      '케첩',
      '케찹',
      '마요',
      '소스',
      '간장',
      '고추장',
      '된장',
      '쌈장',
      '초장',
      '드레싱',
      '잼',
      '꿀',
      '물',
    ],
  ],
  [
    'ready',
    [
      '김치',
      '반찬',
      '잡채',
      '나물',
      '찌개',
      '카레',
      '남은',
      '볶음',
      '조림',
      '장아찌',
      '젓갈',
      '무침',
      '국',
    ],
  ],
  [
    'meat',
    [
      '고기',
      '삼겹',
      '목살',
      '소고기',
      '돼지',
      '닭',
      '갈비',
      '불고기',
      '차돌',
      '등심',
      '안심',
      '항정',
      '베이컨',
      '소시지',
      '햄',
      '생선',
      '고등어',
      '연어',
      '갈치',
      '오징어',
      '새우',
      '조개',
      '전복',
      '낙지',
      '문어',
      '꽃게',
      '게',
      '굴',
      '회',
    ],
  ],
  [
    'dairy',
    [
      '우유',
      '치즈',
      '요거트',
      '요구르트',
      '버터',
      '생크림',
      '두부',
      '달걀',
      '계란',
      '메추리알',
    ],
  ],
  [
    'produce',
    [
      '오이',
      '양파',
      '대파',
      '쪽파',
      '마늘',
      '당근',
      '감자',
      '고구마',
      '배추',
      '양배추',
      '상추',
      '깻잎',
      '시금치',
      '버섯',
      '브로콜리',
      '토마토',
      '파프리카',
      '피망',
      '고추',
      '애호박',
      '호박',
      '콩나물',
      '숙주',
      '부추',
      '샐러드',
      '사과',
      '딸기',
      '바나나',
      '포도',
      '레몬',
      '키위',
      '블루베리',
      '수박',
      '참외',
      '복숭아',
      '자두',
      '오렌지',
      '무',
      '파',
      '배',
      '귤',
    ],
  ],
];

export function foodGroupOf(name: string): FoodGroup | null {
  const trimmed = name.replace(/\s+/g, '');
  for (const [group, words] of GROUPS) {
    const hit = words.some(word =>
      word.length >= 2 ? trimmed.includes(word) : trimmed === word,
    );
    if (hit) return group;
  }
  return null;
}

export interface PlaceRecommendation {
  shelf: number;
  reason: string;
}

const REASON = {
  produce: '맨 아래 칸은 찬 바람을 덜 맞아 채소가 덜 말라요',
  meat: '찬 공기가 아래로 모여 아래쪽이 더 차가워요',
  dairy: '문을 열어도 온도가 덜 바뀌는 가운데가 좋아요',
  top: '자주 꺼내는 건 눈에 잘 띄는 위 칸이 편해요',
  history: '전에 넣어 둔 자리예요',
  roomy: '지금 가장 여유 있는 선반이에요',
} as const;

// 선반마다 놓인 품목 수 (다 먹은 품목과 선반 없는 품목은 세지 않는다)
export function shelfLoads(
  items: Item[],
  category: Category,
  count: number,
): number[] {
  const loads = Array.from({ length: count }, () => 0);
  for (const item of items) {
    if (item.finished || item.category !== category || item.shelf === null) {
      continue;
    }
    if (item.shelf >= 1 && item.shelf <= count) loads[item.shelf - 1] += 1;
  }
  return loads;
}

function preferredShelf(
  group: FoodGroup | null,
  category: Category,
  count: number,
): { shelf: number; reason: string } | null {
  if (category !== 'fridge' || group === null) return null;
  const bottom = count;
  switch (group) {
    case 'produce':
      return { shelf: bottom, reason: REASON.produce };
    case 'meat':
      // 맨 아래는 채소 자리로 두고 그 바로 위. 선반이 둘 이하면 맨 아래
      return { shelf: count >= 3 ? bottom - 1 : bottom, reason: REASON.meat };
    case 'dairy':
      return { shelf: Math.ceil(count / 2), reason: REASON.dairy };
    case 'ready':
    case 'drink':
      return { shelf: 1, reason: REASON.top };
  }
}

export function recommendPlace(
  name: string,
  category: Category,
  counts: ShelfCounts,
  items: Item[],
): PlaceRecommendation {
  const count = counts[category];
  const loads = shelfLoads(items, category, count);
  // 가득(냉장 20, 냉동 30) 찬 선반은 추천하지 않는다. 넣는 것은 최대까지 된다
  const hasRoom = (shelf: number) => loads[shelf - 1] < SHELF_FULL_AT[category];
  const roomiest = (): PlaceRecommendation => {
    let best = 1;
    for (let shelf = 2; shelf <= count; shelf += 1) {
      if (loads[shelf - 1] < loads[best - 1]) best = shelf;
    }
    return { shelf: best, reason: REASON.roomy };
  };

  // 같은 이름을 전에 둔 자리 (가장 최근에 넣은 것 기준, 다 먹은 품목도 본다)
  const key = name.replace(/\s+/g, '');
  const previous = items
    .filter(
      item =>
        item.category === category &&
        item.shelf !== null &&
        item.shelf <= count &&
        item.name.replace(/\s+/g, '') === key,
    )
    .sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
    )[0];
  if (previous?.shelf && hasRoom(previous.shelf)) {
    return { shelf: previous.shelf, reason: REASON.history };
  }

  const preferred = preferredShelf(foodGroupOf(name), category, count);
  if (preferred && hasRoom(preferred.shelf)) return preferred;
  return roomiest();
}

// "냉장실 맨 아래 선반"처럼 위치로 부르는 이름 (번호도 함께)
export function shelfPlaceName(
  category: Category,
  shelf: number,
  count: number,
): string {
  const label = { fridge: '냉장실', freezer: '냉동실', pantry: '상온' }[
    category
  ];
  const where =
    count === 1
      ? ''
      : shelf === 1
        ? '맨 위 '
        : shelf === count
          ? '맨 아래 '
          : '';
  return `${label} ${where}${shelf}번 선반`;
}
