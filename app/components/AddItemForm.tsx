import React, { useState } from 'react'
import { useFridge } from '@/app/context/FridgeContext'
interface AddItemFormProps {
  onClose: () => void
  initialCategory: 'fridge' | 'freezer' | 'pantry'
}
const AddItemForm: React.FC<AddItemFormProps> = ({
  onClose,
  initialCategory,
}) => {
  const { addItem, currentUser } = useFridge()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'fridge' | 'freezer' | 'pantry'>(
    initialCategory,
  )
  const [quantity, setQuantity] = useState(1)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      addItem({
        name: name.trim(),
        category,
        quantity,
        addedBy: currentUser,
        finished: false,
      })
      onClose()
    }
  }
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          아이템 이름
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="예: 우유, 달걀, 치킨 등"
          required
          autoFocus
        />
      </div>
      <div className="mb-4">
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          카테고리
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as 'fridge' | 'freezer' | 'pantry')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="fridge">냉장실</option>
          <option value="freezer">냉동실</option>
          <option value="pantry">식료품 저장고</option>
        </select>
      </div>
      <div className="mb-6">
        <label htmlFor="quantity" className="block text-sm font-medium mb-1">
          수량
        </label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          min="1"
          required
        />
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          추가
        </button>
      </div>
    </form>
  )
}
export default AddItemForm
