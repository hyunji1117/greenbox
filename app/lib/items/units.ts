// app/lib/items/units.ts
// 마트에서 쓰는 수량 단위 (계란 30구, 두부 1모, 대파 1단). 품목 이름 안에 든 가장 긴 재료 이름으로 고른다
// 사용자가 고른 단위(items.unit, 0018)가 있으면 그것을, 없으면 이름으로 추정한다. 표에 없는 품목은 "개"
// g은 그램으로만 파는 식재료(정육, 버섯 등)용. 수량이 그램 수라서 9999까지 받고 100g씩 움직이며,
// 먹은 양도 그램으로 센다 (남은 양 = 처음 양 - 먹은 양 계산을 그대로 쓴다)

import { foodGroupOf, type FoodGroup } from '@/app/lib/shelves/recommend';

export const DEFAULT_UNIT = '개';

const UNIT: Record<string, string> = {
  계란: '구',
  달걀: '구',
  메추리알: '구',
  두부: '모',
  대파: '단',
  쪽파: '단',
  시금치: '단',
  부추: '단',
  미나리: '단',
  열무: '단',
  깻잎: '묶음',
  배추: '포기',
  양배추: '통',
  수박: '통',
  김치: '통',
  콩나물: '봉',
  숙주: '봉',
  상추: '봉',
  김: '봉',
  어묵: '봉',
  라면: '봉',
  소면: '봉',
  국수: '봉',
  떡: '봉',
  당면: '봉',
  만두: '봉',
  빵: '봉',
  식빵: '봉',
  굴: '봉',
  조개: '봉',
  새우: '봉',
  돼지고기: '팩',
  소고기: '팩',
  쇠고기: '팩',
  삼겹살: '팩',
  목살: '팩',
  다짐육: '팩',
  닭가슴살: '팩',
  버섯: '팩',
  딸기: '팩',
  방울토마토: '팩',
  블루베리: '팩',
  베이컨: '팩',
  우유: '팩',
  닭: '마리',
  생선: '마리',
  고등어: '마리',
  갈치: '마리',
  조기: '마리',
  굴비: '마리',
  오징어: '마리',
  꽃게: '마리',
  참치: '캔',
  스팸: '캔',
  통조림: '캔',
  주스: '병',
  간장: '병',
  식초: '병',
  소스: '병',
  맥주: '병',
  소주: '병',
  음료: '병',
  바나나: '송이',
  포도: '송이',
  치즈: '장',
};

const KEYS = Object.keys(UNIT).sort((a, b) => b.length - a.length);

// 고를 수 있는 단위. DB 제약(0018)과 같은 목록
export const UNIT_CHOICES = [
  '개',
  '구',
  '모',
  '단',
  '봉',
  '팩',
  '통',
  '포기',
  '묶음',
  '마리',
  '캔',
  '병',
  '송이',
  '장',
  'g',
] as const;
export type Unit = (typeof UNIT_CHOICES)[number];

export const GRAM = 'g';
export const COUNT_MAX = 99;
export const GRAM_MAX = 9999;
export const GRAM_STEP = 100;
// g으로 바꿀 때 처음 채우는 양 (정육 한 팩쯤)
export const GRAM_DEFAULT = 500;

export function suggestedUnit(name: string): string {
  const key = KEYS.find(k => name.includes(k));
  return key ? UNIT[key] : DEFAULT_UNIT;
}

// 식재료마다 쓸 수 있는 단위 (2026-11-20). 15개를 다 보여 주면 계란에 "포기", 당근에 "마리"가 보여 고르기 번거로웠다
// - 추천 단위 표에 있는 식재료: 그 단위와 함께 쓰이는 단위만
// - 표에 없는 식재료: 추천 규칙의 식재료 무리(채소, 고기, 유제품, 반찬, 음료)로 정한다 (당근은 채소라 개, 봉, 팩, g)
// - 어느 무리에도 안 맞으면 기본 단위만 보여 주고 "다른 단위"로 전체를 펼칠 수 있게 한다
const WITH_SUGGESTED: Record<string, Unit[]> = {
  구: ['구', '개'],
  모: ['모', '개', 'g'],
  단: ['단', '봉', 'g'],
  묶음: ['묶음', '봉', '장'],
  포기: ['포기', '통', '개'],
  통: ['통', '개'],
  봉: ['봉', '개', '팩', 'g'],
  팩: ['팩', 'g', '개'],
  마리: ['마리', '팩', 'g'],
  캔: ['캔', '개'],
  병: ['병', '팩', '개'],
  송이: ['송이', '개', '팩'],
  장: ['장', '팩', '봉'],
};
const BY_GROUP: Record<FoodGroup, Unit[]> = {
  produce: ['개', '봉', '팩', 'g'],
  meat: ['팩', 'g', '개'],
  dairy: ['개', '팩'],
  ready: ['통', '팩', '개'],
  drink: ['병', '캔', '팩', '개'],
};
const FALLBACK_UNITS: Unit[] = ['개', '봉', '팩', 'g'];

export function unitOptions(
  name: string,
  current?: string | null,
): { units: Unit[]; canShowAll: boolean } {
  const key = KEYS.find(k => name.includes(k));
  const group = key ? null : foodGroupOf(name);
  const units = key
    ? (WITH_SUGGESTED[UNIT[key]] ?? [UNIT[key] as Unit, DEFAULT_UNIT as Unit])
    : group
      ? BY_GROUP[group]
      : FALLBACK_UNITS;
  // 전에 직접 고른 단위가 목록에 없으면 그것도 함께 보여 준다 (예전에 고른 값이 사라져 보이지 않게)
  const withCurrent =
    current && !units.includes(current as Unit)
      ? [current as Unit, ...units]
      : units;
  return { units: withCurrent, canShowAll: !key && !group };
}

// 고른 단위가 있으면 그것, 없으면 이름으로 추정
export function unitFor(name: string, unit?: string | null): string {
  return unit ?? suggestedUnit(name);
}

// "30구", "1모", "600g"
export function withUnit(
  count: number,
  name: string,
  unit?: string | null,
): string {
  return `${count}${unitFor(name, unit)}`;
}

export function isGram(unit: string): boolean {
  return unit === GRAM;
}

// 수량 칸의 최대값과 버튼 한 번에 움직이는 양
export function quantityLimits(unit: string): { max: number; step: number } {
  return isGram(unit)
    ? { max: GRAM_MAX, step: GRAM_STEP }
    : { max: COUNT_MAX, step: 1 };
}

// 단위를 바꿀 때 수량: 개수와 그램은 뜻이 달라 g으로 들어가거나 나올 때만 새로 채운다
export function quantityAfterUnitChange(
  from: string,
  to: string,
  quantity: number,
): number {
  if (isGram(from) === isGram(to)) return quantity;
  return isGram(to) ? GRAM_DEFAULT : 1;
}
