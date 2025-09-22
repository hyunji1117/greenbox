import React, { useState } from 'react'
import { useFridge } from '../context/FridgeContext'
import { CircleCheckBig, MessageCircleIcon, MinusIcon, PlusIcon, Trash2 } from 'lucide-react'
interface FridgeItemProps {
  item: {
    id: string
    name: string
    category: 'fridge' | 'freezer' | 'pantry'
    quantity: number
    addedBy: string
    addedAt: Date
    comments: Array<{
      id: string
      text: string
      author: string
      createdAt: Date
    }>
    finished: boolean
  }
}
const FridgeItem: React.FC<FridgeItemProps> = ({ item }) => {
  const { markAsFinished, addComment, updateItem } = useFridge()
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      addComment(item.id, newComment)
      setNewComment('')
    }
  }
  const incrementQuantity = () => {
    updateItem(item.id, {
      quantity: item.quantity + 1,
    })
  }
  const decrementQuantity = () => {
    if (item.quantity > 1) {
      updateItem(item.id, {
        quantity: item.quantity - 1,
      })
    }
  }
  const getFamilyMemberName = (member: string): string => {
    switch (member) {
      case 'mom':
        return '먐무'
      case 'dad':
        return '빙빵'
      case 'bigKid':
        return '낭농'
      case 'littleKid':
        return '떡자'
      default:
        return member
    }
  }
  const getRelativeTimeString = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000,
    )
    if (diffInSeconds < 60) return '방금 전'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}시간 전`
    return `${Math.floor(diffInSeconds / 86400)}일 전`
  }
  // 현재로서는 markAsFinished와 동일한 동작을 사용합니다.
  // 추후 애플리케이션에서 "버림"과 "다 먹음"을 다르게 추적 예정.
  const handleTrashItem = () => {
    markAsFinished(item.id)
  }
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-center relative">
        <div className="absolute -top-6 -left-5 bg-white text-gray-600 border border-[#9E9E9E] rounded-full w-6 h-6 flex items-center justify-center font-medium text-sm">
          {item.quantity}
        </div>
          <div>
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <div className="flex items-center">
              <p className="text-sm text-gray-500 mr-3">
                {getFamilyMemberName(item.addedBy)}가{' '}
                {getRelativeTimeString(item.addedAt)} 추가
              </p>
              <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={decrementQuantity}
                  className="px-2 py-1 text-[#6B7280] hover:bg-gray-200 transition-colors"
                  disabled={item.quantity <= 1}
                >
                  <MinusIcon size={16} />
                </button>
                <span className="px-3 py-1 font-medium text-sm text-[#6B7280]">
                  {item.quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  className="px-2 py-1 text-[#6B7280] hover:bg-gray-200 transition-colors"
                >
                  <PlusIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex relative top-6 -right-2 space-x-2">
        <button
            onClick={() => setShowComments(!showComments)}
            className="p-2 text-[#6B7280] hover:bg-gray-100 rounded-full relative"
            title="댓글"
          >
            <MessageCircleIcon size={20} />
            {item.comments.length > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-red-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {item.comments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => markAsFinished(item.id)}
            className="p-2 text-[#6B7280] hover:bg-gray-100 rounded-full"
            title="다 먹음"
          >
            <CircleCheckBig size={20} />
          </button>
          <button
            onClick={handleTrashItem}
            className="p-2 text-[#6B7280] hover:bg-gray-100 rounded-full"
            title="버림"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      {showComments && (
        <div className="mt-4">
          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
            {item.comments.length === 0 ? (
              <p className="text-sm text-gray-500">댓글이 없습니다.</p>
            ) : (
              item.comments.map((comment) => (
                <div key={comment.id} className="mb-2 last:mb-0">
                  <div className="flex items-center">
                    <span className="text-xs font-semibold">
                      {getFamilyMemberName(comment.author)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {getRelativeTimeString(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleAddComment} className="mt-2 flex">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글 추가..."
              className="flex-1 px-3 py-1 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-500 text-white px-3 py-1 rounded-r-lg text-sm hover:bg-indigo-600"
            >
              추가
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
export default FridgeItem
