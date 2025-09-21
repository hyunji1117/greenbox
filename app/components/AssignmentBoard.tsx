import React, { useState } from 'react'
import { useFridge } from '@/app/context/FridgeContext'
import { PlusIcon } from 'lucide-react'
const AssignmentBoard: React.FC = () => {
  const { assignments, addAssignment } = useFridge()
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState<
    'mom' | 'dad' | 'bigKid' | 'littleKid'
  >('bigKid')
  const [dueDate, setDueDate] = useState('')
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      addAssignment({
        title: title.trim(),
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 604800000), // Default to 1 week from now
      })
      setTitle('')
      setDueDate('')
      setShowAddForm(false)
    }
  }
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
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
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">담당자 지정</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon size={18} />
          <span>담당자 추가</span>
        </button>
      </div>
      {assignments.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">지정된 담당자가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500"
            >
              <h3 className="text-lg font-semibold">{assignment.title}</h3>
              <div className="mt-2 flex items-center">
                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                  {getFamilyMemberName(assignment.assignedTo)}
                </span>
                <span className="ml-3 text-sm text-gray-500">
                  마감일: {formatDate(assignment.dueDate)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">새 담당자 지정</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium mb-1"
                >
                  담당 업무
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: 이번 주 냉동실 관리"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="assignedTo"
                  className="block text-sm font-medium mb-1"
                >
                  담당자
                </label>
                <select
                  id="assignedTo"
                  value={assignedTo}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setAssignedTo(e.target.value as 'mom' | 'dad' | 'bigKid' | 'littleKid')
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="mom">먐무</option>
                  <option value="dad">빙빵</option>
                  <option value="bigKid">낭농</option>
                  <option value="littleKid">떡자</option>
                </select>
              </div>
              <div className="mb-6">
                <label
                  htmlFor="dueDate"
                  className="block text-sm font-medium mb-1"
                >
                  마감일
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  지정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default AssignmentBoard
