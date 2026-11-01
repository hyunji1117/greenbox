// app/components/grocery-list/GroceryListPage.tsx
// 장보기 리스트 페이지 컴포넌트

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  MinusIcon,
  PlusIcon,
  ShoppingBasket,
  Star,
  Trash2,
  XIcon,
} from 'lucide-react';
import ActionToast from '@/app/components/common/ActionToast';
import SegmentedTabs, { SURFACE } from '@/app/components/common/SegmentedTabs';
import { useFridge } from '@/app/context/FridgeContext';
import { useAddPurchasedItems } from '@/app/lib/items/useItems';
import { ITEM_NAME_MAX, QUANTITY_MAX } from '@/app/lib/schemas/item';
import purchaseStorage from '@/app/lib/storage/PurchaseDataStorage';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';

interface ShoppingListItem {
  id: number;
  name: string;
  quantity: number;
  completed: boolean;
}

interface FavoriteItem {
  id: number;
  name: string;
  items: Array<{ id: number; name: string; quantity: number }>;
}

const VIEW_TABS = [
  { id: 'list', label: '장볼 리스트', Icon: ShoppingBasket },
  { id: 'favorites', label: '즐겨찾기', Icon: Star },
] as const;

const TOAST_MS = 2200;
const UNDO_TOAST_MS = 5000;

const GroceryListPage: React.FC = () => {
  const { currentUser } = useFridge();
  const addPurchasedItems = useAddPurchasedItems();
  const [activeView, setActiveView] = useState<'list' | 'favorites'>('list');
  const [newItemName, setNewItemName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() =>
    shoppingListStorage.loadShoppingList(),
  );
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() =>
    shoppingListStorage.loadFavorites(),
  );

  const completedCount = shoppingList.filter(i => i.completed).length;

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [undoAction, setUndoAction] = useState<(() => void) | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const toast = (msg: string, onUndo?: () => void) => {
    clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    setUndoAction(onUndo ? () => onUndo : null);
    setShowToast(true);
    toastTimerRef.current = setTimeout(
      () => setShowToast(false),
      onUndo ? UNDO_TOAST_MS : TOAST_MS,
    );
  };
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  useEffect(() => {
    shoppingListStorage.saveShoppingList(shoppingList);
  }, [shoppingList]);

  useEffect(() => {
    shoppingListStorage.saveFavorites(favorites);
  }, [favorites]);

  const onToggleCompletion = (id: number) => {
    setShoppingList(prev =>
      prev.map(i => (i.id === id ? { ...i, completed: !i.completed } : i)),
    );
  };
  const onUpdateQuantity = (id: number, change: number) => {
    setShoppingList(prev =>
      prev.map(i =>
        i.id === id ? { ...i, quantity: Math.max(1, i.quantity + change) } : i,
      ),
    );
  };
  const onDeleteItem = (id: number) => {
    const previous = shoppingList;
    const item = previous.find(i => i.id === id);
    setShoppingList(prev => prev.filter(i => i.id !== id));
    if (item) {
      toast(`${item.name} 지웠어요`, () => setShoppingList(previous));
    }
  };
  const onClearAll = () => {
    if (shoppingList.length === 0) return toast('삭제할 항목이 없습니다');
    const previous = shoppingList;
    setShoppingList([]);
    toast('리스트를 비웠어요', () => setShoppingList(previous));
  };
  const onClearCompleted = async () => {
    const completed = shoppingList.filter(i => i.completed);
    if (completed.length === 0) return toast('완료된 항목이 없습니다');
    if (addPurchasedItems.isPending) return;

    // 구매한 품목은 냉장실로 넣는다. 다른 곳에 둘 품목은 나중에 옮기는 기능이 필요하다
    let saved: boolean[];
    try {
      saved = await addPurchasedItems.mutateAsync(
        completed.map(i => ({
          name: i.name,
          category: 'fridge' as const,
          quantity: Math.min(i.quantity, QUANTITY_MAX),
          addedBy: currentUser,
        })),
      );
    } catch (e) {
      console.error(e);
      return toast('냉장고에 넣지 못했어요. 다시 시도해 주세요');
    }

    // 저장된 품목만 리스트에서 빼서, 실패한 품목은 다시 시도할 수 있게 둔다
    const purchased = completed.filter((_, index) => saved[index]);
    if (purchased.length === 0) {
      return toast('냉장고에 넣지 못했어요. 다시 시도해 주세요');
    }
    const purchasedIds = new Set(purchased.map(i => i.id));
    setShoppingList(prev => prev.filter(i => !purchasedIds.has(i.id)));

    try {
      await purchaseStorage.recordPurchase(
        purchased.map(i => ({ name: i.name, quantity: i.quantity })),
      );
    } catch (e) {
      console.error(e);
      return toast('냉장고에 넣었지만 구매 기록은 저장하지 못했어요');
    }
    toast(
      purchased.length === completed.length
        ? `${purchased.length}개 항목을 냉장고에 넣었어요`
        : `${purchased.length}개만 냉장고에 넣었어요. 나머지는 다시 시도해 주세요`,
    );
  };
  const onLoadFavorite = (favoriteId: number) => {
    const fav = favorites.find(f => f.id === favoriteId);
    if (!fav) return;
    setShoppingList(fav.items.map(i => ({ ...i, completed: false })));
    setActiveView('list');
    toast(`'${fav.name}' 목록을 불러왔어요`);
  };
  // 즐겨찾기 추가
  const onShowFavoriteInput = () => {
    if (shoppingList.length === 0) return toast('저장할 항목이 없습니다');
    const name = window.prompt('즐겨찾기 이름을 입력하세요', '주간 장보기');
    if (!name || !name.trim()) return;

    // 즐겨찾기 이름증복 검사
    const trimmedName = name.trim();
    if (favorites.some(fav => fav.name === trimmedName)) {
      return toast('존재하는 즐겨찾기 이름입니다.');
    }

    const fav: FavoriteItem = {
      id: Date.now(),
      name: name.trim(),
      items: shoppingList.map(({ id, name, quantity }) => ({
        id,
        name,
        quantity,
      })),
    };
    setFavorites(prev => [...prev, fav]);
    toast(`'${fav.name}' 즐겨찾기를 저장했어요`);
  };

  const trimmedNewItemName = newItemName.trim();
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedNewItemName) return;
    setShoppingList(prev => {
      const existing = prev.find(i => i.name === trimmedNewItemName);
      if (existing) {
        return prev.map(i =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          id: Date.now(),
          name: trimmedNewItemName,
          quantity: 1,
          completed: false,
        },
      ];
    });
    setNewItemName('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#F2F2F6] p-4 pb-24 sm:p-6 sm:pb-24">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">장보기 리스트</h1>
        <p className="mt-1 text-sm text-balance text-gray-500">
          구매를 완료하면 냉장고에 들어가고 구매 기록에 남아요
        </p>
      </div>

      <SegmentedTabs
        tabs={VIEW_TABS}
        activeId={activeView}
        onChange={setActiveView}
        className="mb-4"
      />

      <div key={activeView} className="motion-safe:animate-tab-fade">
        {activeView === 'list' ? (
          <>
            <form
              onSubmit={handleAddSubmit}
              className="flex h-12 items-center gap-1 rounded-2xl bg-white pr-1 pl-4 shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5 transition-shadow duration-200 focus-within:shadow-[0_0_0_4px_rgba(107,70,193,0.12)] focus-within:ring-[#A794D6]"
            >
              {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 text-base를 유지한다 */}
              <input
                ref={inputRef}
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                aria-label="살 식재료 이름"
                placeholder="살 식재료 이름"
                maxLength={ITEM_NAME_MAX}
                enterKeyHint="done"
                className="h-full min-w-0 flex-1 bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="리스트에 담기"
                onMouseDown={e => e.preventDefault()}
                disabled={!trimmedNewItemName}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6B46C1] text-white transition-colors duration-200 hover:bg-[#603fad] disabled:bg-[#F1EDFA] disabled:text-[#A794D6]"
              >
                <PlusIcon size={20} />
              </button>
            </form>

            {shoppingList.length === 0 ? (
              <div className="px-1 pt-10 text-center">
                <p className="text-base font-semibold text-gray-800">
                  아직 담은 식재료가 없어요
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  살 것을 적거나 즐겨찾기를 불러와 주세요
                </p>
              </div>
            ) : (
              <>
                <ul className="mt-4 space-y-2">
                  {shoppingList.map(item => (
                    <li
                      key={item.id}
                      className={`flex items-center gap-1 p-2 transition-colors ${SURFACE}`}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleCompletion(item.id)}
                        aria-pressed={item.completed}
                        aria-label={`${item.name} 구매 표시`}
                        className="flex h-11 w-9 shrink-0 items-center justify-center"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                            item.completed
                              ? 'bg-[#6B46C1] text-white'
                              : 'bg-white ring-1 ring-gray-300'
                          }`}
                        >
                          {item.completed && <Check size={14} />}
                        </span>
                      </button>
                      <span
                        className={`min-w-0 flex-1 text-sm font-medium transition-colors ${
                          item.completed
                            ? 'text-gray-400 line-through'
                            : 'text-gray-800'
                        }`}
                      >
                        {item.name}
                      </span>
                      <div className="flex h-9 shrink-0 items-center rounded-xl bg-[#F4F4F8] text-gray-700">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          aria-label={`${item.name} 수량 줄이기`}
                          disabled={item.quantity <= 1}
                          className="flex h-9 w-8 items-center justify-center rounded-l-xl transition-colors hover:bg-gray-200 disabled:opacity-30"
                        >
                          <MinusIcon size={14} />
                        </button>
                        <span className="min-w-5 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          aria-label={`${item.name} 수량 늘리기`}
                          className="flex h-9 w-8 items-center justify-center rounded-r-xl transition-colors hover:bg-gray-200"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        aria-label={`${item.name} 지우기`}
                        className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        <XIcon size={16} />
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={onClearCompleted}
                  disabled={addPurchasedItems.isPending}
                  className="mt-4 h-12 w-full rounded-2xl bg-[#6B46C1] text-sm font-semibold text-white transition-colors hover:bg-[#603fad] disabled:opacity-60"
                >
                  {addPurchasedItems.isPending
                    ? '냉장고에 넣는 중...'
                    : completedCount > 0
                      ? `구매 완료 ${completedCount}개 냉장고에 넣기`
                      : '산 품목을 체크해 주세요'}
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-medium text-gray-600">
                  <button
                    type="button"
                    onClick={onShowFavoriteInput}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-xl transition-colors hover:bg-white"
                  >
                    <Star size={16} />
                    즐겨찾기로 저장
                  </button>
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-xl transition-colors hover:bg-white"
                  >
                    <Trash2 size={16} />
                    전체 지우기
                  </button>
                </div>
              </>
            )}
          </>
        ) : favorites.length === 0 ? (
          <div className="px-1 pt-10 text-center">
            <p className="text-base font-semibold text-gray-800">
              저장한 즐겨찾기가 없어요
            </p>
            <p className="mt-1 text-sm text-balance text-gray-500">
              자주 사는 묶음을 저장하면 한 번에 불러올 수 있어요
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {favorites.map(favorite => (
              <li
                key={favorite.id}
                className={`flex items-center gap-1 p-2 ${SURFACE}`}
              >
                <button
                  type="button"
                  onClick={() => onLoadFavorite(favorite.id)}
                  className="min-h-11 min-w-0 flex-1 rounded-xl px-2 py-1 text-left transition-colors hover:bg-[#F4F4F8]"
                >
                  <span className="block text-sm font-semibold text-gray-800">
                    {favorite.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {favorite.items.length}개 항목
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFavorites(prev =>
                      prev.filter(fav => fav.id !== favorite.id),
                    );
                    toast(`'${favorite.name}' 즐겨찾기를 지웠어요`);
                  }}
                  aria-label={`${favorite.name} 즐겨찾기 지우기`}
                  className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <XIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ActionToast
        isVisible={showToast}
        message={toastMessage}
        actionLabel={undoAction ? '되돌리기' : undefined}
        onAction={() => {
          undoAction?.();
          clearTimeout(toastTimerRef.current);
          setShowToast(false);
        }}
      />
    </div>
  );
};

export default GroceryListPage;
