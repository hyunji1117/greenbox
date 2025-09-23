// app/components/AddItemForm.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import {
  RefrigeratorIcon,
  SnowflakeIcon,
  Package2,
  MinusIcon,
  PlusIcon,
  CalendarIcon,
} from 'lucide-react';

interface AddItemFormProps {
  onClose: () => void;
  initialCategory?: 'fridge' | 'freezer' | 'pantry';
}

const AddItemForm: React.FC<AddItemFormProps> = ({
  onClose,
  initialCategory = 'fridge',
}) => {
  const { addItem, currentUser } = useFridge();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'fridge' | 'freezer' | 'pantry'>(
    initialCategory,
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [expiryDate, setExpiryDate] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // 폼 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('mousedown', handleClickOutside);

    // 클린업 함수
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuantity =
      typeof quantity === 'string' || quantity < 1 ? 1 : quantity;

    if (name.trim()) {
      addItem({
        name,
        category,
        quantity: finalQuantity,
        expiryDate: expiryDate || undefined,
        addedBy: currentUser,
        finished: false,
      });
      onClose();
    }
  };

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

    // 숫자만 입력 가능하도록 처리
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setQuantity(numValue);
    }
  };

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg"
    >
      <h2 className="mb-2 text-lg font-semibold">식재료 추가</h2>

      <div className="mb-4">
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          식재료 이름
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="예: 시금치, 계란, 오이 등"
          required
          autoFocus
        />
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          카테고리
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setCategory('fridge')}
            className={`flex min-h-[40px] flex-1 items-center justify-center space-x-1 rounded-xl transition-colors ${
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
            className={`flex min-h-[40px] flex-1 items-center justify-center space-x-1 rounded-xl transition-colors ${
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
            className={`flex min-h-[40px] flex-1 items-center justify-center space-x-1 rounded-xl transition-colors ${
              category === 'pantry'
                ? 'border border-blue-300 bg-blue-100 text-blue-700'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Package2 size={15} />
            <span>펜트리</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label
          htmlFor="expiryDate"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          유효기간
        </label>
        <div className="relative">
          <input
            type="date"
            id="expiryDate"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            min={getTodayDate()}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 pl-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <CalendarIcon
            size={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          선택사항: 유효기간을 설정하면 만료 알림을 받을 수 있습니다
        </p>
      </div>
      <div className="flex items-center justify-end">
        <div className="mb-4 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
            disabled={quantity <= 1}
          >
            <MinusIcon size={16} />
          </button>
          <input
            type="text"
            value={quantity}
            onChange={handleQuantityInputChange}
            className="w-12 text-center text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
          >
            <PlusIcon size={16} />
          </button>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="h-[30px] rounded-xl border border-gray-300 px-4 text-gray-700 transition-colors hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          className="h-[30px] space-x-1 rounded-xl bg-[#6B46C1] px-4 text-sm text-white transition-colors hover:bg-[#603fad]"
        >
          추가하기
        </button>
      </div>
    </form>
  );
};

export default AddItemForm;
