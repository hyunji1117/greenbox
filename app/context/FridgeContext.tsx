// app/context/FridgeContext.tsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { toDisplayName, type MyProfile } from '@/app/lib/user/displayName';

// Types
export type FamilyMember = 'mom' | 'dad' | 'bigKid' | 'littleKid';

export interface Assignment {
  id: string;
  title: string;
  assignedTo: FamilyMember;
  dueDate: Date;
}

export interface Activity {
  id: string;
  type: 'add' | 'update' | 'finish' | 'comment' | 'assignment';
  message: string;
  timestamp: Date;
  by: FamilyMember;
  itemId?: string;
}

interface FridgeContextType {
  activities: Activity[];
  assignments: Assignment[];
  currentUser: FamilyMember;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  setCurrentUser: (user: FamilyMember) => void;
  // 로그인 사용자 프로필 (불러오기 전에는 null)
  myProfile: MyProfile | null;
  setMyProfile: (profile: MyProfile) => void;
  // 화면에 표시할 가족 구성원 이름. 현재 사용자는 가족 내 호칭 또는 구글 이름
  getFamilyMemberName: (member: string) => string;
}

const FridgeContext = createContext<FridgeContextType | undefined>(undefined);

// Mock data (활동과 할일은 아직 서버에 저장하지 않는다. 품목은 app/lib/items/useItems.ts)
const initialActivities: Activity[] = [
  {
    id: '1',
    type: 'add',
    message: '딸기 추가했어요 🍓',
    timestamp: new Date(),
    by: 'mom',
    itemId: '2',
  },
  {
    id: '2',
    type: 'comment',
    message: '우유에 댓글 남겼어요: "이거 내일 아침에 먹을거야~"',
    timestamp: new Date(Date.now() - 3600000),
    by: 'littleKid',
    itemId: '1',
  },
];

const initialAssignments: Assignment[] = [
  {
    id: '1',
    title: '총괄 관리',
    assignedTo: 'mom',
    dueDate: new Date(Date.now() + 604800000), // 1 week from now
  },
];

export const FridgeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [assignments, setAssignments] =
    useState<Assignment[]>(initialAssignments);
  const [currentUser, setCurrentUser] = useState<FamilyMember>('mom');
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);

  // 로그인 사용자 프로필은 앱을 열 때 한 번 불러온다
  useEffect(() => {
    let cancelled = false;
    fetch('/api/me', { cache: 'no-store' })
      .then(res => (res.ok ? (res.json() as Promise<MyProfile>) : null))
      .then(profile => {
        if (!cancelled && profile) setMyProfile(profile);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const addAssignment = (assignment: Omit<Assignment, 'id'>) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: Date.now().toString(),
    };
    setAssignments([...assignments, newAssignment]);

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'assignment',
      message: `새로운 담당: ${assignment.title} → ${getFamilyMemberName(assignment.assignedTo)}`,
      timestamp: new Date(),
      by: currentUser,
    };
    setActivities([newActivity, ...activities]);
  };

  // 다른 가족 구성원은 가족 기능을 만들기 전까지 목업 이름
  const getFamilyMemberName = (member: string): string => {
    if (member === currentUser) {
      const myName = toDisplayName(myProfile);
      if (myName) return myName;
    }
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
    <FridgeContext.Provider
      value={{
        activities,
        assignments,
        currentUser,
        addAssignment,
        setCurrentUser,
        myProfile,
        setMyProfile,
        getFamilyMemberName,
      }}
    >
      {children}
    </FridgeContext.Provider>
  );
};

export const useFridge = () => {
  const context = useContext(FridgeContext);
  if (context === undefined) {
    throw new Error('useFridge must be used within a FridgeProvider');
  }
  return context;
};
