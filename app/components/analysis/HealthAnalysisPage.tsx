// app/components/HealthAnalysisPage.tsx
// 냉장고 보드 컴포넌트

// ==========================================
//                  Imports
// ==========================================

// ---------- React 관련 ----------
import React, { useEffect, useState, useCallback, useRef } from 'react';

// ---------- 스토리지 ----------
import purchaseStorage from '@/app/lib/storage/PurchaseDataStorage';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';

// ---------- 컴포넌트 ----------
import PurchaseStats from '@/app/components/fridge/PurchaseStats';
import ExpiryDateSetting from '@/app/components/fridge/ExpiryDateSetting';
import ActionToast from '@/app/components/common/ActionToast';
import SegmentedTabs, { SURFACE } from '@/app/components/common/SegmentedTabs';
import AddItemForm from '@/app/components/grocery-list/AddItemForm';

// ---------- 아이콘 ----------
import {
  Plus,
  ListIcon,
  GridIcon,
  BellIcon,
  InfoIcon,
  ChevronDownIcon,
  // CogIcon,
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

const CATEGORY_TABS = [
  { id: 'vegetables', label: '채소' },
  { id: 'fruits', label: '과일' },
  { id: 'meat', label: '고기' },
  { id: 'seafood', label: '해산물' },
] as const;

const HealthAnalysisPage: React.FC = () => {
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
  // TODO: 즐겨찾기 기능 분리 재점검 시 다시 사용할 예정
  // const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [showFavoriteNameInput, setShowFavoriteNameInput] =
    useState<boolean>(false);
  const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);

  // ---------- 선택 상태 ----------
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [favoriteName, setFavoriteName] = useState<string>('');

  // ---------- 쇼핑 리스트 상태 (localStorage에서 초기화) ----------
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => {
    return shoppingListStorage.loadShoppingList();
  });

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    return shoppingListStorage.loadFavorites();
  });

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
  const showToastNotification = useCallback((message: string): void => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setShowToast(true);
    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  // ---------- 날짜 포매팅 ----------
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

  // ---------- shoppingList 변경시 localStorage 저장 ----------
  useEffect(() => {
    shoppingListStorage.saveShoppingList(shoppingList);
  }, [shoppingList]);

  // ---------- favorites 변경시 localStorage 저장 ----------
  useEffect(() => {
    shoppingListStorage.saveFavorites(favorites);
  }, [favorites]);

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
  // const toggleShoppingList = (): void => {
  //   setShowShoppingList(!showShoppingList);
  //   setShowFavorites(false);
  // };

  const addToShoppingList = useCallback(
    (name: string, quantityToAdd: number = 1): void => {
      if (!name || typeof name !== 'string') {
        console.error('Invalid item name');
        return;
      }

      setShoppingList(prevList => {
        const existing = prevList.find(i => i.name === name);
        if (existing) {
          // 지정된 수량만큼 추가
          const next = prevList.map(i =>
            i.name === name
              ? { ...i, quantity: i.quantity + quantityToAdd }
              : i,
          );
          // 토스트는 state 계산 이후 호출
          showToastNotification(
            `${name}의 수량이 ${quantityToAdd}개 증가했어요!`,
          );
          return next;
        }

        const newItem: ShoppingListItem = {
          id: Date.now(),
          name,
          quantity: quantityToAdd,
          completed: false,
        };
        const next = [...prevList, newItem];
        showToastNotification(
          `쇼핑 리스트에 ${name} ${quantityToAdd}개가 추가되었어요!`,
        );
        return next;
      });
    },
    [showToastNotification],
  );

  // ---------- 디바운스된 클릭 핸들러 ----------
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
      // setShowFavorites(false);
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

  // ==========================================
  //                  렌더링
  // ==========================================

  return (
    <div className="relative flex h-full flex-col p-4 pb-24 sm:p-6 sm:pb-24">
      {/* ---------- 헤더 ---------- */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">AI 건강분석</h1>
      </div>

      {/* ---------- 카테고리 탭 ---------- */}
      <SegmentedTabs
        tabs={CATEGORY_TABS}
        activeId={activeCategory}
        onChange={setActiveCategory}
        className="mb-3"
      />

      {/* ---------- 뷰 모드 선택 ---------- */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          총 {mockItems.filter(item => item.category === activeCategory).length}
          개 식재료
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            aria-label="격자로 보기"
            aria-pressed={viewMode === 'grid'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-[#F1EDFA] text-[#553C9A]' : 'text-gray-500 hover:bg-white'}`}
          >
            <GridIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-label="목록으로 보기"
            aria-pressed={viewMode === 'list'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${viewMode === 'list' ? 'bg-[#F1EDFA] text-[#553C9A]' : 'text-gray-500 hover:bg-white'}`}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {/* ---------- 식재료 리스트 ---------- */}
      <div className="-mx-4 overflow-x-auto px-4 pt-1 pb-4 sm:-mx-6 sm:px-6">
        <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
          {filteredItems.map((item, index) => {
            const listItem = shoppingList.find(
              listItem => listItem.name === item.name,
            );
            const purchaseCount = itemPurchaseCounts.get(item.name) || 0;

            return (
              <div
                key={item.id}
                className={`w-[168px] flex-shrink-0 overflow-hidden ${SURFACE}`}
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
                      <div className="absolute top-2 left-2 rounded-full bg-[#6B46C1] px-2.5 py-1 text-xs font-semibold text-white">
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
                    aria-label={`${item.name} 유통기한 알림 설정`}
                    className="absolute top-1.5 right-1.5 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#6B46C1] shadow-sm"
                  >
                    <BellIcon size={18} />
                  </button>

                  <div className="flex items-center justify-between gap-2 p-3">
                    <h3 className="min-w-0 text-sm font-semibold">
                      {item.name}
                    </h3>
                    <div
                      className={`shrink-0 text-xs font-medium ${getExpiryStatusColor(item.expiryDate)}`}
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
      <div className={`mb-4 p-4 ${SURFACE}`}>
        <h2 className="mb-3 text-base font-semibold">
          식재료 소비 현황 (주간)
        </h2>
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={consumptionData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                strokeWidth={0.5}
              />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="week"
                type="category"
                width={44}
                interval={0}
                tick={{ fontSize: 12 }}
              />
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

      {/* ---------- 모달들 ---------- */}
      {showFavoriteNameInput && (
        <FavoriteNameModal
          favoriteName={favoriteName}
          onNameChange={setFavoriteName}
          onSave={saveAsFavorite}
          onCancel={() => setShowFavoriteNameInput(false)}
        />
      )}

      {/* AddItemForm 사용 */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <AddItemForm
            onClose={() => setShowAddForm(false)}
            onAddToShoppingList={addToShoppingList}
            mode="simple"
          />
        </div>
      )}

      {/* ---------- 토스트 ---------- */}
      <ActionToast isVisible={showToast} message={toastMessage} />
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
  <div className={`mb-4 p-4 ${SURFACE}`}>
    <h2 className="mb-3 text-base font-semibold">건강 분석 및 추천</h2>

    {/* 프로필 선택 드롭다운 */}
    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {/* 성별 드롭다운 */}
      <div className="dropdown-container relative">
        <label className="mb-1 block text-xs font-medium text-gray-500">
          성별
        </label>
        <div
          className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-xl bg-[#F4F4F8] px-3 text-sm text-gray-700 ${!isDropdownEnabled('gender') ? 'cursor-not-allowed opacity-50' : ''}`}
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
          <div
            className={`absolute z-10 mt-1 w-full overflow-hidden ${SURFACE}`}
          >
            <ul>
              <li
                className="cursor-pointer px-4 py-3 text-sm text-gray-400 hover:bg-[#F4F4F8]"
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
                  className={`cursor-pointer px-4 py-3 text-sm hover:bg-[#F4F4F8] ${tempProfile.gender === option ? 'bg-[#F1EDFA] text-[#553C9A]' : ''}`}
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
    <button
      type="button"
      onClick={applyProfileChanges}
      disabled={!hasUnsavedChanges}
      className="mb-4 h-11 w-full rounded-xl bg-[#6B46C1] text-sm font-semibold text-white transition-colors hover:bg-[#603fad] disabled:bg-[#F1EDFA] disabled:text-[#A794D6]"
    >
      적용하기
    </button>

    {/* 건강 통계 카드 */}
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-[#6B46C1] p-4 text-white">
        <h3 className="text-sm font-medium text-white/80">영양소 점수</h3>
        <div className="mt-1 text-5xl font-semibold">
          {healthStats.nutrientScore}%
        </div>
      </div>
      {/* 나머지 통계 카드들... */}
    </div>

    {/* 추천 사항 */}
    <div className="mt-4">
      <h3 className="mb-2 flex items-center text-sm font-semibold">
        <InfoIcon size={16} className="mr-1 text-[#6B46C1]" />
        건강한 식이를 위한 추천
      </h3>
      <ul className="space-y-1 text-sm text-gray-700">
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-lg sm:max-w-sm">
      <h3 className="mb-1 text-base font-semibold">즐겨찾기에 추가</h3>
      <p className="mb-3 text-sm text-gray-500">
        장바구니 목록 이름을 작성하세요.
      </p>
      <input
        type="text"
        value={favoriteName}
        onChange={e => onNameChange(e.target.value)}
        className="mb-4 h-11 w-full rounded-xl bg-[#F4F4F8] px-3 text-base focus:ring-1 focus:ring-[#A794D6] focus:outline-none"
        placeholder="예: 주간 장보기, 파티 준비 등"
        autoFocus
      />
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="h-11 rounded-xl px-4 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          취소
        </button>
        <button
          onClick={onSave}
          className="h-11 rounded-xl bg-[#6B46C1] px-4 text-sm font-semibold text-white hover:bg-[#603fad] disabled:bg-[#F1EDFA] disabled:text-[#A794D6]"
          disabled={favoriteName.trim() === ''}
        >
          저장
        </button>
      </div>
    </div>
  </div>
);

export default HealthAnalysisPage;
