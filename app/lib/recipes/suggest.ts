// app/lib/recipes/suggest.ts
// "오늘 뭐 먹지" 3개를 고른다. 곧 먹어야 할 재료를 쓰는 요리를 먼저, 그다음 냉장고에 있는 재료, 계절과 날씨 순
// 같은 점수끼리는 날짜로 섞어 매일 조금씩 다른 요리가 보이게 한다

import { hashText } from '@/app/lib/experiments/assign';
import { daysUntilExpiry, EXPIRY_SOON_DAYS } from '@/app/lib/items/expiry';
import {
  HOME_RECIPES,
  type HomeRecipe,
  type Season,
  type WeatherMood,
} from '@/app/lib/recipes/homeRecipes';

export const SUGGESTION_COUNT = 3;

// 양념은 단계에만 적고 재료 목록에 넣지 않아, 빠진 재료로 잡히지 않는다
// "방울토마토"는 토마토로 본다 (홈 레시피 카드와 같은 기준)
const sameName = (a: string, b: string) => a.includes(b) || b.includes(a);

export interface SuggestInput {
  items: { name: string; finished: boolean; expiryDate?: string | null }[];
  season: Season;
  mood: WeatherMood | null;
  now?: Date;
  recipes?: HomeRecipe[];
}

export interface Suggestion {
  recipe: HomeRecipe;
  have: string[];
  missing: string[];
  // 곧 먹어야 할 재료 중 이 요리에 쓰는 것
  usesSoon: string[];
}

export function seasonOf(date: Date): Season {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export const SEASON_LABEL: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

export function suggestRecipes({
  items,
  season,
  mood,
  now = new Date(),
  recipes = HOME_RECIPES,
}: SuggestInput): Suggestion[] {
  const inFridge = items.filter(item => !item.finished);
  const soonNames = inFridge
    .filter(
      item =>
        item.expiryDate &&
        daysUntilExpiry(item.expiryDate, now) <= EXPIRY_SOON_DAYS,
    )
    .map(item => item.name);
  const fridgeNames = inFridge.map(item => item.name);
  const day = now.toISOString().slice(0, 10);

  return recipes
    .map(recipe => {
      const names = recipe.ingredients.map(i => i.name);
      const have = names.filter(n => fridgeNames.some(f => sameName(f, n)));
      const usesSoon = names.filter(n => soonNames.some(f => sameName(f, n)));
      const fitsSeason =
        recipe.seasons.length === 0 || recipe.seasons.includes(season);
      const score =
        usesSoon.length * 4 +
        have.length * 2 -
        (names.length - have.length) +
        (recipe.seasons.includes(season) ? 2 : fitsSeason ? 0 : -3) +
        (mood && recipe.moods.includes(mood) ? 2 : 0);
      return {
        suggestion: {
          recipe,
          have,
          missing: names.filter(n => !have.includes(n)),
          usesSoon,
        },
        score,
        tie: hashText(`${day}:${recipe.id}`),
      };
    })
    .sort((a, b) => b.score - a.score || a.tie - b.tie)
    .slice(0, SUGGESTION_COUNT)
    .map(({ suggestion }) => suggestion);
}
