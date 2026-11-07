// app/lib/recipes/store.ts
// 레시피와 레시피 그림 저장, 하루 만들기 횟수 (서버 전용)
// 레시피는 재료 조합으로만 찾고 누가 만들었는지는 저장하지 않는다

import { getPool } from '@/app/lib/db';
import type { GeneratedRecipe } from '@/app/lib/recipes/generateRecipe';

export interface StoredRecipe extends GeneratedRecipe {
  id: string;
}

interface RecipeRow {
  id: string;
  title: string;
  minutes: number;
  ingredients: GeneratedRecipe['ingredients'];
  steps: GeneratedRecipe['steps'];
  caution: string | null;
}

const toStored = (row: RecipeRow): StoredRecipe => ({
  id: String(row.id),
  title: row.title,
  minutes: row.minutes,
  ingredients: row.ingredients,
  steps: row.steps,
  caution: row.caution,
});

const SELECT = `SELECT id::text, title, minutes, ingredients, steps, caution FROM recipes`;

export async function findRecipeByKey(
  cacheKey: string,
): Promise<StoredRecipe | null> {
  const { rows } = await getPool().query<RecipeRow>(
    `${SELECT} WHERE cache_key = $1`,
    [cacheKey],
  );
  return rows[0] ? toStored(rows[0]) : null;
}

export async function getRecipe(id: string): Promise<StoredRecipe | null> {
  const { rows } = await getPool().query<RecipeRow>(`${SELECT} WHERE id = $1`, [
    id,
  ]);
  return rows[0] ? toStored(rows[0]) : null;
}

// 같은 조합을 두 사람이 동시에 만들면 먼저 저장된 것을 쓴다
export async function saveRecipe(
  cacheKey: string,
  recipe: GeneratedRecipe,
): Promise<StoredRecipe> {
  const { rows } = await getPool().query<RecipeRow>(
    `INSERT INTO recipes (cache_key, title, minutes, ingredients, steps, caution)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
     ON CONFLICT (cache_key) DO NOTHING
     RETURNING id::text, title, minutes, ingredients, steps, caution`,
    [
      cacheKey,
      recipe.title,
      recipe.minutes,
      JSON.stringify(recipe.ingredients),
      JSON.stringify(recipe.steps),
      recipe.caution,
    ],
  );
  if (rows[0]) return toStored(rows[0]);
  const existing = await findRecipeByKey(cacheKey);
  if (!existing) throw new Error('저장한 레시피를 찾지 못했습니다');
  return existing;
}

export async function getRecipeImage(
  recipeId: string,
  slot: number,
): Promise<{ mime: string; content: Buffer } | null> {
  const { rows } = await getPool().query<{ mime: string; content: Buffer }>(
    `SELECT mime, content FROM recipe_images WHERE recipe_id = $1 AND slot = $2`,
    [recipeId, slot],
  );
  return rows[0] ?? null;
}

export async function saveRecipeImage(
  recipeId: string,
  slot: number,
  mime: string,
  content: Buffer,
): Promise<void> {
  await getPool().query(
    `INSERT INTO recipe_images (recipe_id, slot, mime, content)
     VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
    [recipeId, slot, mime, content],
  );
}

export type GenerationKind = 'recipe' | 'image';

// 최근 24시간 동안 새로 만든 횟수
export async function countRecentGenerations(
  userId: string,
  kind: GenerationKind,
): Promise<number> {
  const { rows } = await getPool().query<{ n: number }>(
    `SELECT count(*)::int AS n FROM recipe_generations
     WHERE user_id = $1 AND kind = $2 AND created_at > now() - interval '24 hours'`,
    [Number(userId), kind],
  );
  return rows[0].n;
}

export async function recordGeneration(
  userId: string,
  kind: GenerationKind,
): Promise<void> {
  await getPool().query(
    `INSERT INTO recipe_generations (user_id, kind) VALUES ($1, $2)`,
    [Number(userId), kind],
  );
}
