import React from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import {
  PlusIcon,
  RefreshCwIcon,
  CheckIcon,
  MessageSquareIcon,
  UserIcon,
} from 'lucide-react';
const ActivityFeed: React.FC = () => {
  const { activities } = useFridge();
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <PlusIcon size={16} className="text-green-500" />;
      case 'update':
        return <RefreshCwIcon size={16} className="text-blue-500" />;
      case 'finish':
        return <CheckIcon size={16} className="text-purple-500" />;
      case 'comment':
        return <MessageSquareIcon size={16} className="text-orange-500" />;
      case 'assignment':
        return <UserIcon size={16} className="text-indigo-500" />;
      default:
        return null;
    }
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
  const getRelativeTimeString = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  };
  const getActivityBackground = (type: string) => {
    switch (type) {
      case 'add':
        return 'bg-green-50';
      case 'update':
        return 'bg-blue-50';
      case 'finish':
        return 'bg-purple-50';
      case 'comment':
        return 'bg-orange-50';
      case 'assignment':
        return 'bg-indigo-50';
      default:
        return 'bg-gray-50';
    }
  };
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-bold">실시간 활동</h1>
        <p className="text-sm text-gray-500">
          가족 구성원들의 최근 활동을 확인하세요
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="rounded-xl bg-gray-50 py-12 text-center">
            <p className="text-gray-500">활동 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map(activity => (
              <div
                key={activity.id}
                className={`rounded-xl border-l-4 p-4 ${activity.type === 'add' ? 'border-green-500' : activity.type === 'update' ? 'border-blue-500' : activity.type === 'finish' ? 'border-purple-500' : activity.type === 'comment' ? 'border-orange-500' : 'border-indigo-500'} ${getActivityBackground(activity.type)}`}
              >
                <div className="flex items-center">
                  <div className="mr-3 rounded-full bg-white p-2">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">
                        {getFamilyMemberName(activity.by)}
                      </span>
                      가 {activity.message}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getRelativeTimeString(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ActivityFeed;
