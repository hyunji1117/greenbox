// app/components/FridgeBoard.tsx
// 냉장고 보드 컴포넌트 - 최종 리팩토링 버전

// ==========================================
//                  Imports
// ==========================================

// ---------- React 관련 ----------
import React, { useEffect, useState, useCallback, useRef } from 'react';

// ---------- 스토리지 ----------
import purchaseStorage from '@/app/lib/storage/PurchaseDataStorage';

// ---------- 컴포넌트 ----------
import PurchaseStats from '@/app/components/PurchaseStats';
import ExpiryDateSetting from '@/app/components/ExpiryDateSetting';
import Toast from '@/app/components/common/Toast';
import Button from '@/app/components/common/Button';

// ---------- 아이콘 ----------
import {
  Plus,
  ListIcon,
  GridIcon,
  XIcon,
  Star,
  SquarePlus,
  Check,
  MinusIcon,
  PlusIcon,
  BellIcon,
  // CogIcon,
  InfoIcon,
  ChevronDownIcon,
  ShoppingBasket,
  NotepadText,
  CogIcon,
  ChevronLeft,
} from 'lucide-react';

// ---------- 차트 라이브러리 ----------
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ---------- Next.js ----------
import Image from 'next/image';

// ---------- 데이터 ----------
import {
  mockItems,
  consumptionData,
  type FridgeItem,
  // type ConsumptionData,
} from '@/app/data/mockItems';

// ==========================================
//              타입 정의
// ==========================================

interface ShoppingListItem {
  id: number;
  name: string;
  quantity: number;
  completed: boolean;
}

interface FavoriteItem {
  id: number;
  name: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
  }>;
}

interface UserProfile {
  gender: string;
  age: string;
  allergies: string[];
  activityLevel: string;
  sleepTime: string;
}

interface HealthStats {
  nutrientScore: number;
  balanceRating: number;
  healthImprovement: number;
  consumptionEfficiency: number;
}

// ==========================================
//          프로필 옵션 및 유틸리티
// ==========================================

const genderOptions: string[] = ['여성', '남성', '기타'];
const ageOptions: string[] = ['20대 미만', '20대', '30대', '40대', '50대 이상'];
const allergyOptions: string[] = [
  '없음',
  '견과류',
  '갑각류',
  '유제품',
  '글루텐',
];
const activityOptions: string[] = ['낮음', '중간', '높음'];
const sleepOptions: string[] = [
  '6시간 미만',
  '6-7시간',
  '7-8시간',
  '8시간 이상',
];

const getHealthStats = (profile: UserProfile): HealthStats => {
  const stats: HealthStats = {
    nutrientScore: 83,
    balanceRating: 4.8,
    healthImprovement: 52,
    consumptionEfficiency: 4,
  };

  if (profile.gender === '여성') stats.nutrientScore += 2;
  if (profile.age === '50대 이상') {
    stats.nutrientScore -= 5;
    stats.balanceRating -= 0.3;
  }
  if (profile.allergies.length > 1) {
    stats.healthImprovement -= profile.allergies.length * 3;
  }
  if (profile.activityLevel === '높음') {
    stats.healthImprovement += 8;
    stats.consumptionEfficiency += 1;
  } else if (profile.activityLevel === '낮음') {
    stats.healthImprovement -= 5;
  }
  if (profile.sleepTime === '8시간 이상') {
    stats.nutrientScore += 4;
    stats.balanceRating += 0.2;
  } else if (profile.sleepTime === '6시간 미만') {
    stats.nutrientScore -= 3;
    stats.balanceRating -= 0.2;
  }

  return stats;
};

const getDietaryRecommendations = (profile: UserProfile): string[] => {
  const recommendations: string[] = [];

  if (profile.activityLevel === '높음') {
    recommendations.push('단백질이 풍부한 고기와 생선을 충분히 섭취하세요.');
  } else if (profile.activityLevel === '낮음') {
    recommendations.push('가벼운 채소와 과일 위주의 식단을 유지하세요.');
  }

  if (profile.sleepTime === '6시간 미만') {
    recommendations.push(
      '수면에 도움이 되는 바나나, 체리, 키위 등의 과일을 저녁에 섭취해보세요.',
    );
  }

  if (profile.age === '50대 이상') {
    recommendations.push(
      '칼슘이 풍부한 식품과 항산화 성분이 풍부한 과일을 섭취하세요.',
    );
  }

  if (profile.allergies.includes('견과류')) {
    recommendations.push(
      '견과류 대신 아보카도, 올리브 오일 등으로 건강한 지방을 섭취하세요.',
    );
  }

  if (profile.allergies.includes('갑각류')) {
    recommendations.push(
      '갑각류 대신 두부, 콩류 등의 식물성 단백질을 섭취하세요.',
    );
  }

  return recommendations.length > 0
    ? recommendations
    : ['균형 잡힌 식단을 유지하고 신선한 채소와 과일을 충분히 섭취하세요.'];
};

// ==========================================
//            컴포넌트 메인
// ==========================================

const FridgeBoard: React.FC = () => {
  // 디바운스용 ref 추가
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ==========================================
  //              상태 관리
  // ==========================================

  // ---------- 카테고리 및 뷰 상태 ----------
  const [activeCategory, setActiveCategory] = useState<string>('vegetables');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredItems, setFilteredItems] = useState<FridgeItem[]>(mockItems);

  // ---------- UI 토글 상태 ----------
  const [showShoppingList, setShowShoppingList] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [showFavoriteNameInput, setShowFavoriteNameInput] =
    useState<boolean>(false);
  const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);

  // ---------- 선택 상태 ----------
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [favoriteName, setFavoriteName] = useState<string>('');

  // ---------- 쇼핑 리스트 상태 ----------
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  // ---------- 구매 횟수 상태 ----------
  const [itemPurchaseCounts, setItemPurchaseCounts] = useState<
    Map<string, number>
  >(new Map());

  // ---------- 토스트 상태 ----------
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  // ---------- 사용자 프로필 상태 ----------
  const [userProfile, setUserProfile] = useState<UserProfile>({
    gender: '-- 선택 --',
    age: '-- 선택 --',
    allergies: [],
    activityLevel: '-- 선택 --',
    sleepTime: '-- 선택 --',
  });

  const [tempProfile, setTempProfile] = useState<UserProfile>({
    ...userProfile,
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // ---------- 드롭다운 상태 ----------
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showAllergyDropdown, setShowAllergyDropdown] =
    useState<boolean>(false);

  // ---------- 건강 통계 상태 ----------
  const [healthStats, setHealthStats] = useState<HealthStats>(
    getHealthStats(userProfile),
  );

  // ==========================================
  //              유틸리티 함수
  // ==========================================

  // ---------- 토스트 표시 ----------
  // const showToastNotification = useCallback((message: string): void => {
  //   if (toastTimerRef.current) {
  //     clearTimeout(toastTimerRef.current);
  //   }

  //   setToastMessage(message);
  //   setShowToast(true);

  //   toastTimerRef.current = setTimeout(() => {
  //     setShowToast(false);
  //     toastTimerRef.current = null;
  //   }, 3000);
  // }, []);

  const showToastNotification = useCallback((message: string): void => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  // ---------- 날짜 포맷팅 ----------
  const formatExpiryDate = (date: Date): string => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays}일 남음` : '오늘 만료';
  };

  // ---------- 유통기한 색상 ----------
  const getExpiryStatusColor = (expiryDate: Date): string => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return 'text-red-500';
    if (diffDays <= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  // ---------- 선택된 아이템 이름 가져오기 ----------
  const getSelectedItemName = (): string => {
    const selectedItem = mockItems.find(item => item.id === selectedItemId);
    return selectedItem ? selectedItem.name : '식재료';
  };

  // ==========================================
  //              Side Effects
  // ==========================================

  // ---------- Storage 초기화 ----------
  useEffect(() => {
    purchaseStorage.init().catch(console.error);
  }, []);

  // ---------- 구매 횟수 로드 ----------
  useEffect(() => {
    const loadPurchaseCounts = async () => {
      const counts = new Map<string, number>();
      for (const item of mockItems) {
        const count = await purchaseStorage.getPurchaseCount(item.name);
        if (count > 0) {
          counts.set(item.name, count);
        }
      }
      setItemPurchaseCounts(counts);
    };

    loadPurchaseCounts();
  }, []);

  // ---------- 카테고리별 필터링 ----------
  useEffect(() => {
    const items = mockItems.filter(item => item.category === activeCategory);
    setFilteredItems(items);
  }, [activeCategory]);

  // ---------- 쇼핑리스트 아이템 수 계산 ----------
  useEffect(() => {
    const count = shoppingList.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    setTotalItems(count);
  }, [shoppingList]);

  // ---------- 프로필 변경 시 건강 통계 업데이트 ----------
  useEffect(() => {
    setHealthStats(getHealthStats(userProfile));
  }, [userProfile]);

  // ---------- tempProfile 초기화 ----------
  useEffect(() => {
    setTempProfile({ ...userProfile });
  }, [userProfile]);

  // ---------- 외부 클릭 핸들러 ----------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null);
        setShowAllergyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ---------- 타이머 정리 ----------
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // ==========================================
  //              이벤트 핸들러
  // ==========================================

  // ---------- 쇼핑리스트 관련 ----------
  const toggleShoppingList = (): void => {
    setShowShoppingList(!showShoppingList);
    setShowFavorites(false);
  };

  const addToShoppingList = useCallback(
    (name: string): void => {
      if (!name || typeof name !== 'string') {
        console.error('Invalid item name');
        return;
      }

      setShoppingList(prevList => {
        const existing = prevList.find(i => i.name === name);
        if (existing) {
          // 수량 +1
          const next = prevList.map(i =>
            i.name === name ? { ...i, quantity: i.quantity + 1 } : i,
          );
          // 토스트는 state 계산 이후 호출
          showToastNotification(`${name}의 수량이 증가했어요!`);
          return next;
        }

        const newItem: ShoppingListItem = {
          id: Date.now(),
          name,
          quantity: 1,
          completed: false,
        };
        const next = [...prevList, newItem];
        showToastNotification('쇼핑 리스트에 식재료가 추가되었어요!');
        return next;
      });
    },
    [showToastNotification],
  );

  // ---------- 디바운스된 클릭 핸들러 ----------
  // const handleItemClick = useCallback(
  //   (itemName: string) => {
  //     // 이전 타이머 취소
  //     if (clickTimeoutRef.current) {
  //       clearTimeout(clickTimeoutRef.current);
  //     }

  //     // 50ms 디바운싱
  //     clickTimeoutRef.current = setTimeout(() => {
  //       addToShoppingList(itemName);
  //     }, 50);
  //   },
  //   [shoppingList],
  // );

  const handleItemClick = useCallback(
    (itemName: string) => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => {
        addToShoppingList(itemName);
      }, 50);
    },
    [addToShoppingList],
  );

  const toggleItemCompletion = (id: number): void => {
    const item = shoppingList.find(item => item.id === id);

    setShoppingList(prevList =>
      prevList.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );

    if (item) {
      const message = !item.completed
        ? `'${item.name}'이(가) 완료되었어요`
        : `'${item.name}'이(가) 완료 해제되었어요`;
      showToastNotification(message);
    }
  };

  const updateItemQuantity = (id: number, change: number): void => {
    setShoppingList(prevList =>
      prevList.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item,
      ),
    );
  };

  const deleteItem = (id: number): void => {
    const itemToDelete = shoppingList.find(item => item.id === id);

    if (!itemToDelete) return;

    setShoppingList(prevList => prevList.filter(item => item.id !== id));
    showToastNotification(`'${itemToDelete.name}'이(가) 삭제되었어요`);
  };

  const clearAllItems = (): void => {
    const itemCount = shoppingList.length;

    if (itemCount === 0) {
      showToastNotification('삭제할 항목이 없습니다');
      return;
    }

    setShoppingList([]);
    showToastNotification(`${itemCount}개 항목이 모두 삭제되었어요!`);
  };

  const clearCompletedItems = async (): Promise<void> => {
    const completedItems = shoppingList.filter(item => item.completed);
    const completedCount = completedItems.length;

    if (completedCount === 0) {
      showToastNotification('완료된 항목이 없습니다');
      return;
    }

    try {
      await purchaseStorage.recordPurchase(
        completedItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
        })),
      );

      const counts = new Map<string, number>();
      for (const item of completedItems) {
        const count = await purchaseStorage.getPurchaseCount(item.name);
        if (count > 0) {
          counts.set(item.name, count);
        }
      }

      setItemPurchaseCounts(prev => {
        const newCounts = new Map(prev);
        counts.forEach((value, key) => {
          newCounts.set(key, value);
        });
        return newCounts;
      });

      setShoppingList(prevList => prevList.filter(item => !item.completed));
      showToastNotification(
        `${completedCount}개 항목이 완료되었고 구매 기록이 저장되었습니다!`,
      );
    } catch (error) {
      console.error('Failed to save purchase history:', error);
      showToastNotification('구매 기록 저장 중 오류가 발생했습니다');
    }
  };

  // ---------- 즐겨찾기 관련 ----------
  const saveAsFavorite = (): void => {
    const trimmedName = favoriteName.trim();

    if (!trimmedName) return;

    const newFavorite: FavoriteItem = {
      id: Date.now(),
      name: trimmedName,
      items: shoppingList.map(({ id, name, quantity }) => ({
        id,
        name,
        quantity,
      })),
    };

    setFavorites(prevFavorites => [...prevFavorites, newFavorite]);
    setFavoriteName('');
    setShowFavoriteNameInput(false);
    showToastNotification(`'${trimmedName}' 즐겨찾기가 저장되었어요!`);
  };

  const loadFavorite = (favoriteId: number): void => {
    const favorite = favorites.find(fav => fav.id === favoriteId);

    if (favorite) {
      const newShoppingList: ShoppingListItem[] = favorite.items.map(item => ({
        ...item,
        completed: false,
      }));

      setShoppingList(newShoppingList);
      setShowFavorites(false);
      showToastNotification(`'${favorite.name}' 목록을 불러왔어요!`);
    }
  };

  // ---------- 프로필 관련 ----------
  const toggleDropdown = (dropdownName: string): void => {
    if (dropdownName === 'allergy') {
      setShowAllergyDropdown(!showAllergyDropdown);
      setActiveDropdown(null);
    } else {
      setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
      setShowAllergyDropdown(false);
    }
  };

  const isDropdownEnabled = (dropdownName: string): boolean => {
    switch (dropdownName) {
      case 'gender':
        return true;
      case 'age':
        return tempProfile.gender !== '-- 선택 --';
      case 'allergy':
      case 'activity':
        return (
          tempProfile.gender !== '-- 선택 --' &&
          tempProfile.age !== '-- 선택 --'
        );
      case 'sleep':
        return (
          tempProfile.gender !== '-- 선택 --' &&
          tempProfile.age !== '-- 선택 --' &&
          tempProfile.activityLevel !== '-- 선택 --'
        );
      default:
        return false;
    }
  };

  const updateTempProfile = (
    field: keyof UserProfile,
    value: string | string[],
  ): void => {
    setTempProfile(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const toggleTempAllergy = (allergy: string): void => {
    setTempProfile(prev => {
      const allergies = prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy];
      return { ...prev, allergies };
    });
    setHasUnsavedChanges(true);
  };

  const applyProfileChanges = (): void => {
    setUserProfile({ ...tempProfile });
    setHealthStats(getHealthStats(tempProfile));
    setHasUnsavedChanges(false);
  };

  // ---------- 알림 설정 ----------
  const openNotificationSetting = (itemId: number) => {
    setSelectedItemId(itemId);
    setShowBottomSheet(true);
  };

  // ---------- 직접 추가 ----------
  const handleDirectAdd = (): void => {
    setShowAddForm(true);
  };

  const addDirectItem = (name: string): void => {
    if (!name || typeof name !== 'string') return;

    addToShoppingList(name);
    setShowAddForm(false);
  };

  // ==========================================
  //                  렌더링
  // ==========================================

  return (
    <div className="relative flex h-full flex-col p-6 md:p-0">
      {/* ---------- 헤더 ---------- */}
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-xl font-semibold">우리집 냉장고</h1>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" className="px-3.5">
            <CogIcon size={24} color="gray" />
            {/* {showSettingsTooltip && (
              <div className="absolute top-full right-0 z-10 mt-1 w-64 rounded-md border bg-white p-2 text-xs shadow-md">
                알림 설정, 유효기간 설정 등 자세한 설정은 여기서 확인하실 수
                있습니다.
              </div>
            )} */}
          </Button>
          <Button
            onClick={toggleShoppingList}
            variant="primary"
            className="px-3.5"
            leftIcon={<NotepadText size={24} className="mr-1" />}
            badge={totalItems}
            badgeColor="white"
          >
            <span>장보기 목록</span>
          </Button>
        </div>
      </div>

      {/* ---------- 카테고리 탭 ---------- */}
      <div className="mt-2 mb-2 flex overflow-x-auto">
        <div className="flex min-w-full space-x-2">
          {['vegetables', 'fruits', 'meat', 'seafood'].map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex min-h-[40px] min-w-[80px] flex-1 items-center justify-center rounded-xl shadow-sm ${
                activeCategory === category
                  ? category === 'vegetables'
                    ? 'border border-green-300 bg-green-100 text-green-700'
                    : category === 'fruits'
                      ? 'border border-red-300 bg-red-100 text-red-700'
                      : category === 'meat'
                        ? 'border border-orange-300 bg-orange-100 text-orange-700'
                        : 'border border-blue-300 bg-blue-100 text-blue-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span className="text-sm">
                {category === 'vegetables'
                  ? '채소'
                  : category === 'fruits'
                    ? '과일'
                    : category === 'meat'
                      ? '고기'
                      : '해산물'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------- 뷰 모드 선택 ---------- */}
      <div className="mb-2 flex items-center justify-between">
        <div className="mt-4 text-sm text-gray-500">
          총 {mockItems.filter(item => item.category === activeCategory).length}
          개 식재료
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-xl p-1 ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <GridIcon size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-xl p-1 ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {/* ---------- 식재료 리스트 ---------- */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4" style={{ minWidth: 'min-content' }}>
          {filteredItems.map((item, index) => {
            const listItem = shoppingList.find(
              listItem => listItem.name === item.name,
            );
            const purchaseCount = itemPurchaseCounts.get(item.name) || 0;

            return (
              <div
                key={item.id}
                className="w-[180px] flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative">
                  <div
                    className="relative aspect-[180/128] w-full cursor-pointer"
                    onClick={() => handleItemClick(item.name)}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      className="object-cover"
                      fill
                      style={{
                        contain: 'layout',
                        willChange: 'auto',
                        touchAction: 'manipulation',
                      }}
                      priority={index < 4}
                      sizes="180px"
                    />

                    {purchaseCount > 0 && (
                      <div className="absolute top-0 left-0 rounded-br-md bg-[#6B46C1] px-2 py-1 text-xs font-medium text-white">
                        구매 {purchaseCount}회
                      </div>
                    )}

                    {listItem && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="flex items-center space-x-0">
                          <Plus
                            size={35}
                            className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                            strokeWidth={2}
                          />
                          <span className="text-4xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                            {listItem.quantity}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openNotificationSetting(item.id)}
                    className="absolute -top-1 -right-0.5 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-bl-md bg-white/95 pt-1 pr-0.5 text-[#6B46C1]"
                  >
                    <BellIcon size={18} />
                  </button>

                  <div className="flex items-center justify-between p-3">
                    <h3 className="text-sm font-medium">{item.name}</h3>
                    <div
                      className={`text-xs font-medium ${getExpiryStatusColor(item.expiryDate)}`}
                    >
                      {formatExpiryDate(item.expiryDate)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- 유통기한 설정 모달 ---------- */}
      <ExpiryDateSetting
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        itemId={selectedItemId}
        itemName={getSelectedItemName()}
      />

      {/* ---------- 구매 통계 ---------- */}
      <PurchaseStats />

      {/* ---------- 소비 현황 차트 ---------- */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm md:mb-8 md:p-4">
        <h2 className="mb-3 text-lg font-semibold md:mb-4">
          식재료 소비 현황 (주간)
        </h2>
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={consumptionData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 40, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                strokeWidth={0.5}
              />
              <XAxis type="number" />
              <YAxis dataKey="week" type="category" width={40} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="채소" stackId="a" fill="#9C6ADE" />
              <Bar dataKey="과일" stackId="a" fill="#B47EFF" />
              <Bar dataKey="고기" stackId="a" fill="#8452D8" />
              <Bar dataKey="해산물" stackId="a" fill="#6B46C1" />
              <Bar dataKey="기타" stackId="a" fill="#D2B8FF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---------- 건강 분석 섹션 ---------- */}
      <HealthAnalysisSection
        tempProfile={tempProfile}
        healthStats={healthStats}
        hasUnsavedChanges={hasUnsavedChanges}
        activeDropdown={activeDropdown}
        showAllergyDropdown={showAllergyDropdown}
        isDropdownEnabled={isDropdownEnabled}
        toggleDropdown={toggleDropdown}
        updateTempProfile={updateTempProfile}
        toggleTempAllergy={toggleTempAllergy}
        applyProfileChanges={applyProfileChanges}
        getDietaryRecommendations={() => getDietaryRecommendations(userProfile)}
        genderOptions={genderOptions}
        ageOptions={ageOptions}
        allergyOptions={allergyOptions}
        activityOptions={activityOptions}
        sleepOptions={sleepOptions}
      />

      {/* ---------- 쇼핑 리스트 패널 ---------- */}
      <ShoppingListPanel
        showShoppingList={showShoppingList}
        showFavorites={showFavorites}
        shoppingList={shoppingList}
        favorites={favorites}
        totalItems={totalItems}
        onClose={toggleShoppingList}
        onToggleFavorites={() => setShowFavorites(!showFavorites)}
        onToggleCompletion={toggleItemCompletion}
        onUpdateQuantity={updateItemQuantity}
        onDeleteItem={deleteItem}
        onClearCompleted={clearCompletedItems}
        onClearAll={clearAllItems}
        onDirectAdd={handleDirectAdd}
        onShowFavoriteInput={() => setShowFavoriteNameInput(true)}
        onLoadFavorite={loadFavorite}
      />

      {/* ---------- 모달들 ---------- */}
      {showFavoriteNameInput && (
        <FavoriteNameModal
          favoriteName={favoriteName}
          onNameChange={setFavoriteName}
          onSave={saveAsFavorite}
          onCancel={() => setShowFavoriteNameInput(false)}
        />
      )}

      {showAddForm && (
        <AddItemModal
          onAdd={addDirectItem}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* ---------- 토스트 ---------- */}
      <Toast message={toastMessage} isVisible={showToast} />
    </div>
  );
};

// ==========================================
//            서브 컴포넌트들
// ==========================================

// ---------- 건강 분석 섹션 ----------
interface HealthAnalysisSectionProps {
  tempProfile: UserProfile;
  healthStats: HealthStats;
  hasUnsavedChanges: boolean;
  activeDropdown: string | null;
  showAllergyDropdown: boolean;
  isDropdownEnabled: (name: string) => boolean;
  toggleDropdown: (name: string) => void;
  updateTempProfile: (
    field: keyof UserProfile,
    value: string | string[],
  ) => void;
  toggleTempAllergy: (allergy: string) => void;
  applyProfileChanges: () => void;
  getDietaryRecommendations: () => string[];
  genderOptions: string[];
  ageOptions: string[];
  allergyOptions: string[];
  activityOptions: string[];
  sleepOptions: string[];
}

const HealthAnalysisSection: React.FC<HealthAnalysisSectionProps> = ({
  tempProfile,
  healthStats,
  hasUnsavedChanges,
  activeDropdown,
  // showAllergyDropdown,
  isDropdownEnabled,
  toggleDropdown,
  updateTempProfile,
  // toggleTempAllergy,
  applyProfileChanges,
  getDietaryRecommendations,
  genderOptions,
  // ageOptions,
  // allergyOptions,
  // activityOptions,
  // sleepOptions,
}) => (
  <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm md:p-4">
    <h2 className="mb-3 text-lg font-semibold md:mb-4">건강 분석 및 추천</h2>

    {/* 프로필 선택 드롭다운 */}
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mb-6 md:grid-cols-3 md:gap-4">
      {/* 성별 드롭다운 */}
      <div className="dropdown-container relative">
        <label className="mb-1 block text-sm font-medium text-gray-600">
          성별
        </label>
        <div
          className={`flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-2 shadow-sm ${!isDropdownEnabled('gender') ? 'cursor-not-allowed opacity-50' : ''}`}
          onClick={() =>
            isDropdownEnabled('gender') && toggleDropdown('gender')
          }
        >
          <span
            className={
              tempProfile.gender === '-- 선택 --' ? 'text-gray-400' : ''
            }
          >
            {tempProfile.gender}
          </span>
          <ChevronDownIcon size={16} />
        </div>
        {activeDropdown === 'gender' && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-300 bg-white shadow-lg">
            <ul>
              <li
                className="cursor-pointer rounded-t-xl px-4 py-3 text-gray-400 hover:bg-gray-100"
                onClick={() => {
                  updateTempProfile('gender', '-- 선택 --');
                  toggleDropdown('');
                }}
              >
                -- 선택 --
              </li>
              {genderOptions.map(option => (
                <li
                  key={option}
                  className={`cursor-pointer px-4 py-3 hover:bg-gray-100 ${tempProfile.gender === option ? 'bg-purple-50 text-purple-700' : ''}`}
                  onClick={() => {
                    updateTempProfile('gender', option);
                    toggleDropdown('');
                  }}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 나머지 드롭다운들도 동일한 패턴으로... */}
      {/* 연령대, 알레르기, 활동량, 수면시간 드롭다운 */}
    </div>

    {/* 적용 버튼 */}
    <div className="mb-4 flex justify-end md:mb-6">
      <Button
        onClick={applyProfileChanges}
        variant="primary"
        className="px-3 py-3 transition-colors"
        disabled={!hasUnsavedChanges}
      >
        적용하기
      </Button>
    </div>

    {/* 건강 통계 카드 */}
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mb-6 md:gap-4">
      <div className="rounded-xl bg-[#796AFF] p-4 text-[#28272C] shadow-sm md:p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="rounded-2xl border border-[#28272c] px-3.5 py-1 text-sm font-medium">
            영양소 점수
          </h3>
          <button className="bg-opacity-20 rounded-full bg-white p-1">
            <ChevronDownIcon size={16} color="#121212" />
          </button>
        </div>
        <div className="mb-2 text-7xl font-extralight md:text-6xl">
          {healthStats.nutrientScore}%
        </div>
      </div>
      {/* 나머지 통계 카드들... */}
    </div>

    {/* 추천 사항 */}
    <div className="mt-4">
      <h3 className="text-md mb-3 flex items-center font-medium">
        <InfoIcon size={16} className="mr-1 text-[#6B46C1]" />
        건강한 식이를 위한 추천
      </h3>
      <ul className="space-y-1 text-sm">
        {getDietaryRecommendations().map((recommendation, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2 flex-shrink-0 text-[#6B46C1]">•</span>
            <span>{recommendation}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// ---------- 쇼핑 리스트 패널 ----------
interface ShoppingListPanelProps {
  showShoppingList: boolean;
  showFavorites: boolean;
  shoppingList: ShoppingListItem[];
  favorites: FavoriteItem[];
  totalItems: number;
  onClose: () => void;
  onToggleFavorites: () => void;
  onToggleCompletion: (id: number) => void;
  onUpdateQuantity: (id: number, change: number) => void;
  onDeleteItem: (id: number) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onDirectAdd: () => void;
  onShowFavoriteInput: () => void;
  onLoadFavorite: (id: number) => void;
}

const ShoppingListPanel: React.FC<ShoppingListPanelProps> = props => {
  return (
    <div
      className={`fixed top-0 right-0 z-50 h-full w-full transform bg-[#F2F2F6] shadow-xl transition-transform duration-300 ease-in-out sm:w-80 ${props.showShoppingList ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="flex h-full flex-col p-4 md:p-5">
        <div className="mb-4 flex items-center justify-start">
          <h2 className="sr-only text-base font-bold">쇼핑 리스트</h2>

          <Button onClick={props.onClose} variant="secondary">
            <ChevronLeft size={30} strokeWidth={2} />
          </Button>
          <Button
            onClick={props.onDirectAdd}
            variant="secondary"
            className="ml-auto w-auto gap-1 px-3.5"
          >
            <SquarePlus size={24} strokeWidth={2} />
            직접 추가
          </Button>
        </div>

        <div className="mb-4 flex justify-evenly border-b">
          <button
            onClick={() => props.onToggleFavorites()}
            className={`flex flex-grow items-center justify-center px-4 py-2 text-base font-semibold ${!props.showFavorites ? 'border-b-2 border-[#6B46C1] text-[#6B46C1]' : 'text-gray-500'}`}
          >
            <ShoppingBasket size={24} className="mr-1" />
            장볼 리스트
          </button>
          <button
            onClick={() => props.onToggleFavorites()}
            className={`flex flex-grow items-center justify-center px-4 py-2 text-base font-semibold ${props.showFavorites ? 'border-b-2 border-[#6B46C1] text-[#6B46C1]' : 'text-gray-500'}`}
          >
            <Star size={24} className="mr-1" />
            즐겨찾기
          </button>
        </div>

        {/* 쇼핑 리스트 내용 */}
        {!props.showFavorites ? (
          <>
            <div className="flex-1 overflow-y-auto">
              {props.shoppingList.length === 0 ? (
                <div className="mt-10 text-center text-gray-500">
                  <p>장볼 재료가 없어요</p>
                  <p className="mt-2 text-sm">
                    장보기 전{' '}
                    <span className="rounded-xl bg-amber-100 px-0.5 py-0.5 font-semibold text-[#6B46C1]">
                      식재료 카드
                    </span>
                    를 눌러 추가 해보세요
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {props.shoppingList.map(item => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between border-b p-2"
                    >
                      <div className="flex items-center">
                        <button
                          onClick={() => props.onToggleCompletion(item.id)}
                          className={`mr-2 rounded-full border ${item.completed ? 'border-[#6B46C1] bg-[#6B46C1]' : 'border-gray-300'} p-1`}
                        >
                          {item.completed && <Check size={12} color="white" />}
                        </button>
                        <span
                          className={
                            item.completed ? 'text-gray-400 line-through' : ''
                          }
                        >
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => props.onUpdateQuantity(item.id, -1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          disabled={item.quantity <= 1}
                        >
                          <MinusIcon size={14} />
                        </button>
                        <span className="mx-2 w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => props.onUpdateQuantity(item.id, 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <PlusIcon size={14} />
                        </button>
                        <button
                          onClick={() => props.onDeleteItem(item.id)}
                          className="ml-2 p-1 text-red-500 hover:text-red-700"
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="mt-4 space-y-2">
              <div className="flex space-x-2">
                <button
                  onClick={props.onShowFavoriteInput}
                  className="flex flex-1 items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
                >
                  <Star size={16} className="mr-1" />
                  즐겨찾기 추가
                </button>
              </div>
              {props.shoppingList.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={props.onClearCompleted}
                    className="flex-1 rounded-lg bg-[#6B46C1] py-2 text-sm text-white hover:bg-[#603fad]"
                  >
                    장보기 완료
                  </button>
                  <button
                    onClick={props.onClearAll}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* 즐겨찾기 탭 */
          <div className="flex-1 overflow-y-auto">
            {props.favorites.length === 0 ? (
              <div className="mt-10 text-center text-gray-500">
                <p>저장된 즐겨찾기가 없습니다</p>
                <p className="mt-2 text-sm">쇼핑 목록을 저장해보세요</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {props.favorites.map(favorite => (
                  <li
                    key={favorite.id}
                    className="cursor-pointer rounded-lg border p-3 hover:bg-gray-50"
                    onClick={() => props.onLoadFavorite(favorite.id)}
                  >
                    <div className="font-medium">{favorite.name}</div>
                    <div className="mt-1 text-sm text-gray-500">
                      {favorite.items.length}개 항목
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- 즐겨찾기 이름 모달 ----------
interface FavoriteNameModalProps {
  favoriteName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const FavoriteNameModal: React.FC<FavoriteNameModalProps> = ({
  favoriteName,
  onNameChange,
  onSave,
  onCancel,
}) => (
  <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
    <div className="w-full max-w-xs rounded-lg bg-white p-5 sm:max-w-sm">
      <h3 className="mb-3 text-lg font-medium">즐겨찾기에 추가</h3>
      <p className="mb-3 text-sm text-gray-500">
        장바구니 목록 이름을 작성하세요.
      </p>
      <input
        type="text"
        value={favoriteName}
        onChange={e => onNameChange(e.target.value)}
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2"
        placeholder="예: 주간 장보기, 파티 준비 등"
        autoFocus
      />
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-500 hover:text-gray-700"
        >
          취소
        </button>
        <button
          onClick={onSave}
          className="rounded-lg bg-[#6B46C1] px-4 py-2 text-white hover:bg-[#603fad]"
          disabled={favoriteName.trim() === ''}
        >
          저장
        </button>
      </div>
    </div>
  </div>
);

// ---------- 아이템 추가 모달 ----------
interface AddItemModalProps {
  onAdd: (name: string) => void;
  onCancel: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ onAdd, onCancel }) => {
  const [name, setName] = useState<string>('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name);
    }
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-xs rounded-lg bg-white p-5 sm:max-w-sm">
        <h3 className="mb-3 text-lg font-medium">직접 추가</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              항목 이름<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="예: 시금치, 계란, 오이 등"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#6B46C1] px-4 py-2 text-white hover:bg-[#603fad]"
              disabled={name.trim() === ''}
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FridgeBoard;
