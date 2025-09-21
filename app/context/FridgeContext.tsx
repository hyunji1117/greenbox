import React, { useState, createContext, useContext } from 'react'
// Types
export type FamilyMember = 'mom' | 'dad' | 'bigKid' | 'littleKid'
export interface FridgeItem {
  id: string
  name: string
  category: 'fridge' | 'freezer' | 'pantry'
  quantity: number
  addedBy: FamilyMember
  addedAt: Date
  comments: Comment[]
  finished: boolean
}
export interface Comment {
  id: string
  text: string
  author: FamilyMember
  createdAt: Date
}
export interface Assignment {
  id: string
  title: string
  assignedTo: FamilyMember
  dueDate: Date
}
export interface Activity {
  id: string
  type: 'add' | 'update' | 'finish' | 'comment' | 'assignment'
  message: string
  timestamp: Date
  by: FamilyMember
  itemId?: string
}
export interface FoodBenefit {
  id: string
  name: string
  category: string
  benefits: string[]
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    vitamins: string[]
  }
  storageTips: string
  imageUrl?: string
}
interface FridgeContextType {
  items: FridgeItem[]
  activities: Activity[]
  assignments: Assignment[]
  foodBenefits: FoodBenefit[]
  currentUser: FamilyMember
  addItem: (item: Omit<FridgeItem, 'id' | 'addedAt' | 'comments'>) => void
  updateItem: (id: string, updates: Partial<FridgeItem>) => void
  markAsFinished: (id: string) => void
  addComment: (itemId: string, text: string) => void
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void
  setCurrentUser: (user: FamilyMember) => void
  searchFoodBenefits: (query: string) => FoodBenefit[]
}
const FridgeContext = createContext<FridgeContextType | undefined>(undefined)
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
]
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
]
const initialAssignments: Assignment[] = [
  {
    id: '1',
    title: '총괄 관리',
    assignedTo: 'mom',
    dueDate: new Date(Date.now() + 604800000), // 1 week from now
  },
]
const initialFoodBenefits: FoodBenefit[] = [
  {
    id: '1',
    name: '딸기',
    category: '과일',
    benefits: [
      '항산화 작용으로 노화 방지에 도움',
      '면역력 강화에 도움',
      '심혈관 건강 개선',
      '혈당 조절에 도움',
    ],
    nutrition: {
      calories: 32,
      protein: 0.7,
      carbs: 7.7,
      fat: 0.3,
      vitamins: ['비타민 C', '비타민 K', '엽산', '망간'],
    },
    storageTips:
      '씻지 않은 상태로 냉장 보관하고 먹기 직전에 씻어서 드세요. 3-5일 내에 섭취하는 것이 좋습니다.',
    imageUrl:
      'https://hips.hearstapps.com/clv.h-cdn.co/assets/15/22/1432664914-strawberry-facts1.jpg?resize=980:*',
  },
  {
    id: '2',
    name: '우유',
    category: '유제품',
    benefits: [
      '뼈 건강 강화',
      '근육 성장 및 회복 지원',
      '치아 건강 유지',
      '면역 체계 지원',
    ],
    nutrition: {
      calories: 103,
      protein: 8.2,
      carbs: 12.3,
      fat: 2.4,
      vitamins: ['칼슘', '비타민 D', '비타민 B12', '인'],
    },
    storageTips:
      '냉장고에 보관하고 유통기한 내에 섭취하세요. 개봉 후에는 일주일 이내에 섭취하는 것이 좋습니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '3',
    name: '닭고기',
    category: '육류',
    benefits: [
      '단백질 공급으로 근육 유지 및 성장',
      '비타민 B6로 신경계 건강 지원',
      '면역 체계 강화',
      '에너지 생성 촉진',
    ],
    nutrition: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      vitamins: ['비타민 B6', '나이아신', '셀레늄', '인'],
    },
    storageTips:
      '냉장 보관 시 1-2일, 냉동 보관 시 최대 9개월까지 보관 가능합니다. 조리 전에 완전히 해동하세요.',
    imageUrl:
      'https://images.unsplash.com/photo-1587593810167-a84920ea0781?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '4',
    name: '시금치',
    category: '채소',
    benefits: [
      '항산화 작용으로 면역력 강화',
      '눈 건강 개선',
      '뼈 건강 지원',
      '혈압 조절에 도움',
    ],
    nutrition: {
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      vitamins: ['비타민 A', '비타민 C', '비타민 K', '철분', '엽산'],
    },
    storageTips:
      '씻지 않은 상태로 종이 타월에 싸서 밀폐 용기에 넣어 냉장 보관하세요. 3-5일 내에 섭취하는 것이 좋습니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '5',
    name: '연어',
    category: '해산물',
    benefits: [
      '오메가-3 지방산으로 심장 건강 개선',
      '뇌 기능 향상',
      '염증 감소',
      '관절 건강 지원',
    ],
    nutrition: {
      calories: 208,
      protein: 20,
      carbs: 0,
      fat: 13,
      vitamins: ['오메가-3 지방산', '비타민 D', '비타민 B12', '셀레늄'],
    },
    storageTips:
      '냉장 보관 시 1-2일, 냉동 보관 시 최대 3개월까지 보관 가능합니다. 냉동 시 밀봉하여 보관하세요.',
    imageUrl:
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '6',
    name: '아보카도',
    category: '과일',
    benefits: [
      '건강한 지방 공급으로 심장 건강 개선',
      '콜레스테롤 수치 개선',
      '항산화 작용',
      '소화 촉진',
    ],
    nutrition: {
      calories: 160,
      protein: 2,
      carbs: 8.5,
      fat: 14.7,
      vitamins: ['비타민 K', '엽산', '비타민 C', '칼륨'],
    },
    storageTips:
      '익지 않은 아보카도는 실온에서 보관하고, 익은 후에는 냉장 보관하세요. 자른 아보카도는 레몬즙을 뿌려 갈변을 방지하세요.',
    imageUrl:
      'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '7',
    name: '블루베리',
    category: '과일',
    benefits: [
      '강력한 항산화 작용',
      '기억력 및 인지 기능 향상',
      '심혈관 건강 개선',
      '노화 방지에 도움',
    ],
    nutrition: {
      calories: 57,
      protein: 0.7,
      carbs: 14.5,
      fat: 0.3,
      vitamins: ['비타민 K', '비타민 C', '망간', '안토시아닌'],
    },
    storageTips:
      '씻지 않은 상태로 냉장 보관하고 먹기 직전에 씻어서 드세요. 냉동 보관도 가능합니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '8',
    name: '브로콜리',
    category: '채소',
    benefits: [
      '항암 효과',
      '해독 작용 강화',
      '심혈관 건강 지원',
      '항산화 작용',
    ],
    nutrition: {
      calories: 31,
      protein: 2.5,
      carbs: 6,
      fat: 0.3,
      vitamins: ['비타민 C', '비타민 K', '엽산', '칼륨'],
    },
    storageTips:
      '씻지 않은 상태로 통풍이 잘 되는 비닐봉지에 넣어 냉장 보관하세요. 3-5일 내에 섭취하는 것이 좋습니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '9',
    name: '귀리',
    category: '곡물',
    benefits: [
      '콜레스테롤 수치 개선',
      '혈당 조절에 도움',
      '소화 건강 촉진',
      '체중 관리에 도움',
    ],
    nutrition: {
      calories: 389,
      protein: 16.9,
      carbs: 66.3,
      fat: 6.9,
      vitamins: ['망간', '인', '마그네슘', '아연'],
    },
    storageTips:
      '밀봉된 용기에 담아 서늘하고 건조한 곳에 보관하세요. 조리된 귀리는 냉장 보관 시 3-5일간 보관 가능합니다.',
    imageUrl:
      'https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: '10',
    name: '견과류',
    category: '견과류',
    benefits: [
      '심장 건강 개선',
      '항산화 작용',
      '뇌 기능 향상',
      '체중 관리에 도움',
    ],
    nutrition: {
      calories: 607,
      protein: 21,
      carbs: 20,
      fat: 54,
      vitamins: ['비타민 E', '마그네슘', '인', '구리'],
    },
    storageTips:
      '밀봉된 용기에 담아 냉장 또는 냉동 보관하세요. 실온에서는 빠르게 산패될 수 있습니다.',
    imageUrl:
      'https://www.finedininglovers.com/sites/default/files/styles/1_1_768x768/public/article_content_images/Nuts.jpg.webp?itok=YfhewMia',
  },
]
export const FridgeProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [items, setItems] = useState<FridgeItem[]>(initialItems)
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [assignments, setAssignments] =
    useState<Assignment[]>(initialAssignments)
  const [foodBenefits, setFoodBenefits] =
    useState<FoodBenefit[]>(initialFoodBenefits)
  const [currentUser, setCurrentUser] = useState<FamilyMember>('mom')
  const addItem = (item: Omit<FridgeItem, 'id' | 'addedAt' | 'comments'>) => {
    const newItem: FridgeItem = {
      ...item,
      id: Date.now().toString(),
      addedAt: new Date(),
      comments: [],
    }
    setItems([newItem, ...items])
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'add',
      message: `${item.name} 추가했어요`,
      timestamp: new Date(),
      by: currentUser,
      itemId: newItem.id,
    }
    setActivities([newActivity, ...activities])
  }
  const updateItem = (id: string, updates: Partial<FridgeItem>) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    )
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'update',
      message: `${items.find((i) => i.id === id)?.name} 업데이트했어요`,
      timestamp: new Date(),
      by: currentUser,
      itemId: id,
    }
    setActivities([newActivity, ...activities])
  }
  const markAsFinished = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              finished: true,
            }
          : item,
      ),
    )
    const itemName = items.find((i) => i.id === id)?.name || ''
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'finish',
      message: `${itemName} 다 먹음 표시했어요`,
      timestamp: new Date(),
      by: currentUser,
      itemId: id,
    }
    setActivities([newActivity, ...activities])
  }
  const addComment = (itemId: string, text: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      text,
      author: currentUser,
      createdAt: new Date(),
    }
    setItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              comments: [...item.comments, newComment],
            }
          : item,
      ),
    )
    const itemName = items.find((i) => i.id === itemId)?.name || ''
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'comment',
      message: `${itemName}에 댓글 남겼어요: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`,
      timestamp: new Date(),
      by: currentUser,
      itemId,
    }
    setActivities([newActivity, ...activities])
  }
  const addAssignment = (assignment: Omit<Assignment, 'id'>) => {
    const newAssignment: Assignment = {
      ...assignment,
      id: Date.now().toString(),
    }
    setAssignments([...assignments, newAssignment])
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'assignment',
      message: `새로운 담당: ${assignment.title} → ${getFamilyMemberName(assignment.assignedTo)}`,
      timestamp: new Date(),
      by: currentUser,
    }
    setActivities([newActivity, ...activities])
  }
  const searchFoodBenefits = (query: string): FoodBenefit[] => {
    if (!query.trim()) return foodBenefits
    const lowercaseQuery = query.toLowerCase()
    return foodBenefits.filter(
      (food) =>
        food.name.toLowerCase().includes(lowercaseQuery) ||
        food.category.toLowerCase().includes(lowercaseQuery) ||
        food.benefits.some((benefit) =>
          benefit.toLowerCase().includes(lowercaseQuery),
        ),
    )
  }
  const getFamilyMemberName = (member: FamilyMember): string => {
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
    <FridgeContext.Provider
      value={{
        items,
        activities,
        assignments,
        foodBenefits,
        currentUser,
        addItem,
        updateItem,
        markAsFinished,
        addComment,
        addAssignment,
        setCurrentUser,
        searchFoodBenefits,
      }}
    >
      {children}
    </FridgeContext.Provider>
  )
}
export const useFridge = () => {
  const context = useContext(FridgeContext)
  if (context === undefined) {
    throw new Error('useFridge must be used within a FridgeProvider')
  }
  return context
}
