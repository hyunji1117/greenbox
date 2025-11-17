import React, { useState } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import FridgeItem from '@/app/components/fridge/FridgeItem';
import AddItemForm from '@/app/components/grocery-list/AddItemForm';
import { RefrigeratorIcon, SnowflakeIcon, PackageIcon } from 'lucide-react';
const FridgeBoard: React.FC = () => {
  const { items } = useFridge();
  const [activeCategory, setActiveCategory] = useState<
    'fridge' | 'freezer' | 'pantry'
  >('fridge');
  const [showAddForm, setShowAddForm] = useState(false);
  const filteredItems = items.filter(
    item => item.category === activeCategory && !item.finished,
  );
  return (
    <div className="relative flex h-full flex-col p-6 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">우리집 냉장고</h1>
      </div>
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setActiveCategory('fridge')}
          className={`flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-3 ${activeCategory === 'fridge' ? 'border border-blue-300 bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <RefrigeratorIcon size={20} />
          <span className="font-medium">냉장실</span>
        </button>
        <button
          onClick={() => setActiveCategory('freezer')}
          className={`flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-3 ${activeCategory === 'freezer' ? 'border border-blue-300 bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <SnowflakeIcon size={20} />
          <span className="font-medium">냉동실</span>
        </button>
        <button
          onClick={() => setActiveCategory('pantry')}
          className={`flex flex-1 items-center justify-center space-x-2 rounded-lg px-4 py-3 ${activeCategory === 'pantry' ? 'border border-blue-300 bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <PackageIcon size={20} />
          <span className="font-medium">식료품 저장고</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-12 text-center">
            <p className="text-gray-500">
              아이템이 없습니다. 새 아이템을 추가해보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredItems.map(item => (
              <FridgeItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
      {showAddForm && (
        // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">새 아이템 추가</h2>
            <AddItemForm
              onClose={() => setShowAddForm(false)}
              initialCategory={activeCategory}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default FridgeBoard;
