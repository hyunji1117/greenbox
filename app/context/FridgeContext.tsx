// app/context/FridgeContext.tsx
import React, { useState, createContext, useContext } from 'react';

// Types
export type FamilyMember = 'mom' | 'dad' | 'bigKid' | 'littleKid';

export interface FridgeItem {
  id: string;
  name: string;
  category: 'fridge' | 'freezer' | 'pantry';
  quantity: number;
  addedBy: FamilyMember;
  addedAt: Date;
  comments: Comment[];
  finished: boolean;
  expiryDate?: string;
}

export interface Comment {
  id: string;
  text: string;
  author: FamilyMember;
  createdAt: Date;
}

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
  items: FridgeItem[];
  activities: Activity[];
  assignments: Assignment[];
  currentUser: FamilyMember;
  addItem: (item: Omit<FridgeItem, 'id' | 'addedAt' | 'comments'>) => void;
  updateItem: (id: string, updates: Partial<FridgeItem>) => void;
  markAsFinished: (id: string) => void;
  addComment: (itemId: string, text: string) => void;
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  setCurrentUser: (user: FamilyMember) => void;
}

const FridgeContext = createContext<FridgeContextType | undefined>(undefined);

// Mock data
const initialItems: FridgeItem[] = [
  {
    id: '1',
    name: '우유',
    category: 'fridge',
    quantity: 1,
    addedBy: 'mom',
    addedAt: new Date(Date.now() - 86400000),
    comments: [
      {
        id: '101',
        text: '이거 내일 아침에 먹을거야~',
        author: 'littleKid',
        createdAt: new Date(Date.now() - 3600000),
      },
    ],
    finished: false,
  },
  {
    id: '2',
    name: '딸기',
    category: 'fridge',
    quantity: 1,
    addedBy: 'mom',
    addedAt: new Date(),
    comments: [],
    finished: false,
  },
  {
    id: '3',
    name: '치킨',
    category: 'freezer',
    quantity: 2,
    addedBy: 'dad',
    addedAt: new Date(Date.now() - 172800000),
    comments: [],
    finished: false,
  },
];

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
  const [items, setItems] = useState<FridgeItem[]>(initialItems);
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [assignments, setAssignments] =
    useState<Assignment[]>(initialAssignments);
  const [currentUser, setCurrentUser] = useState<FamilyMember>('mom');

  const addItem = (item: Omit<FridgeItem, 'id' | 'addedAt' | 'comments'>) => {
    const newItem: FridgeItem = {
      ...item,
      id: Date.now().toString(),
      addedAt: new Date(),
      comments: [],
    };
    setItems([newItem, ...items]);

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'add',
      message: `${item.name} 추가했어요`,
      timestamp: new Date(),
      by: currentUser,
      itemId: newItem.id,
    };
    setActivities([newActivity, ...activities]);
  };

  const updateItem = (id: string, updates: Partial<FridgeItem>) => {
    setItems(
      items.map(item =>
        item.id === id
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    );

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'update',
      message: `${items.find(i => i.id === id)?.name} 업데이트했어요`,
      timestamp: new Date(),
      by: currentUser,
      itemId: id,
    };
    setActivities([newActivity, ...activities]);
  };

  const markAsFinished = (id: string) => {
    setItems(
      items.map(item =>
        item.id === id
          ? {
              ...item,
              finished: true,
            }
          : item,
      ),
    );

    const itemName = items.find(i => i.id === id)?.name || '';
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'finish',
      message: `${itemName} 다 먹음 표시했어요`,
      timestamp: new Date(),
      by: currentUser,
      itemId: id,
    };
    setActivities([newActivity, ...activities]);
  };

  const addComment = (itemId: string, text: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      author: currentUser,
      createdAt: new Date(),
    };

    setItems(
      items.map(item =>
        item.id === itemId
          ? {
              ...item,
              comments: [...item.comments, newComment],
            }
          : item,
      ),
    );

    const itemName = items.find(i => i.id === itemId)?.name || '';
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'comment',
      message: `${itemName}에 댓글 남겼어요: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`,
      timestamp: new Date(),
      by: currentUser,
      itemId,
    };
    setActivities([newActivity, ...activities]);
  };

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

  const getFamilyMemberName = (member: FamilyMember): string => {
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
        items,
        activities,
        assignments,
        currentUser,
        addItem,
        updateItem,
        markAsFinished,
        addComment,
        addAssignment,
        setCurrentUser,
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
