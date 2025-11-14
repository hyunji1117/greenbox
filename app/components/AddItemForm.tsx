// app/components/AddItemForm.tsx
// 식재료 추가 폼 컴포넌트

import React, { useEffect, useState, useRef } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import Toast from '@/app/components/common/Toast';
import {
  RefrigeratorIcon,
  SnowflakeIcon,
  Package2Icon,
  MinusIcon,
  PlusIcon,
} from 'lucide-react';

interface AddItemFormProps {
  onClose: () => void;
  onAddToShoppingList?: (name: string, quantity?: number) => void;
  mode?: 'simple' | 'advanced';
  initialCategory?: 'fridge' | 'freezer' | 'pantry';
}

const AddItemForm: React.FC<AddItemFormProps> = ({
  onClose,
  onAddToShoppingList,
  mode: initialMode = 'simple',
  initialCategory = 'fridge',
}) => {
  const { addItem, currentUser } = useFridge();
  const formRef = useRef<HTMLFormElement>(null);

  // 상태 관리
  const [currentMode, setCurrentMode] = useState<'simple' | 'advanced'>(
    initialMode,
  );
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'fridge' | 'freezer' | 'pantry'>(
    initialCategory,
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [expiryDate, setExpiryDate] = useState('');

  // Toast 상태 추가
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast 표시 함수
  const showToastNotification = (message: string): void => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
      toastTimerRef.current = null;
    }, 3000);
  };

  // 폼 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // 타이머 정리
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [onClose]);

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Simple 모드 제출 핸들러
  const handleSimpleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && onAddToShoppingList) {
      onAddToShoppingList(name);
      onClose();
    }
  };

  // Advanced 모드 제출 핸들러
  const handleAdvancedSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalQuantity =
      typeof quantity === 'string' || quantity < 1 ? 1 : quantity;

    if (name.trim() && expiryDate) {
      // 냉장고에 추가
      addItem({
        name,
        category,
        quantity: finalQuantity,
        expiryDate: expiryDate || undefined,
        addedBy: currentUser,
        finished: false,
      });

      // 쇼핑리스트에도 같은 수량만큼 추가
      if (onAddToShoppingList) {
        onAddToShoppingList(name, finalQuantity);
      }

      onClose();
    }
  };

  // 수량 변경 핸들러
  const handleQuantityChange = (value: number) => {
    const currentQty = typeof quantity === 'string' ? 1 : quantity;
    const newValue = currentQty + value;
    if (newValue >= 1) {
      setQuantity(newValue);
    }
  };

  const handleQuantityInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setQuantity(numValue);
    }
  };

  // Advanced 모드로 전환
  const switchToAdvanced = () => {
    if (!name.trim()) {
      showToastNotification('식품명을 입력해주세요.');
      return;
    }
    setCurrentMode('advanced');
  };

  // Simple 모드 (쇼핑리스트용)
  if (currentMode === 'simple' && onAddToShoppingList) {
    return (
      <>
        <form
          ref={formRef}
          onSubmit={handleSimpleSubmit}
          className="mx-10 w-full max-w-md rounded-xl bg-white p-5 shadow-lg"
        >
          <h3 className="mb-3 text-lg font-medium">직접 추가</h3>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              식품명<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="예: 시금치, 계란, 오이 등"
              required
              autoFocus
            />
          </div>
          <div className="mb-4 text-center">
            <button
              type="button"
              onClick={() => {
                if (!name.trim()) {
                  showToastNotification('식품명을 입력해주세요.');
                  return;
                }
                switchToAdvanced();
              }}
              className="text-sm text-[#6B46C1] hover:underline"
            >
              구매 예정이라면 냉장고에 함께 추가하세요 →
            </button>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#6B46C1] px-4 py-2 text-white hover:bg-[#603fad]"
              onClick={e => {
                if (!name.trim()) {
                  e.preventDefault();
                  showToastNotification('식품명을 입력해주세요.');
                }
              }}
            >
              추가
            </button>
          </div>
        </form>
        <Toast message={toastMessage} isVisible={showToast} />
      </>
    );
  }

  // Advanced 모드 (냉장고 추가용)
  const isFormValid = name.trim() !== '' && expiryDate !== '';

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleAdvancedSubmit}
        className="mx-10 w-full max-w-md rounded-xl bg-white p-5 shadow-lg"
      >
        <h2 className="mb-2 text-lg font-semibold">식재료 추가</h2>

        {/* 입력된 식재료 이름 표시 */}
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="text-sm text-gray-600">추가할 식재료</p>
          <p className="text-lg font-medium">{name || '식재료 이름'}</p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            카테고리
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setCategory('fridge')}
              className={`flex min-h-[40px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm transition-colors ${
                category === 'fridge'
                  ? 'border border-blue-300 bg-blue-100 text-blue-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <RefrigeratorIcon size={15} />
              <span>냉장실</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory('freezer')}
              className={`flex min-h-[40px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm transition-colors ${
                category === 'freezer'
                  ? 'border border-blue-300 bg-blue-100 text-blue-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <SnowflakeIcon size={15} />
              <span>냉동실</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory('pantry')}
              className={`flex min-h-[40px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm transition-colors ${
                category === 'pantry'
                  ? 'border border-blue-300 bg-blue-100 text-blue-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Package2Icon size={15} />
              <span>펜트리</span>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="expiryDate"
            className="mb-1 block text-sm font-medium"
          >
            유효기간<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              id="expiryDate"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              min={getTodayDate()}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 pl-4 text-[#636465] shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            <span className="text-red-500">필수항목:</span> 유효기간을 설정하면
            만료 알림을 받을 수 있습니다
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">수량</label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 shadow-sm transition-colors hover:bg-gray-300"
              disabled={quantity <= 1}
            >
              <MinusIcon size={18} />
            </button>
            <input
              type="text"
              value={quantity}
              onChange={handleQuantityInputChange}
              className="w-16 text-center text-lg font-medium focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 shadow-sm transition-colors hover:bg-gray-300"
            >
              <PlusIcon size={18} />
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="h-[40px] rounded-xl border border-gray-300 px-6 text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className={`h-[40px] rounded-xl px-6 text-white shadow-sm transition-colors ${
              isFormValid
                ? 'bg-[#6B46C1] hover:bg-[#603fad]'
                : 'cursor-not-allowed bg-gray-400'
            }`}
          >
            추가하기
          </button>
        </div>
      </form>
      <Toast message={toastMessage} isVisible={showToast} />
    </>
  );
};

export default AddItemForm;
