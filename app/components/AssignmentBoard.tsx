import React, { useState } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import { PlusIcon } from 'lucide-react';
const AssignmentBoard: React.FC = () => {
  const { assignments, addAssignment } = useFridge();
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState<
    'mom' | 'dad' | 'bigKid' | 'littleKid'
  >('bigKid');
  const [dueDate, setDueDate] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addAssignment({
        title: title.trim(),
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 604800000), // Default to 1 week from now
      });
      setTitle('');
      setDueDate('');
      setShowAddForm(false);
    }
  };
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  const getFamilyMemberName = (member: string): string => {
    switch (member) {
      case 'mom':
        return '먐무';
      case 'dad':
        return '빙빵';
      case 'bigKid':
        return '낭농';
      case 'littleKid':
        return '떡자';
      default:
        return member;
    }
  };
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">담당자 지정</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-1 rounded-xl bg-[#6B46C1] py-1 pr-3 pl-2 text-sm text-white shadow-sm transition-colors hover:bg-[#603fad]"
        >
          <PlusIcon size={18} />
          <span>담당자 추가</span>
        </button>
      </div>
      {assignments.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-500">지정된 담당자가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {assignments.map(assignment => (
            <div
              key={assignment.id}
              className="rounded-xl border-l-4 border-green-500 bg-white p-5 shadow-md"
            >
              <h3 className="text-lg font-semibold">{assignment.title}</h3>
              <div className="mt-2 flex items-center">
                <span className="inline-block rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-800">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">새 담당자 지정</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="mb-1 block text-sm font-medium"
                >
                  담당 업무
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="예: 이번 주 냉동실 관리"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="assignedTo"
                  className="mb-1 block text-sm font-medium"
                >
                  담당자
                </label>
                <select
                  id="assignedTo"
                  value={assignedTo}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setAssignedTo(
                      e.target.value as 'mom' | 'dad' | 'bigKid' | 'littleKid',
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  className="mb-1 block text-sm font-medium"
                >
                  마감일
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                >
                  지정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AssignmentBoard;
