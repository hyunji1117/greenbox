// app/components/fridge/FridgeQuickAdd.tsx
// 집에 이미 있는 품목을 이름만으로 등록한다. 유통기한과 수량은 추가한 뒤 카드에서 정한다
// 새로 사는 품목은 구매 기록이 남도록 냉장고에 바로 넣지 않고 장보기 리스트로 보낸다
// 카메라로 찍으면 사진 속 식재료를 찾아 골라서 한 번에 등록한다
// 입력창 오른쪽 + 를 누르면 카메라와 음성이 펼쳐진다 (장보기에서 말로 찾는 습관이 들어 등록에서도 찾게 됨)
// 말한 이름은 입력창에 넣고, 확인한 뒤 + 로 등록한다 (잘못 알아들은 이름이 바로 들어가지 않게)

import React, { useRef, useState } from 'react';
import { PlusIcon, ShoppingBasket } from 'lucide-react';
import InputAddActions from '@/app/components/common/InputAddActions';
import PhotoAddSheet from '@/app/components/fridge/PhotoAddSheet';
import { SPEECH_ERROR_TEXT } from '@/app/components/grocery-list/FrequentItemsPicker';
import { useSpeechInput } from '@/app/lib/speech/useSpeechInput';
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

// 유통기한을 넣지 않고 등록하면 서버가 권장 보관 기간으로 채운다 (app/lib/items/storageGuide.ts)
export const EXPIRY_FILLED_NOTICE =
  '유통기한은 권장 기간으로 채웠어요. 다르면 바꿔 주세요';

const FridgeQuickAdd: React.FC<FridgeQuickAddProps> = ({
  category,
  items,
  alwaysShowSuggestions = false,
  onAdded,
  onRebuy,
}) => {
  const createItem = useCreateItem('fridge_quick_add');
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [notice, setNotice] = useState('');
  // 말한 내용을 이름 칸에 넣는다
  const speech = useSpeechInput(text => setName(text.slice(0, ITEM_NAME_MAX)));
  const cameraRef = useRef<HTMLInputElement>(null);
  const openCamera = () => {
    setNotice('');
    cameraRef.current?.click();
  };
  const trimmedName = name.trim();
  const homeSuggestions = getHomeSuggestions(items, category, name);
  const rebuySuggestions = getRebuySuggestions(items, category, name);
  const isExpanded =
    (alwaysShowSuggestions || isFocused) &&
    homeSuggestions.length + rebuySuggestions.length > 0;

  const add = (itemName: string, onSuccess?: () => void) => {
    if (createItem.isPending) return;
    createItem.mutate(
      { name: itemName, category, quantity: 1 },
      {
        onSuccess: item => {
          onSuccess?.();
          onAdded?.(item.id);
          // 서버가 권장 보관 기간으로 유통기한을 채웠다는 것을 알린다 (참고값이라 고칠 수 있다고 함께 안내)
          setNotice(EXPIRY_FILLED_NOTICE);
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
          placeholder="식재료 직접 입력 (예: 오이)"
          maxLength={ITEM_NAME_MAX}
          enterKeyHint="done"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
        <InputAddActions
          canSubmit={Boolean(trimmedName)}
          isSubmitting={createItem.isPending}
          submitLabel="식재료 추가"
          onCamera={openCamera}
          speech={speech}
          keepFocus={keepInputFocus}
        />
      </form>
      {/* 휴대폰에서는 뒤쪽 카메라를 바로 열고, PC에서는 사진 파일을 고른다 */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={e => {
          const file = e.target.files?.[0] ?? null;
          // 같은 사진을 다시 골라도 변경으로 잡히도록 비운다
          e.target.value = '';
          if (file) setPhoto(file);
        }}
      />
      {(speech.isListening || speech.error) && (
        <p aria-live="polite" className="mt-2 px-1 text-xs">
          {speech.isListening ? (
            <span className="text-[#553C9A]">
              듣고 있어요. 등록할 식재료 이름을 말해 주세요
            </span>
          ) : (
            speech.error && (
              <span className="text-red-500">
                {SPEECH_ERROR_TEXT[speech.error]}
              </span>
            )
          )}
        </p>
      )}
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
      <PhotoAddSheet
        file={photo}
        onClose={() => setPhoto(null)}
        onRetake={openCamera}
        onAdded={count => {
          setPhoto(null);
          setNotice(
            `사진에서 찾은 식재료 ${count}개를 넣었어요. ${EXPIRY_FILLED_NOTICE}`,
          );
        }}
      />
      {notice && (
        <p role="status" className="mt-2 text-center text-xs text-[#553C9A]">
          {notice}
        </p>
      )}
      {createItem.isError && (
        <p role="alert" className="mt-2 text-center text-xs text-red-500">
          추가하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
};

export default FridgeQuickAdd;
