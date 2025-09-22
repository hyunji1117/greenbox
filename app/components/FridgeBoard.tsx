import React, { useState } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import FridgeItem from '@/app/components/FridgeItem';
import AddItemForm from '@/app/components/AddItemForm';
import QuickAddItems from '@/app/components/QuickAddItems';
import {
  Plus,
  RefrigeratorIcon,
  SnowflakeIcon,
  PackageIcon,
  ListIcon,
  GridIcon,
} from 'lucide-react';
const FridgeBoard: React.FC = () => {
  const { items } = useFridge();
  const [activeCategory, setActiveCategory] = useState<
    'fridge' | 'freezer' | 'pantry'
  >('fridge');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const filteredItems = items.filter(
    item => item.category === activeCategory && !item.finished,
  );
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">우리집 냉장고</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center space-x-1 rounded-lg bg-[#6B46C1] px-3 py-1 text-white transition-colors hover:bg-[#603fad]"
          >
            <Plus size={18} />
            <span>식재료 추가</span>
          </button>
        </div>
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          총 {filteredItems.length}개 아이템
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded p-1.5 ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <GridIcon size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded p-1.5 ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-12 text-center">
            <p className="text-gray-500">
              아이템이 없습니다. 새 아이템을 추가해보세요!
            </p>
          </div>
        ) : (
          <div
            className={`grid ${viewMode === 'grid' ? 'mt-4 grid-cols-1 md:grid-cols-2' : 'mt-4 grid-cols-1'} gap-4`}
          >
            {filteredItems.map(item => (
              <FridgeItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-5">
            <AddItemForm
              onClose={() => setShowAddForm(false)}
              initialCategory={activeCategory}
            />
          </div>
        </div>
      )}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-5 max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6">
            <QuickAddItems onClose={() => setShowQuickAdd(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
export default FridgeBoard;
