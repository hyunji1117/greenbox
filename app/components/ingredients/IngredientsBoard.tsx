// app/components/IngredientsBoard.tsx
// 식재료 보드 컴포넌트

'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, ListIcon, GridIcon, BellIcon, ScanLine } from 'lucide-react';
import ExpiryDateSetting from '@/app/components/fridge/ExpiryDateSetting';
import { mockItems, type FridgeItem } from '@/app/data/mockItems';
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
}

const IngredientsBoard: React.FC<IngredientsBoardProps> = props => {
  const { shoppingList, addToShoppingList, itemPurchaseCounts } = props;

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  const formatExpiryDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000);
    return diffDays > 0 ? `${diffDays}일 남음` : '오늘 만료';
  };

  const getExpiryStatusColor = (expiryDate: Date) => {
    const now = new Date();
    const diffDays = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / 86400000,
    );
    if (diffDays <= 2) return 'text-red-500';
    if (diffDays <= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

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
    setImageErrors(prev => new Set(prev).add(itemId));
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

  const quickGrabItems = [
    { name: 'Banana', emoji: '🍌', count: 4 },
    { name: 'Ice Cream', emoji: '🍨', count: 5 },
    { name: 'Beef Jerky', emoji: '🥩', count: 8 },
  ];

  const locationCards = [
    {
      name: 'Pantry',
      count: 56,
      image:
        'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Friedge',
      count: 37,
      image:
        'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=720&q=80',
    },
    {
      name: 'Freezer',
      count: 37,
      image:
        'https://images.unsplash.com/photo-1615486363973-f79ce905135e?auto=format&fit=crop&w=720&q=80',
    },
  ];

  return (
    <>
      <section className="mx-6 mt-5 mb-2 rounded-[28px] bg-[#f7f7fa] px-4 py-4">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-[34px] font-semibold leading-none tracking-[-0.02em] text-[#2f2f35]">
              Groceries
            </h2>
            <p className="mt-2 text-[22px] leading-none text-[#888892]">
              33 Items, 5 near expiration
            </p>
          </div>
          <button
            className="mt-1 flex h-14 w-14 items-center justify-center rounded-full bg-[#cff2d8] text-[#4b2f8c]"
            aria-label="Scan groceries"
          >
            <ScanLine size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_2fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[34px] font-semibold leading-none tracking-[-0.02em] text-[#2f2f35]">
                Ready to grab
              </h3>
              <button className="text-[20px] font-medium text-[#6ab2a7]">
                See all
              </button>
            </div>
            <div className="space-y-2">
              {quickGrabItems.map(item => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl bg-white/85 px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f3f7] text-2xl">
                      {item.emoji}
                    </div>
                    <span className="text-[24px] font-semibold leading-none text-[#323238]">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[28px] font-medium leading-none text-[#76767f]">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[34px] font-semibold leading-none tracking-[-0.02em] text-[#2f2f35]">
              Locations
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {locationCards.map(card => (
                <div
                  key={card.name}
                  className="relative h-[170px] overflow-hidden rounded-2xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${card.image})` }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-x-0 bottom-3 text-center text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]">
                    <p className="text-[36px] font-semibold leading-none">
                      {card.count}
                    </p>
                    <p className="mt-1 text-[24px] font-semibold leading-none">
                      {card.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 카테고리 탭, 뷰 토글 영역 동일 */}
      <div className="mt-2 mb-2 flex overflow-x-auto p-6 md:p-6">
        <div className="flex min-w-full space-x-2">
          {['vegetables', 'fruits', 'meat', 'seafood'].map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex min-h-[40px] min-w-[80px] flex-1 items-center justify-center rounded-xl shadow-sm ${
                activeCategory === category
                  ? category === 'vegetables'
                    ? 'border border-green-300 bg-green-100 text-green-700'
                    : category === 'fruits'
                      ? 'border border-red-300 bg-red-100 text-red-700'
                      : category === 'meat'
                        ? 'border border-orange-300 bg-orange-100 text-orange-700'
                        : 'border border-blue-300 bg-blue-100 text-blue-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span className="text-sm">
                {category === 'vegetables'
                  ? '채소'
                  : category === 'fruits'
                    ? '과일'
                    : category === 'meat'
                      ? '고기'
                      : '해산물'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <div className="mt-4 text-sm text-gray-500">
          총 {filteredItems.length}개 식재료
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-xl p-1 ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            aria-pressed={viewMode === 'grid'}
          >
            <GridIcon size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-xl p-1 ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            aria-pressed={viewMode === 'list'}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {/* ▶ 여기서 list 가 항상 배열이 되도록 보장됨 */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4" style={{ minWidth: 'min-content' }}>
          {filteredItems.map((item, index) => {
            const listItem = (list ?? []).find(s => s.name === item.name);
            const purchaseCount = counts.get(item.name) || 0;

            return (
              <div
                key={item.id}
                className="w-[180px] flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative">
                  <div
                    className="relative aspect-[180/128] w-full cursor-pointer"
                    onClick={() => handleItemClick(item.name)}
                  >
                    <Image
                      src={getImageUrl(item)}
                      alt={item.name}
                      className="object-cover"
                      fill
                      sizes="(max-width: 640px) 180px, (max-width: 768px) 180px, 180px"
                      priority={index < 4}
                      quality={75}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
                      onError={() => handleImageError(item.id)}
                      style={{
                        touchAction: 'manipulation',
                      }}
                    />

                    {purchaseCount > 0 && (
                      <div className="absolute top-0 left-0 rounded-br-md bg-[#6B46C1] px-2 py-1 text-xs font-medium text-white">
                        구매 {purchaseCount}회
                      </div>
                    )}

                    {listItem && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="flex items-center space-x-0">
                          <Plus
                            size={35}
                            className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                            strokeWidth={2}
                          />
                          <span className="text-4xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                            {listItem.quantity}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openNotificationSetting(item.id)}
                    className="absolute -top-1 -right-0.5 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-bl-md bg-white/95 pt-1 pr-0.5 text-[#6B46C1]"
                    aria-label={`${item.name} 알림 설정`}
                  >
                    <BellIcon size={18} />
                  </button>

                  <div className="flex items-center justify-between p-3">
                    <h3 className="text-sm font-medium">{item.name}</h3>
                    <div
                      className={`text-xs font-medium ${getExpiryStatusColor(item.expiryDate)}`}
                    >
                      {formatExpiryDate(item.expiryDate)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ExpiryDateSetting
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        itemId={selectedItemId}
        itemName={getSelectedItemName()}
      />
    </>
  );
};

export default IngredientsBoard;