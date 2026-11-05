'use client';
// app/components/ingredients/IngredientsBoard.tsx
// 홈: 앱을 열자마자 할 일. 먼저 먹을 품목과 살 것만 보여 준다
// 전체 개수 같은 수치는 통계 탭, 식재료 고르기는 장보기 탭, 알림 설정은 마이 탭에 있다

import React, { useState } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { EXPIRY_SOON_DAYS, expiryLabel } from '@/app/lib/items/expiry';
import { summarizeItems } from '@/app/lib/items/summary';
import { useItems } from '@/app/lib/items/useItems';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';

// 홈에서 미리 보여 줄 살 것 수
const MAX_SHOPPING_PREVIEW = 4;

interface IngredientsBoardProps {
  onGoToFridge: () => void;
  onGoToList: () => void;
}

const SectionHeader: React.FC<{
  title: string;
  actionLabel: string;
  onAction: () => void;
}> = ({ title, actionLabel, onAction }) => (
  <div className="mb-2 flex items-center justify-between gap-3">
    <h2 className="text-base font-semibold">{title}</h2>
    <button
      type="button"
      onClick={onAction}
      className="flex h-9 shrink-0 items-center text-sm font-medium text-[#6B46C1]"
    >
      {actionLabel}
      <ChevronRightIcon size={16} />
    </button>
  </div>
);

const IngredientsBoard: React.FC<IngredientsBoardProps> = ({
  onGoToFridge,
  onGoToList,
}) => {
  const { data: items = [], isPending, error } = useItems();
  const summary = summarizeItems(items);
  // 장보기 리스트는 이 기기에 저장된다. 홈은 탭을 열 때마다 새로 그려지므로 처음 한 번만 읽는다
  const [shoppingList] = useState(() =>
    shoppingListStorage.loadShoppingList().filter(item => !item.completed),
  );

  const summaryText = isPending
    ? '불러오는 중...'
    : error
      ? '품목을 불러오지 못했어요'
      : summary.expiringSoonCount > 0
        ? `유통기한이 ${EXPIRY_SOON_DAYS}일 안에 끝나는 품목이 ${summary.expiringSoonCount}개 있어요`
        : '급하게 먹어야 할 품목은 없어요';

  return (
    <div className="p-4 pb-24 sm:p-6 sm:pb-24">
      <h1 className="text-xl font-semibold">오늘 할 일</h1>
      <p className="mt-1 mb-4 text-sm text-gray-500">{summaryText}</p>

      <section className={`mb-4 p-4 ${SURFACE}`}>
        <SectionHeader
          title="바로 꺼내기"
          actionLabel="냉장고 보기"
          onAction={onGoToFridge}
        />
        {summary.expiringFirst.length === 0 ? (
          <p className="rounded-xl bg-[#F4F4F8] px-3 py-4 text-center text-sm text-balance text-gray-500">
            냉장고에 유통기한을 넣으면 먼저 먹을 품목을 알려 드려요
          </p>
        ) : (
          <ul className="space-y-2">
            {summary.expiringFirst.map(({ item, days }) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-[#F4F4F8] px-3 py-2.5"
              >
                <span className="min-w-0 truncate text-sm font-semibold text-gray-800">
                  {item.name}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    days <= EXPIRY_SOON_DAYS
                      ? 'bg-red-50 text-red-600'
                      : 'bg-[#F1EDFA] text-[#553C9A]'
                  }`}
                >
                  {expiryLabel(days)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`p-4 ${SURFACE}`}>
        <SectionHeader
          title="살 것"
          actionLabel={shoppingList.length > 0 ? '리스트 보기' : '담으러 가기'}
          onAction={onGoToList}
        />
        {shoppingList.length === 0 ? (
          <p className="rounded-xl bg-[#F4F4F8] px-3 py-4 text-center text-sm text-balance text-gray-500">
            장보기 리스트가 비어 있어요
          </p>
        ) : (
          <>
            <ul className="flex flex-wrap gap-2">
              {shoppingList.slice(0, MAX_SHOPPING_PREVIEW).map(item => (
                <li
                  key={item.id}
                  className="max-w-full truncate rounded-full bg-[#F4F4F8] px-3 py-1.5 text-sm font-medium text-gray-800"
                >
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="ml-1 text-gray-500">{item.quantity}</span>
                  )}
                </li>
              ))}
            </ul>
            {shoppingList.length > MAX_SHOPPING_PREVIEW && (
              <p className="mt-2 text-xs text-gray-500">
                외 {shoppingList.length - MAX_SHOPPING_PREVIEW}개
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default IngredientsBoard;
