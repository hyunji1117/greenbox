// app/api/recipes/today/route.ts
// 홈 카드의 오늘의 초간단 레시피
// GET: 곧 먹어야 할 재료와 저장된 레시피만 알려 준다 (새로 만들지 않음, 비용 없음)
// POST: 저장된 레시피가 없으면 새로 만든다 (사람마다 하루 횟수 제한)

import { NextResponse } from 'next/server';
import {
  invalidRequest,
  notFound,
  requireFridgeMember,
  requireUser,
} from '@/app/api/items/guard';
import { listItems } from '@/app/lib/items/store';
import { generateRecipe } from '@/app/lib/recipes/generateRecipe';
import {
  countRecentGenerations,
  findRecipeByKey,
  recordGeneration,
  saveRecipe,
} from '@/app/lib/recipes/store';
import {
  DAILY_RECIPE_LIMIT,
  isRecipeAvailable,
  pickIngredients,
  recipeCacheKey,
  toRecipeJson,
} from '@/app/lib/recipes/today';
import {
  TodayRecipeQuerySchema,
  TodayRecipeRequestSchema,
} from '@/app/lib/schemas/recipe';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

async function load(userId: string, fridgeId: string) {
  const items = await listItems(fridgeId, userId);
  const { soon, otherNames } = pickIngredients(items);
  const fridgeNames = items.filter(i => !i.finished).map(i => i.name);
  return { soon, otherNames, fridgeNames };
}

export async function GET(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const parsed = TodayRecipeQuerySchema.safeParse({
    fridgeId: new URL(request.url).searchParams.get('fridgeId'),
  });
  if (!parsed.success) return notFound();
  const member = await requireFridgeMember(userId, parsed.data.fridgeId);
  if (member.response) return member.response;

  if (!isRecipeAvailable(userId)) {
    return NextResponse.json({ available: false }, { headers: NO_STORE });
  }
  const { soon, fridgeNames } = await load(userId, parsed.data.fridgeId);
  const soonNames = soon.map(i => i.name);
  const stored =
    soonNames.length > 0
      ? await findRecipeByKey(recipeCacheKey(soonNames))
      : null;
  return NextResponse.json(
    {
      available: true,
      soonNames,
      recipe: stored ? toRecipeJson(stored, fridgeNames, soon) : null,
    },
    { headers: NO_STORE },
  );
}

export async function POST(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const parsed = TodayRecipeRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);
  const member = await requireFridgeMember(userId, parsed.data.fridgeId);
  if (member.response) return member.response;
  if (!isRecipeAvailable(userId)) return notFound();

  const { soon, otherNames, fridgeNames } = await load(
    userId,
    parsed.data.fridgeId,
  );
  const soonNames = soon.map(i => i.name);
  if (soonNames.length === 0) {
    return NextResponse.json({ error: 'nothing_soon' }, { status: 409 });
  }
  const key = recipeCacheKey(soonNames);
  const stored = await findRecipeByKey(key);
  if (stored) {
    return NextResponse.json(toRecipeJson(stored, fridgeNames, soon), {
      headers: NO_STORE,
    });
  }

  if ((await countRecentGenerations(userId, 'recipe')) >= DAILY_RECIPE_LIMIT) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  await recordGeneration(userId, 'recipe');
  const result = await generateRecipe(soonNames, otherNames);
  if (result.status === 'unavailable') {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (result.status === 'failed') {
    return NextResponse.json({ error: 'recipe_failed' }, { status: 502 });
  }
  const saved = await saveRecipe(key, result.recipe);
  return NextResponse.json(toRecipeJson(saved, fridgeNames, soon), {
    status: 201,
    headers: NO_STORE,
  });
}
