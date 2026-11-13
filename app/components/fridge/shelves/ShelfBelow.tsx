'use client';
// app/components/fridge/shelves/ShelfBelow.tsx
// 선반 보기 아래 영역: 나의 메모 | 지금 날씨, 오늘 뭐 먹지 3개, 빨리 먹어야 할 식재료
// 무엇을 먹을지 정해야 장을 보므로, 냉장고 재료로 고른 요리를 보여 주고 빠진 재료는 장보기에 바로 담는다

import React, { useState } from 'react';
import { ClockIcon, ShoppingBasket } from 'lucide-react';
import BottomSheet from '@/app/components/common/BottomSheet';
import { ItemThumb } from '@/app/components/fridge/shelves/FridgeShelfView';
import { track } from '@/app/lib/analytics/gtag';
import { pickUrgent } from '@/app/lib/items/urgent';
import { foodIconFor } from '@/app/lib/shelves/foodIcons';
import {
  seasonOf,
  SEASON_LABEL,
  suggestRecipes,
  type Suggestion,
} from '@/app/lib/recipes/suggest';
import type { Item } from '@/app/lib/schemas/item';
import { useWeather } from '@/app/lib/weather/useWeather';
import {
  MOOD_LINE,
  weatherLabel,
  weatherMood,
} from '@/app/lib/weather/weather';

const CARD =
  'rounded-2xl bg-white shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5';

interface ShelfBelowProps {
  items: Item[];
  fridgeId: string;
  onOpenItem: (item: Item) => void;
  onAddToList: (names: string[]) => void;
}

// 나의 메모: 이 기기에만 저장한다 (가족에게 보이지 않는다). 저장소를 못 쓰면 이번 화면에서만 남는다
const memoKey = (fridgeId: string) => `greenbox:memo:${fridgeId}`;

const MemoCard: React.FC<{ fridgeId: string }> = ({ fridgeId }) => {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(memoKey(fridgeId)) ?? '';
    } catch {
      return '';
    }
  });
  return (
    <label className={`flex min-w-0 flex-col p-3 ${CARD} bg-[#FFFBEA]`}>
      <span className="text-xs font-bold text-amber-900">나의 메모</span>
      <textarea
        value={text}
        maxLength={300}
        onChange={e => {
          setText(e.target.value);
          try {
            localStorage.setItem(memoKey(fridgeId), e.target.value);
          } catch {
            // 저장소를 못 쓰는 환경은 화면에만 남긴다
          }
        }}
        placeholder="장 볼 때 떠올릴 것"
        rows={3}
        className="mt-1 w-full flex-1 resize-none bg-transparent text-base leading-snug text-gray-800 placeholder:text-amber-900/40 focus:outline-none"
      />
      <span className="text-[10px] text-amber-900/60">나만 보여요</span>
    </label>
  );
};

const WeatherCard: React.FC = () => {
  const { data: weather } = useWeather();
  const season = SEASON_LABEL[seasonOf(new Date())];
  return (
    <div
      className={`flex min-w-0 flex-col justify-between p-3 ${CARD} bg-[#F1F5FD]`}
    >
      <span className="text-xs font-bold text-[#2F5C99]">서울 날씨</span>
      {weather ? (
        <p className="mt-1 text-2xl font-bold text-gray-800">
          {Math.round(weather.temperature)}°
          <span className="ml-1 text-sm font-semibold text-gray-600">
            {weatherLabel(weather.code)}
          </span>
        </p>
      ) : (
        <p className="mt-1 text-lg font-bold text-gray-800">{season}</p>
      )}
      <p className="text-xs leading-snug text-gray-600">
        {weather
          ? MOOD_LINE[weatherMood(weather)]
          : `${season} 제철 요리로 골랐어요`}
      </p>
    </div>
  );
};

const RecipeSheet: React.FC<{
  suggestion: Suggestion | null;
  onClose: () => void;
  onAddMissing: (suggestion: Suggestion) => void;
}> = ({ suggestion, onClose, onAddMissing }) => (
  <BottomSheet
    isOpen={suggestion !== null}
    title={suggestion?.recipe.title ?? ''}
    onClose={onClose}
  >
    {suggestion && (
      <div className="space-y-4">
        <p className="flex items-center gap-1 text-sm text-gray-500">
          <ClockIcon size={14} /> {suggestion.recipe.minutes}분
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {suggestion.recipe.ingredients.map(({ name, amount }) => {
            const has = suggestion.have.includes(name);
            return (
              <li
                key={name}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  has
                    ? 'bg-[#F1EDFA] font-semibold text-[#553C9A]'
                    : 'bg-gray-100 text-gray-500 line-through decoration-gray-300'
                }`}
              >
                {name} {amount}
              </li>
            );
          })}
        </ul>
        <ol className="space-y-2">
          {suggestion.recipe.steps.map((step, i) => (
            <li
              key={step}
              className="flex gap-2 text-[15px] leading-relaxed text-gray-800"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6B46C1] text-xs font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        {suggestion.missing.length > 0 ? (
          <button
            type="button"
            onClick={() => onAddMissing(suggestion)}
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-[#6B46C1] text-sm font-semibold text-white transition-colors hover:bg-[#603fad]"
          >
            <ShoppingBasket size={18} />
            빠진 재료 {suggestion.missing.length}개 장보기에 담기
          </button>
        ) : (
          <p className="rounded-xl bg-[#F1EDFA] p-3 text-center text-sm font-semibold text-[#553C9A]">
            재료가 모두 냉장고에 있어요
          </p>
        )}
      </div>
    )}
  </BottomSheet>
);

const ShelfBelow: React.FC<ShelfBelowProps> = ({
  items,
  fridgeId,
  onOpenItem,
  onAddToList,
}) => {
  const { data: weather } = useWeather();
  const suggestions = suggestRecipes({
    items,
    season: seasonOf(new Date()),
    mood: weather ? weatherMood(weather) : null,
  });
  const urgent = pickUrgent(items);
  const [opened, setOpened] = useState<Suggestion | null>(null);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MemoCard fridgeId={fridgeId} />
        <WeatherCard />
      </div>

      <section aria-labelledby="today-meal-title">
        <h2
          id="today-meal-title"
          className="mb-2 px-1 text-sm font-bold text-gray-800"
        >
          오늘 뭐 먹지
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {suggestions.map((suggestion, rank) => {
            const { recipe, have, usesSoon } = suggestion;
            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => {
                  setOpened(suggestion);
                  track('meal_suggestion_opened', {
                    recipe: recipe.id,
                    rank: rank + 1,
                    uses_soon: usesSoon.length,
                  });
                }}
                className={`flex min-w-0 flex-col items-center gap-1 p-2.5 text-center transition-colors active:bg-gray-50 ${CARD}`}
              >
                <ItemThumb
                  name={
                    // 완성 요리 그림이 있으면 요리 그림, 없으면 먼저 쓸 재료 그림
                    foodIconFor(recipe.title)
                      ? recipe.title
                      : (usesSoon[0] ?? have[0] ?? recipe.ingredients[0].name)
                  }
                  size="md"
                />
                <span className="w-full truncate text-sm font-semibold text-gray-800">
                  {recipe.title}
                </span>
                <span className="text-[11px] text-gray-500">
                  재료 {have.length}/{recipe.ingredients.length}
                </span>
                {usesSoon.length > 0 && (
                  <span className="w-full truncate rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                    {usesSoon[0]} 먼저
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="urgent-title">
        <h2
          id="urgent-title"
          className="mb-2 px-1 text-sm font-bold text-gray-800"
        >
          빨리 먹어야 할 식재료
        </h2>
        {urgent.length === 0 ? (
          <p className={`p-4 text-center text-sm text-gray-500 ${CARD}`}>
            급하게 먹어야 할 식재료는 없어요
          </p>
        ) : (
          // 옆으로 밀어 더 본다. 누르면 그 식재료가 놓인 선반 목록으로 간다
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {urgent.map(({ item, label, isExpiry }) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onOpenItem(item);
                  track('urgent_item_opened', {
                    reason: isExpiry ? 'expiry' : 'low_stock',
                  });
                }}
                className={`flex w-[84px] shrink-0 snap-start flex-col items-center gap-1 p-2 ${CARD}`}
              >
                <ItemThumb name={item.name} size="md" />
                <span className="w-full truncate text-center text-xs font-semibold text-gray-800">
                  {item.name}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isExpiry
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <RecipeSheet
        suggestion={opened}
        onClose={() => setOpened(null)}
        onAddMissing={suggestion => {
          onAddToList(suggestion.missing);
          track('meal_suggestion_missing_added', {
            recipe: suggestion.recipe.id,
            count: suggestion.missing.length,
          });
          setOpened(null);
        }}
      />
    </div>
  );
};

export default ShelfBelow;
