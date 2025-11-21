// app/components/IngredientsBoard.tsx
// 식재료 보드 컴포넌트

'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Plus, ListIcon, GridIcon, BellIcon } from 'lucide-react';
import ExpiryDateSetting from '@/app/components/fridge/ExpiryDateSetting';
import { mockItems, type FridgeItem } from '@/app/data/mockItems';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';
// (선택) 구매횟수까지 보고 싶으면 purchaseStorage 가져와 초기화 로직 추가 가능
// import purchaseStorage from '@/app/lib/storage/PurchaseDataStorage';

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

  return (
    <>
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
                      src={item.imageUrl}
                      alt={item.name}
                      className="object-cover"
                      fill
                      style={{
                        contain: 'layout',
                        willChange: 'auto',
                        touchAction: 'manipulation',
                      }}
                      priority={index < 4}
                      sizes="180px"
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
