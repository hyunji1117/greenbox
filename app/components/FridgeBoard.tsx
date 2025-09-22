import React, { useState } from 'react'
import { useFridge } from '@/app/context/FridgeContext'
import FridgeItem from '@/app/components/FridgeItem'
import AddItemForm from '@/app/components/AddItemForm'
import QuickAddItems from '@/app/components/QuickAddItems'
import {
  PlusIcon,
  RefrigeratorIcon,
  SnowflakeIcon,
  PackageIcon,
  ListIcon,
  GridIcon,
} from 'lucide-react'
const FridgeBoard: React.FC = () => {
  const { items } = useFridge()
  const [activeCategory, setActiveCategory] = useState<
    'fridge' | 'freezer' | 'pantry'
  >('fridge')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const filteredItems = items.filter(
    (item) => item.category === activeCategory && !item.finished,
  )
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">우리집 냉장고</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <ListIcon size={18} />
            <span>빠른 추가</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#6B46C1] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon size={18} />
            <span>아이템 추가</span>
          </button>
        </div>
      </div>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveCategory('fridge')}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'fridge' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <RefrigeratorIcon size={20} />
          <span className="font-medium">냉장실</span>
        </button>
        <button
          onClick={() => setActiveCategory('freezer')}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'freezer' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <SnowflakeIcon size={20} />
          <span className="font-medium">냉동실</span>
        </button>
        <button
          onClick={() => setActiveCategory('pantry')}
          className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'pantry' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <PackageIcon size={20} />
          <span className="font-medium">식료품 저장고</span>
        </button>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          총 {filteredItems.length}개 아이템
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <GridIcon size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              아이템이 없습니다. 새 아이템을 추가해보세요!
            </p>
          </div>
        ) : (
          <div
            className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 mt-4' : 'grid-cols-1 mt-4'} gap-4`}
          >
            {filteredItems.map((item) => (
              <FridgeItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">새 아이템 추가</h2>
            <AddItemForm
              onClose={() => setShowAddForm(false)}
              initialCategory={activeCategory}
            />
          </div>
        </div>
      )}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto">
            <QuickAddItems onClose={() => setShowQuickAdd(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
export default FridgeBoard
