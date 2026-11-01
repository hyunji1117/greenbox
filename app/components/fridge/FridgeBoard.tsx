// app/components/fridge/FridgeBoard.tsx
// 냉장고 보드 컴포넌트

import React, { useState } from 'react';
import { ApiSchemaError } from '@/app/lib/api/apiFetch';
import { useItems } from '@/app/lib/items/useItems';
import { useFinishWithUndo } from '@/app/lib/items/useFinishWithUndo';
import type { Category } from '@/app/lib/schemas/item';
import ActionToast from '@/app/components/common/ActionToast';
import SegmentedTabs, { SURFACE } from '@/app/components/common/SegmentedTabs';
import FridgeItem from '@/app/components/fridge/FridgeItem';
import FridgeQuickAdd from '@/app/components/fridge/FridgeQuickAdd';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';
import {
  ChevronRightIcon,
  RefrigeratorIcon,
  ShoppingBasket,
  SnowflakeIcon,
  PackageIcon,
} from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'fridge', label: '냉장실', Icon: RefrigeratorIcon },
  { id: 'freezer', label: '냉동실', Icon: SnowflakeIcon },
  { id: 'pantry', label: '저장고', Icon: PackageIcon },
] as const;

interface FridgeBoardProps {
  onGoToShoppingList?: () => void;
}

const FridgeBoard: React.FC<FridgeBoardProps> = ({ onGoToShoppingList }) => {
  const { data: items = [], isPending, error, refetch } = useItems();
  const [activeCategory, setActiveCategory] = useState<Category>('fridge');
  const { notice, isNoticeVisible, finish, undo, notify } = useFinishWithUndo();
  // 방금 추가한 카드를 잠깐 강조한다. 칸을 옮겼다 돌아왔을 때 다시 강조되지 않게 비운다
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const activeLabel = CATEGORY_TABS.find(
    tab => tab.id === activeCategory,
  )?.label;
  const filteredItems = items.filter(
    item => item.category === activeCategory && !item.finished,
  );
  const handleRebuy = (name: string) => {
    shoppingListStorage.addToShoppingList(name);
    notify({
      subject: name,
      message: '리스트에 담았어요',
      canUndo: false,
      goToList: true,
    });
  };
  return (
    <div className="relative flex h-full flex-col p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">우리집 냉장고</h1>
      </div>
      <SegmentedTabs
        tabs={CATEGORY_TABS}
        activeId={activeCategory}
        onChange={id => {
          setActiveCategory(id);
          setNewItemId(null);
        }}
        className="mb-4"
      />
      <div className="-mx-2 flex-1 overflow-y-auto px-2 pt-1">
        {/* 칸을 바꿀 때 내용이 갑자기 바뀌지 않도록 살짝 나타나게 한다 */}
        <div key={activeCategory} className="motion-safe:animate-tab-fade">
          {isPending ? (
            <div className={`px-4 py-12 text-center ${SURFACE}`}>
              <p className="text-sm text-gray-500">불러오는 중...</p>
            </div>
          ) : error ? (
            <div className={`px-4 py-12 text-center ${SURFACE}`}>
              <p className="mb-3 text-sm text-gray-800">
                {error instanceof ApiSchemaError
                  ? '데이터 형식이 맞지 않아요.'
                  : '냉장고를 불러오지 못했어요.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="h-10 rounded-xl bg-[#6B46C1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#603fad]"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              {filteredItems.length === 0 && (
                <div className="px-1 pt-8 pb-5 text-center">
                  <p className="text-base font-semibold text-gray-800">
                    아직 비어 있어요
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    지금 {activeLabel}에 있는 식재료를 적어 주세요
                  </p>
                </div>
              )}
              {/* 비어 있다가 첫 품목이 생겨도 입력 포커스가 유지되도록 같은 자리에 둔다 */}
              <FridgeQuickAdd
                category={activeCategory}
                items={items}
                alwaysShowSuggestions={filteredItems.length === 0}
                onAdded={setNewItemId}
                onRebuy={handleRebuy}
              />
              {/* 새로 산 품목이 리스트를 거쳐야 구매 기록이 쌓이므로 등록 입력 바로 아래에서 안내한다 */}
              <button
                type="button"
                onClick={onGoToShoppingList}
                className="mt-3 flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#F1EDFA] px-4 py-2 text-center transition-colors hover:bg-[#E6DFF7]"
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-[#553C9A]">
                  <ShoppingBasket size={18} className="shrink-0" />
                  새로 살 땐 리스트에 담기
                  <ChevronRightIcon size={16} className="shrink-0" />
                </span>
                <span className="text-xs text-balance text-[#6B5B95]">
                  자주 사는 품목이 기록으로 남아요
                </span>
              </button>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredItems.map(item => (
                  <FridgeItem
                    key={item.id}
                    item={item}
                    isNew={item.id === newItemId}
                    onFinish={kind => finish(item, kind)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <ActionToast
        isVisible={isNoticeVisible}
        subject={notice?.subject}
        message={notice?.message ?? ''}
        actionLabel={
          notice?.canUndo
            ? '되돌리기'
            : notice?.goToList
              ? '리스트 보기'
              : undefined
        }
        onAction={notice?.canUndo ? undo : onGoToShoppingList}
      />
    </div>
  );
};
export default FridgeBoard;
