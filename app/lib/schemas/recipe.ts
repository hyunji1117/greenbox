// app/lib/schemas/recipe.ts
// 초간단 레시피 API 계약. 서버는 이 모양으로 돌려주고 화면은 이 스키마로 확인한다

import { z } from 'zod';

export const RecipeIngredientSchema = z.object({
  name: z.string(),
  amount: z.string(),
  // 냉장고에 있거나 집에 흔한 양념이면 true, 사야 하면 false
  have: z.boolean(),
});

export const RecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  minutes: z.number().int(),
  ingredients: z.array(RecipeIngredientSchema),
  steps: z.array(z.object({ text: z.string() })),
  caution: z.string().nullable(),
  // 이 레시피에 쓰이는 곧 먹어야 할 품목 (다 만들면 "다 먹음"으로 바꿀 수 있다)
  usedItemIds: z.array(z.string()),
});
export type Recipe = z.infer<typeof RecipeSchema>;

// 홈 카드: 쓸 수 있는지, 곧 먹어야 할 재료, 이미 만든 레시피
export const TodayRecipeSchema = z.discriminatedUnion('available', [
  z.object({ available: z.literal(false) }),
  z.object({
    available: z.literal(true),
    soonNames: z.array(z.string()),
    recipe: RecipeSchema.nullable(),
  }),
]);
export type TodayRecipe = z.infer<typeof TodayRecipeSchema>;

// 저장된 레시피 찾기 (GET). 해외로 보내지 않으므로 동의 표시가 필요 없다
export const TodayRecipeQuerySchema = z.object({
  fridgeId: z.string().regex(/^\d{1,18}$/),
});

// 새로 만들기 (POST)
export const TodayRecipeRequestSchema = TodayRecipeQuerySchema.extend({
  // 품목 이름을 Anthropic, OpenAI(미국)로 보내는 데 동의했는지. 레시피를 처음 만들거나 열 때 받는다
  agreed: z.literal(true),
});

// 레시피 그림 자리: 0은 완성 사진, 1부터 단계
export const RecipeImageSlotSchema = z.coerce.number().int().min(0).max(20);
