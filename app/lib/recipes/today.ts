// app/lib/recipes/today.ts
// 홈 카드용 오늘의 초간단 레시피: 곧 먹어야 할 재료를 고르고, 저장된 레시피를 찾거나 새로 만든다 (서버 전용)

import {
  latestPolicyVersion,
  RECIPE_POLICY_VERSION,
} from '@/app/lib/consent/policies';
import { daysUntilExpiry, EXPIRY_SOON_DAYS } from '@/app/lib/items/expiry';
import type { ItemJson } from '@/app/lib/items/store';
import type { Recipe } from '@/app/lib/schemas/recipe';
import type { StoredRecipe } from '@/app/lib/recipes/store';

// 한 레시피에 쓰는 곧 먹어야 할 재료 수와, 함께 알려 주는 냉장고 재료 수
export const MAX_SOON = 3;
export const MAX_OTHER = 20;

// 하루(24시간)에 새로 만들 수 있는 횟수. 저장된 레시피와 그림을 다시 보는 것은 세지 않는다
export const DAILY_RECIPE_LIMIT = 5;
export const DAILY_IMAGE_LIMIT = 20;

// 레시피 모양이나 지시문을 바꾸면 올려서 예전 저장분을 다시 쓰지 않게 한다
const CACHE_VERSION = 'v1';

// 개인정보처리방침에 레시피(품목 이름을 Anthropic, OpenAI로 보냄)가 들어간 버전(2026-11-09)이 시행되면 모두에게 연다
// 시행 전에는 지정한 사람(운영자 테스트 계정)에게만 연다. 처음 만들거나 열 때 따로 동의를 받는다 (RecipeCard)
export function isRecipeAvailable(
  userId: string,
  now: number = Date.now(),
): boolean {
  if (process.env.RECIPES_ENABLED === 'true') return true;
  if (latestPolicyVersion(now) >= RECIPE_POLICY_VERSION) return true;
  const allowed = (process.env.RECIPE_PREVIEW_USER_IDS ?? '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);
  return allowed.includes(userId);
}

export interface PickedIngredients {
  soon: ItemJson[];
  otherNames: string[];
}

// 냉장고에 남아 있는 품목 중 유통기한이 3일 안(지난 것 포함)인 것을 급한 순으로 고른다
export function pickIngredients(
  items: ItemJson[],
  now = new Date(),
): PickedIngredients {
  const inFridge = items.filter(item => !item.finished);
  const soon = inFridge
    .filter(item => item.expiryDate)
    .map(item => ({ item, days: daysUntilExpiry(item.expiryDate!, now) }))
    .filter(({ days }) => days <= EXPIRY_SOON_DAYS)
    .sort((a, b) => a.days - b.days)
    .map(({ item }) => item)
    // 같은 이름 품목이 여럿이면 가장 급한 것 하나만 쓴다 (재료 이름이 두 번 나오지 않게)
    .filter(
      (item, index, list) =>
        list.findIndex(i => i.name === item.name) === index,
    )
    .slice(0, MAX_SOON);
  const soonIds = new Set(soon.map(item => item.id));
  const otherNames = [
    ...new Set(
      inFridge.filter(item => !soonIds.has(item.id)).map(item => item.name),
    ),
  ].slice(0, MAX_OTHER);
  return { soon, otherNames };
}

export function recipeCacheKey(soonNames: string[]): string {
  return `${CACHE_VERSION}:${[...new Set(soonNames)].sort().join('|')}`;
}

const sameName = (a: string, b: string) => a.includes(b) || b.includes(a);

// 집에 흔한 양념. 레시피 지시문과 같은 목록으로, 있다고 본다
const STAPLES = [
  '소금',
  '설탕',
  '간장',
  '식용유',
  '참기름',
  '후추',
  '고춧가루',
  '다진 마늘',
];

// 저장된 레시피는 다른 냉장고에서 만든 것일 수 있어, 있음/살 것을 지금 냉장고 기준으로 다시 정한다
export function toRecipeJson(
  recipe: StoredRecipe,
  fridgeNames: string[],
  soon: ItemJson[],
): Recipe {
  return {
    id: recipe.id,
    title: recipe.title,
    minutes: recipe.minutes,
    caution: recipe.caution,
    steps: recipe.steps,
    ingredients: recipe.ingredients.map(i => ({
      ...i,
      // 모델의 판단은 그 레시피를 처음 만든 냉장고 기준이라 쓰지 않고, 양념과 지금 냉장고로 다시 판단한다
      have:
        // "진간장"은 간장으로 보지만, 짧은 재료 이름이 양념 이름 안에 들어 있다고 양념으로 보지는 않는다
        STAPLES.some(staple => i.name.includes(staple)) ||
        fridgeNames.some(name => sameName(name, i.name)),
    })),
    usedItemIds: soon
      .filter(item => recipe.ingredients.some(i => sameName(item.name, i.name)))
      .map(item => item.id),
  };
}
