// app/api/recipes/[id]/image/[slot]/route.ts
// 레시피 그림. slot 0은 완성 사진, 1부터 단계 그림
// 저장된 그림이 있으면 바로 돌려주고, 없으면 그때 만든다 (단계 그림은 사용자가 그 단계를 열 때만 요청한다)

import { NextResponse } from 'next/server';
import { notFound, requireUser } from '@/app/api/items/guard';
import {
  generateImage,
  heroPrompt,
  stepPrompt,
} from '@/app/lib/recipes/generateImage';
import {
  countRecentGenerations,
  getRecipe,
  getRecipeImage,
  recordGeneration,
  saveRecipeImage,
} from '@/app/lib/recipes/store';
import { DAILY_IMAGE_LIMIT, isRecipeAvailable } from '@/app/lib/recipes/today';
import { RecipeImageSlotSchema } from '@/app/lib/schemas/recipe';

const ID = /^\d{1,18}$/;

function imageResponse(mime: string, content: Buffer) {
  return new NextResponse(new Uint8Array(content), {
    headers: {
      'Content-Type': mime,
      // 같은 레시피 그림은 바뀌지 않는다. 로그인 사용자 화면이라 공용 캐시에는 두지 않는다
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; slot: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const { id, slot: rawSlot } = await params;
  const slot = RecipeImageSlotSchema.safeParse(rawSlot);
  if (!ID.test(id) || !slot.success) return notFound();

  const existing = await getRecipeImage(id, slot.data);
  if (existing) return imageResponse(existing.mime, existing.content);

  if (!isRecipeAvailable(userId)) return notFound();
  const recipe = await getRecipe(id);
  if (!recipe) return notFound();
  const step = slot.data === 0 ? null : recipe.steps[slot.data - 1];
  if (slot.data > 0 && !step) return notFound();

  if ((await countRecentGenerations(userId, 'image')) >= DAILY_IMAGE_LIMIT) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  await recordGeneration(userId, 'image');
  const result = step
    ? await generateImage(stepPrompt(recipe.title, step.text), 'low')
    : await generateImage(
        heroPrompt(
          recipe.title,
          recipe.ingredients.map(i => i.name),
        ),
        'medium',
      );
  if (result.status === 'unavailable') {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (result.status === 'failed') {
    return NextResponse.json({ error: 'image_failed' }, { status: 502 });
  }
  await saveRecipeImage(id, slot.data, result.mime, result.content);
  return imageResponse(result.mime, result.content);
}
