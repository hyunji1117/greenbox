// app/components/fridge/FridgeQuickAdd.tsx
// 집에 이미 있는 품목을 이름만으로 등록한다. 유통기한과 수량은 추가한 뒤 카드에서 정한다
// 새로 사는 품목은 구매 기록이 남도록 냉장고에 바로 넣지 않고 장보기 리스트로 보낸다

import React, { useRef, useState } from 'react';
import { Loader2Icon, PlusIcon, ShoppingBasket } from 'lucide-react';
import { useFridge } from '@/app/context/FridgeContext';
import { useCreateItem } from '@/app/lib/items/useItems';
import {
  getHomeSuggestions,
  getRebuySuggestions,
} from '@/app/lib/items/suggestions';
import {
  ITEM_NAME_MAX,
  type Category,
  type Item,
} from '@/app/lib/schemas/item';

interface FridgeQuickAddProps {
  category: Category;
  items: Item[];
  // 빈 칸에서는 누르기 전에도 추천을 보여 준다
  alwaysShowSuggestions?: boolean;
  onAdded?: (itemId: string) => void;
  onRebuy?: (name: string) => void;
}

// 눌러도 입력창의 포커스를 유지해서 모바일 키보드가 닫히지 않게 한다
const keepInputFocus = (e: React.MouseEvent) => e.preventDefault();

const FridgeQuickAdd: React.FC<FridgeQuickAddProps> = ({
  category,
  items,
  alwaysShowSuggestions = false,
  onAdded,
  onRebuy,
}) => {
  const { currentUser } = useFridge();
  const createItem = useCreateItem();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const trimmedName = name.trim();
  const homeSuggestions = getHomeSuggestions(items, category, name);
  const rebuySuggestions = getRebuySuggestions(items, category, name);
  const isExpanded =
    (alwaysShowSuggestions || isFocused) &&
    homeSuggestions.length + rebuySuggestions.length > 0;

  const add = (itemName: string, onSuccess?: () => void) => {
    if (createItem.isPending) return;
    createItem.mutate(
      { name: itemName, category, quantity: 1, addedBy: currentUser },
      {
        onSuccess: item => {
          onSuccess?.();
          onAdded?.(item.id);
        },
      },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실패하면 입력한 내용을 지우지 않아 다시 보낼 수 있다
    if (trimmedName) {
      add(trimmedName, () => {
        setName('');
        inputRef.current?.focus();
      });
    }
  };

  return (
    <div
      onFocus={() => setIsFocused(true)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsFocused(false);
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex h-12 items-center gap-1 rounded-2xl bg-white pr-1 pl-4 shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5 transition-shadow duration-200 focus-within:shadow-[0_0_0_4px_rgba(107,70,193,0.12)] focus-within:ring-[#A794D6]"
      >
        {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 text-base를 유지한다 */}
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          aria-label="추가할 식재료 이름"
          placeholder="집에 있는 식재료 이름"
          maxLength={ITEM_NAME_MAX}
          enterKeyHint="done"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          aria-label={createItem.isPending ? '추가하는 중' : '식재료 추가'}
          onMouseDown={keepInputFocus}
          disabled={!trimmedName || createItem.isPending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6B46C1] text-white transition-colors duration-200 hover:bg-[#603fad] disabled:bg-[#F1EDFA] disabled:text-[#A794D6]"
        >
          {createItem.isPending ? (
            <Loader2Icon size={20} className="motion-safe:animate-spin" />
          ) : (
            <PlusIcon size={20} />
          )}
        </button>
      </form>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
          isExpanded
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 overflow-hidden" inert={!isExpanded}>
          {homeSuggestions.length > 0 && (
            <div className="pt-3">
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                집에 있다면 눌러서 등록
              </p>
              <div className="flex flex-wrap gap-2">
                {homeSuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={keepInputFocus}
                    onClick={() => add(suggestion, () => setName(''))}
                    disabled={createItem.isPending}
                    className="flex h-10 items-center gap-1 rounded-full bg-[#F1EDFA] px-3 text-sm font-medium text-[#553C9A] transition-colors hover:bg-[#E6DFF7] disabled:opacity-50"
                  >
                    <PlusIcon size={14} />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {rebuySuggestions.length > 0 && (
            <div className="pt-3">
              <p className="mb-1.5 text-xs font-medium text-gray-500">
                다시 살까요? 리스트에 담아요
              </p>
              <div className="flex flex-wrap gap-2">
                {rebuySuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={keepInputFocus}
                    onClick={() => {
                      onRebuy?.(suggestion);
                      setName('');
                    }}
                    className="flex h-10 items-center gap-1 rounded-full bg-white px-3 text-sm font-medium text-gray-700 ring-1 ring-black/10 transition-colors hover:bg-[#F4F4F8]"
                  >
                    <ShoppingBasket size={14} />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {createItem.isError && (
        <p role="alert" className="mt-2 text-center text-xs text-red-500">
          추가하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
};

export default FridgeQuickAdd;
