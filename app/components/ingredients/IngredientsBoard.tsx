// app/components/IngredientsBoard.tsx
// 식재료 보드 컴포넌트

'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { BellIcon, ChevronRightIcon, Plus } from 'lucide-react';
import SegmentedTabs, { SURFACE } from '@/app/components/common/SegmentedTabs';
import ExpiryDateSetting from '@/app/components/fridge/ExpiryDateSetting';
import { mockItems, type FridgeItem } from '@/app/data/mockItems';
import { EXPIRY_SOON_DAYS, expiryLabel } from '@/app/lib/items/expiry';
import { summarizeItems } from '@/app/lib/items/summary';
import { useItems } from '@/app/lib/items/useItems';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';

export interface ShoppingListItem {
  id: number;
  name: string;
  quantity: number;
  completed: boolean;
}

interface IngredientsBoardProps {
  shoppingList?: ShoppingListItem[];
  addToShoppingList?: (name: string, quantity?: number) => void;
  itemPurchaseCounts?: Map<string, number>;
  onGoToFridge?: () => void;
}

const CATEGORY_TABS = [
  { id: 'vegetables', label: '채소' },
  { id: 'fruits', label: '과일' },
  { id: 'meat', label: '고기' },
  { id: 'seafood', label: '해산물' },
] as const;

const LOCATION_CARDS = [
  {
    id: 'fridge',
    name: '냉장실',
    image:
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=720&q=80',
  },
  {
    id: 'freezer',
    name: '냉동실',
    image:
      'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=720&q=80',
  },
  {
    id: 'pantry',
    name: '저장고',
    image:
      'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=720&q=80',
  },
] as const;

const IngredientsBoard: React.FC<IngredientsBoardProps> = props => {
  const { shoppingList, addToShoppingList, itemPurchaseCounts, onGoToFridge } =
    props;
  const { data: items = [], isPending, error } = useItems();
  const summary = summarizeItems(items);

  // 프롭이 없을 때를 위한 내부 fallback 상태
  const [internalList, setInternalList] = useState<ShoppingListItem[]>(
    () => shoppingList ?? shoppingListStorage.loadShoppingList(),
  );
  const list = shoppingList ?? internalList;

  const safeAdd = useCallback(
    (name: string, quantity = 1) => {
      if (addToShoppingList) return addToShoppingList(name, quantity);
      // 프롭이 없으면 내부 상태 + 로컬스토리지에 저장
      setInternalList(prev => {
        const exists = prev.find(i => i.name === name);
        if (exists) {
          const next = prev.map(i =>
            i.name === name ? { ...i, quantity: i.quantity + quantity } : i,
          );
          shoppingListStorage.saveShoppingList(next);
          return next;
        }
        const next = [
          ...prev,
          { id: Date.now(), name, quantity, completed: false },
        ];
        shoppingListStorage.saveShoppingList(next);
        return next;
      });
    },
    [addToShoppingList],
  );

  const counts = itemPurchaseCounts ?? new Map<string, number>();

  // ===== 기존 UI 상태들 =====
  const [activeCategory, setActiveCategory] = useState<string>('vegetables');
  const filteredItems = useMemo<FridgeItem[]>(
    () => mockItems.filter(i => i.category === activeCategory),
    [activeCategory],
  );

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleItemClick = useCallback(
    (itemName: string) => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => {
        safeAdd(itemName);
      }, 50);
    },
    [safeAdd],
  );

  const openNotificationSetting = (itemId: number) => {
    setSelectedItemId(itemId);
    setShowBottomSheet(true);
  };

  const getSelectedItemName = () => {
    const item = mockItems.find(m => m.id === selectedItemId);
    return item ? item.name : '식재료';
  };

  // 이미지 에러 처리 함수
  const handleImageError = (itemId: number) => {
    // 대체 이미지까지 실패해도 다시 렌더링하지 않아 요청이 반복되지 않는다
    setImageErrors(prev =>
      prev.has(itemId) ? prev : new Set(prev).add(itemId),
    );
  };

  // 이미지 URL 처리 함수 (URL 디코딩 및 폴백)
  const getImageUrl = (item: FridgeItem) => {
    // 이미지 에러가 발생한 경우 플레이스홀더 반환
    if (imageErrors.has(item.id)) {
      return '/images/placeholder.jpg';
    }

    // URL 디코딩 처리
    try {
      const decodedUrl = decodeURIComponent(item.imageUrl);
      return decodedUrl;
    } catch {
      return item.imageUrl;
    }
  };

  const summaryText = isPending
    ? '불러오는 중...'
    : error
      ? '품목을 불러오지 못했어요'
      : `품목 ${summary.total}개, 유통기한 임박 ${summary.expiringSoonCount}개`;

  return (
    <div className="p-4 pb-24 sm:p-6 sm:pb-24">
      <h1 className="text-xl font-semibold">우리집 식료품</h1>
      <p className="mt-1 mb-4 text-sm text-gray-500">{summaryText}</p>

      <section className={`mb-4 p-4 ${SURFACE}`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">바로 꺼내기</h2>
          <button
            type="button"
            onClick={onGoToFridge}
            className="flex h-9 shrink-0 items-center text-sm font-medium text-[#6B46C1]"
          >
            전체 보기
            <ChevronRightIcon size={16} />
          </button>
        </div>
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

      <section className="mb-6">
        <h2 className="mb-2 text-base font-semibold">보관 위치</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {LOCATION_CARDS.map(card => (
            <button
              key={card.id}
              type="button"
              onClick={onGoToFridge}
              aria-label={`${card.name} ${summary.byCategory[card.id]}개, 냉장고 탭으로 이동`}
              className="relative h-28 overflow-hidden rounded-2xl bg-cover bg-center sm:h-36"
              style={{ backgroundImage: `url(${card.image})` }}
            >
              <span className="absolute inset-0 bg-black/30" />
              <span className="absolute inset-x-1 bottom-3 text-center text-white">
                <span className="block text-2xl leading-none font-semibold">
                  {summary.byCategory[card.id]}
                </span>
                <span className="mt-1 block truncate text-sm font-medium">
                  {card.name}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold">장볼 식재료 고르기</h2>
        <p className="mt-0.5 mb-3 text-sm text-gray-500">
          사진을 누르면 리스트에 담겨요
        </p>
        <SegmentedTabs
          tabs={CATEGORY_TABS}
          activeId={activeCategory}
          onChange={setActiveCategory}
          className="mb-3"
        />
        <div className="-mx-4 overflow-x-auto px-4 pt-1 pb-4 sm:-mx-6 sm:px-6">
          <div
            key={activeCategory}
            className="motion-safe:animate-tab-fade flex gap-3"
            style={{ minWidth: 'min-content' }}
          >
            {filteredItems.map((item, index) => {
              const listItem = (list ?? []).find(s => s.name === item.name);
              const purchaseCount = counts.get(item.name) || 0;

              return (
                <div
                  key={item.id}
                  className={`w-[168px] flex-shrink-0 overflow-hidden ${SURFACE}`}
                >
                  <div className="relative">
                    <button
                      type="button"
                      aria-label={`${item.name} 리스트에 담기`}
                      className="relative block aspect-[180/128] w-full cursor-pointer"
                      onClick={() => handleItemClick(item.name)}
                    >
                      <Image
                        src={getImageUrl(item)}
                        alt=""
                        className="object-cover"
                        fill
                        sizes="168px"
                        priority={index < 4}
                        quality={75}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
                        onError={() => handleImageError(item.id)}
                        style={{ touchAction: 'manipulation' }}
                      />

                      {purchaseCount > 0 && (
                        <span className="absolute top-2 left-2 rounded-full bg-[#6B46C1] px-2.5 py-1 text-xs font-semibold text-white">
                          구매 {purchaseCount}회
                        </span>
                      )}

                      {listItem && (
                        <span className="absolute inset-0 flex items-center justify-center bg-[#4B2F8C]/55 text-white">
                          <Plus size={28} strokeWidth={2} />
                          <span className="text-3xl font-semibold">
                            {listItem.quantity}
                          </span>
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openNotificationSetting(item.id)}
                      className="absolute top-1.5 right-1.5 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#6B46C1] shadow-sm"
                      aria-label={`${item.name} 알림 설정`}
                    >
                      <BellIcon size={18} />
                    </button>

                    <h3 className="p-3 text-sm font-semibold">{item.name}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ExpiryDateSetting
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        itemId={selectedItemId}
        itemName={getSelectedItemName()}
      />
    </div>
  );
};

export default IngredientsBoard;
