'use client';
// app/components/ingredients/RecipeSheet.tsx
// 초간단 레시피 보기: 완성 사진, 재료(있음 / 살 것), 단계, 주의
// 단계 그림은 사용자가 그 단계의 "그림 보기"를 눌렀을 때만 만든다 (그림마다 비용과 시간이 든다)

/* eslint-disable @next/next/no-img-element -- 로그인한 사용자만 받는 그림이라 이미지 최적화 서버를 거치지 않는다 */

import React, { useState } from 'react';
import {
  Check,
  Clock,
  ImageIcon,
  Loader2Icon,
  ShoppingBasket,
} from 'lucide-react';
import BottomSheet from '@/app/components/common/BottomSheet';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { track } from '@/app/lib/analytics/gtag';
import { useUpdateItem } from '@/app/lib/items/useItems';
import {
  recipeImageUrl,
  useRefreshAfterCooking,
} from '@/app/lib/recipes/useTodayRecipe';
import type { Recipe } from '@/app/lib/schemas/recipe';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';

// 그림을 만드는 동안(수십 초까지)과 실패를 함께 보여 주는 그림 칸
const RecipeImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#F4F4F8]">
      {state !== 'error' && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setState('done')}
          onError={() => setState('error')}
          className={`h-full w-full object-cover transition-opacity ${state === 'done' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {state === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2Icon
            size={24}
            className="text-[#6B46C1] motion-safe:animate-spin"
          />
          그림을 그리고 있어요
        </div>
      )}
      {state === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-gray-500">
          그림을 만들지 못했어요. 글을 보고 따라 해 주세요
        </div>
      )}
    </div>
  );
};

interface RecipeSheetProps {
  recipe: Recipe | null;
  onClose: () => void;
}

const RecipeSheet: React.FC<RecipeSheetProps> = ({ recipe, onClose }) => {
  const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());
  const [isAdded, setIsAdded] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const updateItem = useUpdateItem();
  const refresh = useRefreshAfterCooking();

  const missing = recipe?.ingredients.filter(i => !i.have) ?? [];

  const addMissing = () => {
    for (const ingredient of missing) {
      shoppingListStorage.addToShoppingList(ingredient.name);
    }
    track('recipe_missing_added', { count: missing.length });
    setIsAdded(true);
  };

  const finishCooking = async () => {
    if (!recipe || isFinishing) return;
    setIsFinishing(true);
    const results = await Promise.allSettled(
      recipe.usedItemIds.map(id =>
        updateItem.mutateAsync({ id, updates: { finished: true } }),
      ),
    );
    track('recipe_cooked', {
      finished: results.filter(r => r.status === 'fulfilled').length,
    });
    await refresh();
    setIsFinishing(false);
    onClose();
  };

  const toggleStep = (index: number) => {
    setOpenSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else {
        next.add(index);
        track('recipe_step_image_opened');
      }
      return next;
    });
  };

  return (
    <BottomSheet
      isOpen={recipe !== null}
      title={recipe?.title ?? '초간단 레시피'}
      onClose={onClose}
    >
      {recipe && (
        <div className="space-y-4">
          <RecipeImage
            src={recipeImageUrl(recipe.id, 0)}
            alt={`${recipe.title} 완성 사진`}
          />
          <p className="flex items-center gap-1.5 px-1 text-sm text-gray-600">
            <Clock size={16} aria-hidden />약 {recipe.minutes}분
          </p>

          <section className={`p-4 ${SURFACE}`}>
            <h3 className="mb-2 text-sm font-semibold text-gray-800">재료</h3>
            <ul className="space-y-1.5">
              {recipe.ingredients.map(i => (
                <li
                  key={i.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate text-gray-800">
                    {i.name} <span className="text-gray-500">{i.amount}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      i.have
                        ? 'bg-[#F1EDFA] text-[#553C9A]'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {i.have ? '있음' : '살 것'}
                  </span>
                </li>
              ))}
            </ul>
            {missing.length > 0 && (
              <button
                type="button"
                onClick={addMissing}
                disabled={isAdded}
                className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#F1EDFA] text-sm font-semibold text-[#553C9A] disabled:opacity-70"
              >
                {isAdded ? (
                  <>
                    <Check size={16} /> 리스트에 담았어요
                  </>
                ) : (
                  <>
                    <ShoppingBasket size={16} /> 살 것 {missing.length}개
                    리스트에 담기
                  </>
                )}
              </button>
            )}
          </section>

          <section>
            <h3 className="mb-2 px-1 text-sm font-semibold text-gray-800">
              만드는 순서
            </h3>
            <ol className="space-y-2">
              {recipe.steps.map((step, index) => (
                <li key={index} className={`p-3 ${SURFACE}`}>
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6B46C1] text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="min-w-0 flex-1 pt-0.5 text-[15px] leading-relaxed text-gray-800">
                      {step.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleStep(index)}
                    aria-expanded={openSteps.has(index)}
                    className="mt-2 ml-10 flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-[#553C9A] hover:bg-[#F1EDFA]"
                  >
                    <ImageIcon size={14} aria-hidden />
                    {openSteps.has(index) ? '그림 접기' : '그림 보기'}
                  </button>
                  {openSteps.has(index) && (
                    <div className="mt-2">
                      <RecipeImage
                        src={recipeImageUrl(recipe.id, index + 1)}
                        alt={`${index + 1}단계 그림`}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {recipe.caution && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {recipe.caution}
            </p>
          )}
          <p className="px-1 text-xs text-gray-500">
            AI가 만든 레시피예요. 재료 상태를 확인하고, 고기와 해산물은 속까지
            익혀 주세요.
          </p>

          {recipe.usedItemIds.length > 0 && (
            <button
              type="button"
              onClick={finishCooking}
              disabled={isFinishing}
              className="h-12 w-full rounded-2xl bg-[#6B46C1] text-sm font-semibold text-white transition-colors hover:bg-[#603fad] disabled:opacity-60"
            >
              {isFinishing
                ? '정리하는 중...'
                : `다 만들었어요 (쓴 재료 ${recipe.usedItemIds.length}개 다 먹음)`}
            </button>
          )}
        </div>
      )}
    </BottomSheet>
  );
};

export default RecipeSheet;
