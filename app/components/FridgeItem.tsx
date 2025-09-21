import React, { useState } from 'react'
import {
  useFridge,
  FridgeItem as FridgeItemType,
} from '@/app/context/FridgeContext'
import { MessageCircle, Check } from 'lucide-react'

interface FridgeItemProps {
  item: FridgeItemType
}

const FridgeItem: React.FC<FridgeItemProps> = ({ item }) => {
  const { markAsFinished, addComment } = useFridge()
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      addComment(item.id, newComment)
      setNewComment('')
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
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return '방금 전'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
    return `${Math.floor(diffInSeconds / 86400)}일 전`
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <p className="text-sm text-gray-500">
            {getFamilyMemberName(item.addedBy)}가{' '}
            {getRelativeTimeString(item.addedAt)} 추가
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowComments(!showComments)}
            className="px-3 pt-4 text-gray-500  rounded-full relative"
            title="댓글"
          >
            <MessageCircle size={20} />
            {item.comments.length > 0 && (
              <span className="absolute top-2.5 right-1.5 bg-red-400 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {item.comments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => markAsFinished(item.id)}
            className="px-3 pt-4 text-gray-500 rounded-full"
            title="다 먹음"
          >
            <Check size={20} />
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