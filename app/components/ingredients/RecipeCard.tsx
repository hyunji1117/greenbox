'use client';
// app/components/ingredients/RecipeCard.tsx
// 홈 추천 카드: 곧 먹어야 할 재료로 만드는 초간단 레시피
// 이미 만든 레시피가 있으면 바로 열고, 없으면 버튼을 눌렀을 때만 새로 만든다 (만들 때마다 비용이 든다)
// 처음 만들거나 열 때 한 번, 품목 이름을 Anthropic, OpenAI(미국)로 보내는 것에 동의를 받는다 (방침 2026-11-09)

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ChefHat, ChevronRightIcon, Loader2Icon } from 'lucide-react';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import RecipeSheet from '@/app/components/ingredients/RecipeSheet';
import { ApiError } from '@/app/lib/api/apiFetch';
import { track } from '@/app/lib/analytics/gtag';
import { RECIPE_POLICY_VERSION } from '@/app/lib/consent/policies';
import {
  useMakeRecipe,
  useTodayRecipe,
} from '@/app/lib/recipes/useTodayRecipe';

// "두부로", "연근으로": 받침이 없거나 ㄹ 받침이면 로, 그 밖의 받침이면 으로
export function withDirectionParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}로`;
  const batchim = code % 28;
  return batchim === 0 || batchim === 8 ? `${word}로` : `${word}으로`;
}

function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429)
      return '오늘은 레시피를 충분히 만들었어요. 내일 다시 만들어 주세요';
    if (error.status === 503) return '레시피 만들기는 아직 준비 중이에요';
    if (error.status === 409) return '곧 먹어야 할 재료가 없어요';
  }
  return '레시피를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요';
}

// 동의한 방침 버전을 이 기기에 기억한다. 방침에서 레시피 내용이 바뀌면 버전을 올려 다시 묻는다
export const RECIPE_AGREED_KEY = 'greenbox_recipe_agreed';
const subscribe = () => () => {};
function readAgreed(): boolean {
  try {
    return localStorage.getItem(RECIPE_AGREED_KEY) === RECIPE_POLICY_VERSION;
  } catch {
    return false;
  }
}

const RecipeCard: React.FC = () => {
  const today = useTodayRecipe();
  const make = useMakeRecipe();
  const [isOpen, setIsOpen] = useState(false);
  const storedAgreed = useSyncExternalStore(subscribe, readAgreed, () => false);
  const [agreedNow, setAgreedNow] = useState(false);
  const isAgreed = storedAgreed || agreedNow;
  const [isAsking, setIsAsking] = useState(false);

  const data = today.data;
  if (!data || !data.available || data.soonNames.length === 0) return null;
  const recipe = data.recipe;
  const names = data.soonNames.join(', ');

  const open = async () => {
    if (!isAgreed) {
      setIsAsking(true);
      return;
    }
    if (recipe) {
      track('recipe_opened');
      setIsOpen(true);
      return;
    }
    const made = await make.mutateAsync().catch(() => null);
    if (made) setIsOpen(true);
  };

  return (
    <section className={`mb-4 p-4 ${SURFACE}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#6B46C1]">
          <ChefHat size={22} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-900">
            {recipe ? recipe.title : '초간단 레시피 어때요?'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-600">
            곧 먹어야 할 {withDirectionParticle(names)}{' '}
            {recipe ? `약 ${recipe.minutes}분이면 돼요` : '금방 만들 수 있어요'}
          </p>
        </div>
      </div>
      {isAsking && !isAgreed ? (
        <div className="mt-3 rounded-xl bg-[#F8F6FD] p-3">
          <p className="text-xs leading-relaxed text-gray-700">
            레시피를 만들려고 냉장고 품목 이름을 Anthropic(미국)에, 요리와 재료
            이름을 OpenAI(미국)에 보내요. 누가 만들었는지는 보내지 않아요.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Link
              href="/privacy"
              className="flex h-[42px] items-center px-1 text-xs text-gray-500 underline underline-offset-2"
            >
              개인정보처리방침
            </Link>
            <button
              type="button"
              onClick={() => setIsAsking(false)}
              className="ml-auto h-[42px] rounded-xl px-3 text-sm font-medium text-gray-600 active:bg-gray-100"
            >
              다음에
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem(
                    RECIPE_AGREED_KEY,
                    RECIPE_POLICY_VERSION,
                  );
                } catch {
                  // 저장하지 못해도 이번에는 동의한 것으로 진행한다
                }
                setAgreedNow(true);
                setIsAsking(false);
                track('recipe_consent_agreed');
              }}
              className="h-[42px] rounded-xl bg-[#6B46C1] px-4 text-sm font-semibold text-white active:bg-[#553C9A]"
            >
              동의하고 계속
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={open}
          disabled={make.isPending}
          className="mt-3 flex h-11 w-full items-center justify-center gap-1 rounded-xl bg-[#6B46C1] text-sm font-semibold text-white transition-colors hover:bg-[#603fad] disabled:opacity-70"
        >
          {make.isPending ? (
            <>
              <Loader2Icon size={16} className="motion-safe:animate-spin" />
              레시피를 만들고 있어요
            </>
          ) : (
            <>
              {recipe ? '레시피 보기' : '레시피 만들기'}
              <ChevronRightIcon size={16} />
            </>
          )}
        </button>
      )}
      {make.isError && (
        <p role="alert" className="mt-2 text-center text-xs text-red-500">
          {errorText(make.error)}
        </p>
      )}
      <RecipeSheet
        recipe={isOpen ? (recipe ?? make.data ?? null) : null}
        onClose={() => setIsOpen(false)}
      />
    </section>
  );
};

export default RecipeCard;
