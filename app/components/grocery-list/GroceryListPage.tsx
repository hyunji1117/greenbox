// app/components/GroceryListPage.tsx
// 장보기 리스트 페이지 (하단 내비게이션과 공존하도록 수정)

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBasket,
  Star,
  SquarePlus,
  Check,
  MinusIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import Button from '@/app/components/common/Button';
import AddItemForm from '@/app/components/grocery-list/AddItemForm';
import Toast from '@/app/components/common/Toast';
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

const GroceryListPage: React.FC = () => {
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() =>
    shoppingListStorage.loadShoppingList(),
  );
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() =>
    shoppingListStorage.loadFavorites(),
  );

  const totalItems = useMemo(
    () => shoppingList.reduce((sum, i) => sum + i.quantity, 0),
    [shoppingList],
  );

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  useEffect(() => {
    shoppingListStorage.saveShoppingList(shoppingList);
  }, [shoppingList]);

  useEffect(() => {
    shoppingListStorage.saveFavorites(favorites);
  }, [favorites]);

  const onToggleFavorites = () => setShowFavorites(v => !v);
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
    const item = shoppingList.find(i => i.id === id);
    setShoppingList(prev => prev.filter(i => i.id !== id));
    if (item) toast(`'${item.name}'이(가) 삭제되었어요`);
  };
  const onClearAll = () => {
    if (shoppingList.length === 0) return toast('삭제할 항목이 없습니다');
    setShoppingList([]);
    toast('모든 항목을 삭제했어요');
  };
  const onClearCompleted = async () => {
    const completed = shoppingList.filter(i => i.completed);
    if (completed.length === 0) return toast('완료된 항목이 없습니다');

    try {
      await purchaseStorage.recordPurchase(
        completed.map(i => ({ name: i.name, quantity: i.quantity })),
      );
      setShoppingList(prev => prev.filter(i => !i.completed));
      toast(`${completed.length}개 항목을 구매 완료 처리했어요`);
    } catch (e) {
      console.error(e);
      toast('구매 기록 저장 중 오류가 발생했어요');
    }
  };
  const onLoadFavorite = (favoriteId: number) => {
    const fav = favorites.find(f => f.id === favoriteId);
    if (!fav) return;
    setShoppingList(fav.items.map(i => ({ ...i, completed: false })));
    setShowFavorites(false);
    toast(`'${fav.name}' 목록을 불러왔어요`);
  };
  const onShowFavoriteInput = () => {
    if (shoppingList.length === 0) return toast('저장할 항목이 없습니다');
    const name = window.prompt('즐겨찾기 이름을 입력하세요', '주간 장보기');
    if (!name || !name.trim()) return;
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

  const onDirectAdd = () => setShowAddForm(true);
  const handleAddToShoppingList = (name: string, quantity = 1) => {
    setShoppingList(prev => {
      const existing = prev.find(i => i.name === name);
      if (existing) {
        return prev.map(i =>
          i.name === name ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { id: Date.now(), name, quantity, completed: false }];
    });
    toast(`'${name}'을(를) 추가했어요`);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#F2F2F6] p-5 pb-20">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">장보기 리스트</h1>
        <Button
          onClick={onDirectAdd}
          variant="secondary"
          className="w-auto gap-1 px-3.5"
        >
          <SquarePlus size={22} strokeWidth={2} />
          직접 추가
        </Button>
      </div>

      {/* 탭 스위치 */}
      <div className="mb-4 flex justify-evenly border-b">
        <button
          onClick={onToggleFavorites}
          className={`flex flex-grow items-center justify-center px-4 py-2 text-base font-semibold ${
            !showFavorites
              ? 'border-b-2 border-[#6B46C1] text-[#6B46C1]'
              : 'text-gray-500'
          }`}
        >
          <ShoppingBasket size={20} className="mr-1" />
          장볼 리스트
        </button>
        <button
          onClick={onToggleFavorites}
          className={`flex flex-grow items-center justify-center px-4 py-2 text-base font-semibold ${
            showFavorites
              ? 'border-b-2 border-[#6B46C1] text-[#6B46C1]'
              : 'text-gray-500'
          }`}
        >
          <Star size={20} className="mr-1" />
          즐겨찾기
        </button>
      </div>

      {/* 본문 */}
      {!showFavorites ? (
        <>
          {shoppingList.length === 0 ? (
            <div className="mt-10 text-center text-lg text-gray-500">
              <p>장볼 재료가 없어요</p>
              <p className="mt-2 text-base">
                장보기 전{' '}
                <span className="rounded-sm bg-amber-200 px-0.5 py-0.5 font-semibold text-[#6B46C1]">
                  식재료 카드
                </span>
                를 눌러 추가해보세요
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {shoppingList.map(item => (
                <li
                  key={item.id}
                  className="flex items-center justify-between border-b p-2"
                >
                  <div className="flex items-center">
                    <button
                      onClick={() => onToggleCompletion(item.id)}
                      className={`mr-2 rounded-full border ${
                        item.completed
                          ? 'border-[#6B46C1] bg-[#6B46C1]'
                          : 'border-gray-300'
                      } p-1`}
                    >
                      {item.completed && <Check size={12} color="white" />}
                    </button>
                    <span
                      className={
                        item.completed ? 'text-gray-400 line-through' : ''
                      }
                    >
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      disabled={item.quantity <= 1}
                    >
                      <MinusIcon size={14} />
                    </button>
                    <span className="mx-2 w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <PlusIcon size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="ml-2 p-1 text-red-500 hover:text-red-700"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 하단 액션 */}
          <div className="mt-5 space-y-2">
            <button
              onClick={onShowFavoriteInput}
              className="flex w-full items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
            >
              <Star size={16} className="mr-1" />
              즐겨찾기 추가
            </button>
            {shoppingList.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={onClearCompleted}
                  className="flex-1 rounded-lg bg-[#6B46C1] py-2 text-sm text-white hover:bg-[#603fad]"
                >
                  장보기 완료
                </button>
                <button
                  onClick={onClearAll}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
                >
                  전체 삭제
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {favorites.length === 0 ? (
            <div className="mt-10 text-center text-gray-500">
              <p>저장된 즐겨찾기가 없습니다</p>
              <p className="mt-2 text-sm">쇼핑 목록을 저장해보세요</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {favorites.map(favorite => (
                <li
                  key={favorite.id}
                  className="cursor-pointer rounded-lg border p-3 hover:bg-gray-50"
                  onClick={() => onLoadFavorite(favorite.id)}
                >
                  <div className="font-medium">{favorite.name}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    {favorite.items.length}개 항목
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 직접추가 모달 */}
      {showAddForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <AddItemForm
            onClose={() => setShowAddForm(false)}
            onAddToShoppingList={handleAddToShoppingList}
            mode="simple"
          />
        </div>
      )}
      <Toast message={toastMessage} isVisible={showToast} />
    </div>
  );
};

export default GroceryListPage;
