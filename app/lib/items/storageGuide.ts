// app/lib/items/storageGuide.ts
// 식재료별 권장 보관 기간. 등록할 때 유통기한을 비워 두면 "등록일 + 권장 일수"로 채운다
// 직접 넣은 날짜가 있으면 그 날짜가 우선이고, 채운 날짜는 언제든 고칠 수 있다
//
// 근거 (docs/decisions/0006): 미국 농무부 FoodKeeper의 냉장, 냉동 보관 기간과
// 식약처 냉동 보관 안내(생선과 해산물 3개월 등)를 바탕으로, 범위가 있으면 짧은 쪽을 골랐다.
// 식품 안전을 보장하는 값이 아니라 "이쯤 먹으면 좋다"는 참고값이다. 냉동은 맛이 유지되는 기간이다.

import type { Category } from '@/app/lib/schemas/item';

type Days = Partial<Record<Category, number>>;

// 이름에 이 낱말이 들어 있으면 그 기간을 쓴다 (긴 낱말이 먼저 맞는다: "닭가슴살"이 "닭"보다 먼저)
const GUIDE: Record<string, Days> = {
  // 채소
  시금치: { fridge: 3, freezer: 30 },
  브로콜리: { fridge: 5, freezer: 30 },
  당근: { fridge: 14, freezer: 30 },
  양파: { fridge: 14, pantry: 30 },
  감자: { pantry: 21 },
  고구마: { pantry: 14 },
  오이: { fridge: 5 },
  토마토: { fridge: 5, pantry: 3 },
  애호박: { fridge: 5 },
  호박: { fridge: 5 },
  얼갈이: { fridge: 3 },
  배추: { fridge: 7 },
  양배추: { fridge: 14 },
  상추: { fridge: 4 },
  깻잎: { fridge: 4 },
  고추: { fridge: 7, freezer: 30 },
  대파: { fridge: 7, freezer: 30 },
  쪽파: { fridge: 5 },
  마늘: { fridge: 14, pantry: 14, freezer: 90 },
  생강: { fridge: 21 },
  무: { fridge: 14 },
  콩나물: { fridge: 2 },
  숙주: { fridge: 2 },
  버섯: { fridge: 4, freezer: 30 },
  팽이버섯: { fridge: 5 },
  콩: { pantry: 180 },
  밤: { fridge: 30, pantry: 7 },
  // 과일
  사과: { fridge: 30, pantry: 7 },
  바나나: { pantry: 5 },
  딸기: { fridge: 3, freezer: 90 },
  블루베리: { fridge: 7, freezer: 90 },
  아보카도: { fridge: 5, pantry: 4 },
  오렌지: { fridge: 14, pantry: 7 },
  귤: { fridge: 14, pantry: 7 },
  포도: { fridge: 7 },
  샤인머스캣: { fridge: 10 },
  자두: { fridge: 5 },
  복숭아: { fridge: 5 },
  참외: { fridge: 7 },
  수박: { fridge: 4 },
  멜론: { fridge: 5 },
  키위: { fridge: 21, pantry: 7 },
  파인애플: { fridge: 4 },
  배: { fridge: 21 },
  // 고기 (냉장은 덩어리 기준, 냉동은 맛이 유지되는 기간)
  닭: { fridge: 2, freezer: 90 },
  닭가슴살: { fridge: 2, freezer: 90 },
  닭다리살: { fridge: 2, freezer: 90 },
  소고기: { fridge: 3, freezer: 180 },
  돼지고기: { fridge: 3, freezer: 120 },
  양고기: { fridge: 3, freezer: 120 },
  다진: { fridge: 1, freezer: 90 },
  햄: { fridge: 7, freezer: 60 },
  소시지: { fridge: 7, freezer: 60 },
  베이컨: { fridge: 7, freezer: 30 },
  // 해산물 (식약처: 익히지 않은 생선과 해산물은 냉동 3개월)
  연어: { fridge: 2, freezer: 90 },
  새우: { fridge: 2, freezer: 90 },
  오징어: { fridge: 2, freezer: 90 },
  게: { fridge: 1, freezer: 90 },
  굴: { fridge: 2, freezer: 90 },
  조개: { fridge: 2, freezer: 90 },
  고등어: { fridge: 2, freezer: 90 },
  조기: { fridge: 2, freezer: 90 },
  생선: { fridge: 2, freezer: 90 },
  전복: { fridge: 3, freezer: 90 },
  미역줄기: { fridge: 7 },
  어묵: { fridge: 4, freezer: 60 },
  // 유제품과 달걀
  우유: { fridge: 5 },
  요거트: { fridge: 7 },
  요구르트: { fridge: 7 },
  치즈: { fridge: 14, freezer: 90 },
  모짜렐라: { fridge: 7 },
  버터: { fridge: 30, freezer: 180 },
  달걀: { fridge: 21 },
  계란: { fridge: 21 },
  // 그 밖에
  두부: { fridge: 3 },
  김치: { fridge: 30 },
  밥: { fridge: 2, freezer: 30 },
  떡: { pantry: 1, fridge: 3, freezer: 60 },
  빵: { pantry: 3, freezer: 30 },
  만두: { freezer: 90 },
  라면: { pantry: 180 },
  쌀: { pantry: 180 },
  소스: { fridge: 7 },
  오일: { pantry: 180 },
  // 앞 낱말(아보카도, 토마토)과 겹치는 이름은 통째로 적어 먼저 맞게 한다 (띄어쓰기는 빼고 비교)
  아보카도오일: { pantry: 180 },
  트러플오일: { pantry: 180 },
  토마토소스: { fridge: 7 },
  소주: { pantry: 365 },
};

// 표에 없는 품목은 보관 위치만 보고 짧게 잡는다
export const DEFAULT_DAYS: Record<Category, number> = {
  fridge: 5,
  freezer: 30,
  pantry: 14,
};

// 긴 낱말부터 맞춰 본다
const KEYS = Object.keys(GUIDE).sort((a, b) => b.length - a.length);

// 보관 기간을 아는 식재료 이름들 (음성으로 들은 이름이 식재료인지 확인할 때도 쓴다)
export const GUIDE_KEYWORDS: readonly string[] = KEYS;

export function recommendedDays(name: string, category: Category): number {
  const normalized = name.replace(/\s+/g, '');
  for (const key of KEYS) {
    if (normalized.includes(key)) {
      const days = GUIDE[key][category];
      if (days !== undefined) return days;
    }
  }
  return DEFAULT_DAYS[category];
}

// today: 한국 날짜 YYYY-MM-DD
export function recommendedExpiryDate(
  name: string,
  category: Category,
  today: string,
): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + recommendedDays(name, category));
  return date.toISOString().slice(0, 10);
}
