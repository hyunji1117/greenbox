import React, { useEffect, useState, useRef } from 'react'
import { useFridge } from '../context/FridgeContext'
import {
  LeafIcon,
  AppleIcon,
  BeefIcon,
  FishIcon,
  PlusIcon,
  XIcon,
  CheckIcon,
  MinusIcon,
} from 'lucide-react'
interface QuickAddItemProps {
  onClose: () => void
}
interface CategoryItem {
  id: string
  name: string
  imageUrl: string
  defaultCategory: 'fridge' | 'freezer' | 'pantry'
  expiryDays: number
}
const QuickAddItems: React.FC<QuickAddItemProps> = ({ onClose }) => {
  const { addItem, currentUser, items } = useFridge()
  const modalRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState<
    'vegetables' | 'fruits' | 'meat' | 'seafood'
  >('vegetables')
  const [selectedItem, setSelectedItem] = useState<CategoryItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const categories: Record<
    'vegetables' | 'fruits' | 'meat' | 'seafood',
    CategoryItem[]
  > = {
    vegetables: [
      {
        id: 'v1',
        name: '시금치',
        imageUrl:
          'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 5,
      },
      {
        id: 'v2',
        name: '브로콜리',
        imageUrl:
          'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'v3',
        name: '당근',
        imageUrl:
          'https://images.unsplash.com/photo-1598170845053-a6b5985412e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 14,
      },
      {
        id: 'v4',
        name: '양파',
        imageUrl:
          'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'pantry',
        expiryDays: 30,
      },
      {
        id: 'v5',
        name: '감자',
        imageUrl:
          'https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'pantry',
        expiryDays: 21,
      },
      {
        id: 'v6',
        name: '오이',
        imageUrl:
          'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
    ],
    fruits: [
      {
        id: 'f1',
        name: '사과',
        imageUrl:
          'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 14,
      },
      {
        id: 'f2',
        name: '바나나',
        imageUrl:
          'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'pantry',
        expiryDays: 5,
      },
      {
        id: 'f3',
        name: '딸기',
        imageUrl:
          'https://hips.hearstapps.com/clv.h-cdn.co/assets/15/22/1432664914-strawberry-facts1.jpg?resize=980:*',
        defaultCategory: 'fridge',
        expiryDays: 5,
      },
      {
        id: 'f4',
        name: '블루베리',
        imageUrl:
          'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 7,
      },
      {
        id: 'f5',
        name: '아보카도',
        imageUrl:
          'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 5,
      },
      {
        id: 'f6',
        name: '오렌지',
        imageUrl:
          'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'fridge',
        expiryDays: 14,
      },
    ],
    meat: [
      {
        id: 'm1',
        name: '닭고기',
        imageUrl:
          'https://images.unsplash.com/photo-1587593810167-a84920ea0781?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'freezer',
        expiryDays: 90,
      },
      {
        id: 'm2',
        name: '소고기',
        imageUrl:
          'https://images.unsplash.com/photo-1603048297172-66cdad6d4e5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'freezer',
        expiryDays: 180,
      },
      {
        id: 'm3',
        name: '돼지고기',
        imageUrl:
          'https://images.unsplash.com/photo-1602470521006-6b8b0f9e0f36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'freezer',
        expiryDays: 120,
      },
      {
        id: 'm4',
        name: '양고기',
        imageUrl:
          'https://images.unsplash.com/photo-1608500218890-c4f9062d6bc7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'freezer',
        expiryDays: 120,
      },
    ],
    seafood: [
      {
        id: 's1',
        name: '연어',
        imageUrl:
          'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'freezer',
        expiryDays: 90,
      },
      {
        id: 's2',
        name: '새우',
        imageUrl:
          'https://images.unsplash.com/photo-1565680018160-64b74276baba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'freezer',
        expiryDays: 90,
      },
      {
        id: 's3',
        name: '오징어',
        imageUrl:
          'https://images.unsplash.com/photo-1612392062631-94dd858cba88?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'freezer',
        expiryDays: 90,
      },
      {
        id: 's4',
        name: '게',
        imageUrl:
          'https://images.unsplash.com/photo-1550747545-c896b5f89ff7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        defaultCategory: 'freezer',
        expiryDays: 60,
      },
    ],
  }
  // Check if an item is already in the fridge and not finished
  const isItemAdded = (itemName: string, category: string) => {
    return items.some(
      (item) =>
        item.name === itemName && item.category === category && !item.finished,
    )
  }
  const handleItemClick = (item: CategoryItem) => {
    // Only allow selection if the item is not already added or is marked as finished
    if (!isItemAdded(item.name, item.defaultCategory)) {
      setSelectedItem(item)
      // Reset quantity to 1 when selecting a new item
      setQuantity(1)
    }
  }
  const handleAddItem = () => {
    if (selectedItem) {
      // Check if the item is already in the fridge and not finished
      if (!isItemAdded(selectedItem.name, selectedItem.defaultCategory)) {
        // Add the new item
        addItem({
          name: selectedItem.name,
          category: selectedItem.defaultCategory,
          quantity: quantity,
          addedBy: currentUser,
          finished: false,
        })
        setToastMessage(`${selectedItem.name}(이)가 추가되었습니다!`)
        setShowToast(true)
        setTimeout(() => {
          setShowToast(false)
        }, 3000)
        // Reset selection after adding
        setSelectedItem(null)
        // Reset quantity to 1 after adding an item
        setQuantity(1)
      }
    }
  }
  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }
  // Handle click outside to close the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])
  return (
    <div className="h-full flex flex-col" ref={modalRef}>
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
          {toastMessage}
        </div>
      )}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">자주 사용하는 식재료</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <XIcon size={24} />
        </button>
      </div>
      {/* Category tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveCategory('vegetables')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'vegetables' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <LeafIcon size={18} />
          <span className="font-medium">채소</span>
        </button>
        <button
          onClick={() => setActiveCategory('fruits')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'fruits' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <AppleIcon size={18} />
          <span className="font-medium">과일</span>
        </button>
        <button
          onClick={() => setActiveCategory('meat')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'meat' ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <BeefIcon size={18} />
          <span className="font-medium">고기</span>
        </button>
        <button
          onClick={() => setActiveCategory('seafood')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-2 ${activeCategory === 'seafood' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <FishIcon size={18} />
          <span className="font-medium">해산물</span>
        </button>
      </div>
      {/* Grid of items */}
      <div className="grid grid-cols-3 gap-4 overflow-y-auto flex-1">
        {categories[activeCategory].map((item) => {
          const itemAdded = isItemAdded(item.name, item.defaultCategory)
          return (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-shadow ${itemAdded ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
              onClick={() => !itemAdded && handleItemClick(item)}
            >
              <div className="h-24 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2 text-center">
                <h3 className="font-medium text-sm">{item.name}</h3>
                <div
                  className={`text-xs mt-1 flex items-center justify-center ${itemAdded ? 'text-green-500' : 'text-gray-500'}`}
                >
                  {itemAdded ? (
                    <CheckIcon size={12} className="mr-1" />
                  ) : (
                    <PlusIcon size={12} className="mr-1" />
                  )}
                  <span>{itemAdded ? '추가됨' : '추가하기'}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {selectedItem && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{selectedItem.name} 추가하기</h3>
              <p className="text-sm text-gray-500">수량을 선택하세요</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={decrementQuantity}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                disabled={quantity <= 1}
              >
                <MinusIcon size={16} />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={incrementQuantity}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
              >
                <PlusIcon size={16} />
              </button>
            </div>
          </div>
          <button
            onClick={handleAddItem}
            className="w-full mt-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            추가하기
          </button>
        </div>
      )}
    </div>
  )
}
export default QuickAddItems
