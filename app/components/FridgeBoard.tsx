import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  CogIcon,
  ListFilterIcon,
  InfoIcon,
  ChevronDownIcon,
} from 'lucide-react';
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
import Image from 'next/image';
import Toast from '@/app/components/Toast'; // 경로는 프로젝트 구조에 맞게 조정

// Type definitions
interface FridgeItem {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  expiryDate: Date;
  purchaseCount: number;
  purchaseDate: Date;
}

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

interface ConsumptionData {
  week: string;
  채소: number;
  과일: number;
  고기: number;
  해산물: number;
  기타: number;
}

// Mock data for demonstration
const mockItems: FridgeItem[] = [
  {
    id: 1,
    name: '시금치',
    category: 'vegetables',
    imageUrl:
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    purchaseCount: 12,
    purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    name: '브로콜리',
    category: 'vegetables',
    imageUrl:
      'https://cdn.pixabay.com/photo/2015/03/14/13/59/vegetables-673181_1280.jpg',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    purchaseCount: 8,
    purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    name: '당근',
    category: 'vegetables',
    imageUrl:
      'https://cdn.pixabay.com/photo/2016/08/03/01/09/carrot-1565597_1280.jpg',
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    purchaseCount: 15,
    purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 4,
    name: '사과',
    category: 'fruits',
    imageUrl: '/fruit/fruit_apple.jpg',
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    purchaseCount: 20,
    purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 5,
    name: '바나나',
    category: 'fruits',
    imageUrl: '/fruit/fruit_banana.jpg',
    expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    purchaseCount: 25,
    purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 6,
    name: '닭가슴살',
    category: 'meat',
    imageUrl:
      'https://shop.hansalim.or.kr/shopping/is/itm/060103025/060103025_1_568.jpg',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    purchaseCount: 18,
    purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 7,
    name: '소고기',
    category: 'meat',
    imageUrl:
      'https://cdn.pixabay.com/photo/2016/03/05/19/02/beef-1238262_1280.jpg',
    expiryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    purchaseCount: 10,
    purchaseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: 8,
    name: '연어',
    category: 'seafood',
    imageUrl:
      'https://cdn.pixabay.com/photo/2016/03/05/19/24/salmon-1238248_1280.jpg',
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    purchaseCount: 7,
    purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 9,
    name: '새우',
    category: 'seafood',
    imageUrl:
      'https://cdn.pixabay.com/photo/2015/04/09/13/38/shrimp-715010_1280.jpg',
    expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    purchaseCount: 14,
    purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 10,
    name: '토마토',
    category: 'vegetables',
    imageUrl:
      'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    expiryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    purchaseCount: 16,
    purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 11,
    name: '오렌지',
    category: 'fruits',
    imageUrl: '/fruit/fruit_orange.webp',
    expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    purchaseCount: 22,
    purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

// Mock consumption data
const consumptionData: ConsumptionData[] = [
  {
    week: '1주차',
    채소: 12,
    과일: 19,
    고기: 8,
    해산물: 5,
    기타: 3,
  },
  {
    week: '2주차',
    채소: 15,
    과일: 11,
    고기: 10,
    해산물: 8,
    기타: 2,
  },
  {
    week: '3주차',
    채소: 8,
    과일: 17,
    고기: 12,
    해산물: 6,
    기타: 4,
  },
  {
    week: '4주차',
    채소: 14,
    과일: 13,
    고기: 9,
    해산물: 7,
    기타: 5,
  },
];

// User profile options
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

// Health stats based on profile
const getHealthStats = (profile: UserProfile): HealthStats => {
  const stats: HealthStats = {
    nutrientScore: 83,
    balanceRating: 4.8,
    healthImprovement: 52,
    consumptionEfficiency: 4,
  };

  if (profile.gender === '여성') {
    stats.nutrientScore += 2;
  }
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

const FridgeBoard: React.FC = () => {
  // State management
  const [activeCategory, setActiveCategory] = useState<string>('vegetables');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showShoppingList, setShowShoppingList] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [showFavoriteNameInput, setShowFavoriteNameInput] =
    useState<boolean>(false);
  const [favoriteName, setFavoriteName] = useState<string>('');
  const [showNotificationTooltip, setShowNotificationTooltip] = useState<
    number | null
  >(null);
  const [showSettingsTooltip, setShowSettingsTooltip] =
    useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>('most-purchased');
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);
  const [filteredItems, setFilteredItems] = useState<FridgeItem[]>(mockItems);
  const [filteredSectionItems, setFilteredSectionItems] = useState<
    FridgeItem[]
  >([]);
  const [topPurchasedItems, setTopPurchasedItems] = useState<FridgeItem[]>([]);

  // Toast 관련 state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // User profile state
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

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showAllergyDropdown, setShowAllergyDropdown] =
    useState<boolean>(false);

  // Health stats
  const [healthStats, setHealthStats] = useState<HealthStats>(
    getHealthStats(userProfile),
  );

  // Flag to indicate unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Shopping list state
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);

  // Favorites state
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Toast를 표시하는 함수
  const showToastNotification = useCallback((message: string): void => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToastMessage(message);
    setShowToast(true);

    toastTimerRef.current = setTimeout(() => {
      setShowToast(false);
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Click outside handler
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

  // Toggle dropdown
  const toggleDropdown = (dropdownName: string): void => {
    if (dropdownName === 'allergy') {
      setShowAllergyDropdown(!showAllergyDropdown);
      setActiveDropdown(null);
    } else {
      setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
      setShowAllergyDropdown(false);
    }
  };

  // Check if dropdown should be enabled
  const isDropdownEnabled = (dropdownName: string): boolean => {
    switch (dropdownName) {
      case 'gender':
        return true;
      case 'age':
        return tempProfile.gender !== '-- 선택 --';
      case 'allergy':
        return (
          tempProfile.gender !== '-- 선택 --' &&
          tempProfile.age !== '-- 선택 --'
        );
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

  // Update health stats when profile changes
  useEffect(() => {
    setHealthStats(getHealthStats(userProfile));
  }, [userProfile]);

  // Initialize tempProfile when userProfile changes
  useEffect(() => {
    setTempProfile({
      ...userProfile,
    });
  }, [userProfile]);

  // Update temp profile
  const updateTempProfile = (
    field: keyof UserProfile,
    value: string | string[],
  ): void => {
    setTempProfile(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  // Update temp allergies
  const toggleTempAllergy = (allergy: string): void => {
    setTempProfile(prev => {
      const allergies = prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy];
      return {
        ...prev,
        allergies,
      };
    });
    setHasUnsavedChanges(true);
  };

  // Apply changes to profile and update health stats
  const applyProfileChanges = (): void => {
    setUserProfile({
      ...tempProfile,
    });
    setHealthStats(getHealthStats(tempProfile));
    setHasUnsavedChanges(false);
  };

  // Filter items based on active category only (for main grid)
  useEffect(() => {
    const items = mockItems.filter(item => item.category === activeCategory);
    setFilteredItems(items);
  }, [activeCategory]);

  // Filter items for the filter section based on sort option
  useEffect(() => {
    let items = [...mockItems];
    switch (sortOption) {
      case 'most-purchased':
        items = items.sort((a, b) => b.purchaseCount - a.purchaseCount);
        break;
      case 'least-purchased':
        items = items.sort((a, b) => a.purchaseCount - b.purchaseCount);
        break;
      case 'purchase-date':
        items = items.sort(
          (a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime(),
        );
        break;
      case 'expiry-date':
        items = items.sort(
          (a, b) => a.expiryDate.getTime() - b.expiryDate.getTime(),
        );
        break;
    }
    setFilteredSectionItems(items.slice(0, 6));
  }, [sortOption]);

  // Get most purchased items across all categories
  useEffect(() => {
    const allItemsSorted = [...mockItems].sort(
      (a, b) => b.purchaseCount - a.purchaseCount,
    );
    setTopPurchasedItems(allItemsSorted.slice(0, 6));
  }, []);

  // Toggle shopping list panel
  const toggleShoppingList = (): void => {
    setShowShoppingList(!showShoppingList);
    setShowFavorites(false);
  };

  // Add item to shopping list (타입 체크 포함)
  const addToShoppingList = (name: string): void => {
    if (!name || typeof name !== 'string') {
      console.error('Invalid item name');
      return;
    }

    const existingItem: ShoppingListItem | undefined = shoppingList.find(
      (item: ShoppingListItem) => item.name === name,
    );

    if (existingItem) {
      setShoppingList((prevList: ShoppingListItem[]) =>
        prevList.map((item: ShoppingListItem) =>
          item.name === name
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        ),
      );
      showToastNotification(`${name}의 수량이 증가했어요!`);
    } else {
      const newItem: ShoppingListItem = {
        id: Date.now(),
        name,
        quantity: 1,
        completed: false,
      };

      setShoppingList((prevList: ShoppingListItem[]) => [...prevList, newItem]);
      showToastNotification('쇼핑 리스트에 식재료가 추가되었어요!');
    }
  };

  // Toggle item completion status
  const toggleItemCompletion = (id: number): void => {
    if (typeof id !== 'number') {
      console.error('Invalid item ID');
      return;
    }

    const item: ShoppingListItem | undefined = shoppingList.find(
      (item: ShoppingListItem) => item.id === id,
    );

    setShoppingList((prevList: ShoppingListItem[]) =>
      prevList.map((item: ShoppingListItem) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
            }
          : item,
      ),
    );

    if (item) {
      const message: string = !item.completed
        ? `'${item.name}'이(가) 완료되었어요`
        : `'${item.name}'이(가) 완료 해제되었어요`;
      showToastNotification(message);
    }
  };

  // Update item quantity
  const updateItemQuantity = (id: number, change: number): void => {
    if (typeof id !== 'number' || typeof change !== 'number') {
      console.error('Invalid parameters');
      return;
    }

    setShoppingList((prevList: ShoppingListItem[]) =>
      prevList.map((item: ShoppingListItem) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, item.quantity + change),
            }
          : item,
      ),
    );
  };

  // Delete item from shopping list
  const deleteItem = (id: number): void => {
    if (typeof id !== 'number') {
      console.error('Invalid item ID');
      return;
    }

    const itemToDelete: ShoppingListItem | undefined = shoppingList.find(
      (item: ShoppingListItem) => item.id === id,
    );

    if (!itemToDelete) {
      console.warn('Item not found');
      return;
    }

    setShoppingList((prevList: ShoppingListItem[]) =>
      prevList.filter((item: ShoppingListItem) => item.id !== id),
    );
    showToastNotification(`'${itemToDelete.name}'이(가) 삭제되었어요`);
  };

  // Clear completed items
  const clearCompletedItems = (): void => {
    const completedItems: ShoppingListItem[] = shoppingList.filter(
      (item: ShoppingListItem) => item.completed,
    );
    const completedCount: number = completedItems.length;

    if (completedCount === 0) {
      showToastNotification('완료된 항목이 없습니다');
      return;
    }

    setShoppingList((prevList: ShoppingListItem[]) =>
      prevList.filter((item: ShoppingListItem) => !item.completed),
    );
    showToastNotification(`${completedCount}개 항목이 완료되었어요!`);
  };

  // Clear all items
  const clearAllItems = (): void => {
    const itemCount: number = shoppingList.length;

    if (itemCount === 0) {
      showToastNotification('삭제할 항목이 없습니다');
      return;
    }

    setShoppingList([]);
    showToastNotification(`${itemCount}개 항목이 모두 삭제되었어요!`);
  };

  // Save shopping list as favorite
  const saveAsFavorite = (): void => {
    const trimmedName: string = favoriteName.trim();

    if (!trimmedName) {
      console.warn('Favorite name is empty');
      return;
    }

    const newFavorite: FavoriteItem = {
      id: Date.now(),
      name: trimmedName,
      items: shoppingList.map(({ id, name, quantity }) => ({
        id,
        name,
        quantity,
      })),
    };

    setFavorites((prevFavorites: FavoriteItem[]) => [
      ...prevFavorites,
      newFavorite,
    ]);
    setFavoriteName('');
    setShowFavoriteNameInput(false);
    showToastNotification(`'${trimmedName}' 즐겨찾기가 저장되었어요!`);
  };

  // Load favorite list
  const loadFavorite = (favoriteId: number): void => {
    if (typeof favoriteId !== 'number') {
      console.error('Invalid favorite ID');
      return;
    }

    const favorite: FavoriteItem | undefined = favorites.find(
      (fav: FavoriteItem) => fav.id === favoriteId,
    );

    if (favorite) {
      const newShoppingList: ShoppingListItem[] = favorite.items.map(
        (item): ShoppingListItem => ({
          ...item,
          completed: false,
        }),
      );

      setShoppingList(newShoppingList);
      setShowFavorites(false);
      showToastNotification(`'${favorite.name}' 목록을 불러왔어요!`);
    }
  };

  // Handle direct add
  const handleDirectAdd = (): void => {
    setShowAddForm(true);
  };

  // Add direct item
  const addDirectItem = (name: string): void => {
    if (!name || typeof name !== 'string') {
      console.error('Invalid item name');
      return;
    }

    addToShoppingList(name);
    setShowAddForm(false);
  };

  // Toggle notification tooltip
  const toggleNotificationTooltip = (itemId: number | null): void => {
    setShowNotificationTooltip(
      itemId === showNotificationTooltip ? null : itemId,
    );
  };

  // Toggle sort options
  const toggleSortOptions = (): void => {
    setShowSortOptions(!showSortOptions);
  };

  // Apply sort option
  const applySortOption = (option: string): void => {
    setSortOption(option);
    setShowSortOptions(false);
  };

  // Format expiry date
  const formatExpiryDate = (date: Date): string => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays}일 남음` : '오늘 만료';
  };

  // Get notification color based on expiry date
  const getExpiryStatusColor = (expiryDate: Date): string => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return 'text-red-500';
    if (diffDays <= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Get dietary recommendations
  const getDietaryRecommendations = (): string[] => {
    const { gender, age, allergies, activityLevel, sleepTime } = userProfile;
    const recommendations: string[] = [];

    if (activityLevel === '높음') {
      recommendations.push('단백질이 풍부한 고기와 생선을 충분히 섭취하세요.');
    } else if (activityLevel === '낮음') {
      recommendations.push('가벼운 채소와 과일 위주의 식단을 유지하세요.');
    }

    if (sleepTime === '6시간 미만') {
      recommendations.push(
        '수면에 도움이 되는 바나나, 체리, 키위 등의 과일을 저녁에 섭취해보세요.',
      );
    }

    if (age === '50대 이상') {
      recommendations.push(
        '칼슘이 풍부한 식품과 항산화 성분이 풍부한 과일을 섭취하세요.',
      );
    }

    if (allergies.includes('견과류')) {
      recommendations.push(
        '견과류 대신 아보카도, 올리브 오일 등으로 건강한 지방을 섭취하세요.',
      );
    }

    if (allergies.includes('갑각류')) {
      recommendations.push(
        '갑각류 대신 두부, 콩류 등의 식물성 단백질을 섭취하세요.',
      );
    }

    return recommendations.length > 0
      ? recommendations
      : ['균형 잡힌 식단을 유지하고 신선한 채소와 과일을 충분히 섭취하세요.'];
  };

  return (
    <div className="relative flex h-full flex-col bg-white p-0 md:p-0">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-xl font-semibold">우리집 냉장고</h1>
        <div className="flex items-center space-x-2">
          <button
            onMouseEnter={() => setShowSettingsTooltip(true)}
            onMouseLeave={() => setShowSettingsTooltip(false)}
            className="relative rounded-full bg-gray-100 p-2 hover:bg-gray-200"
          >
            <CogIcon size={18} />
            {showSettingsTooltip && (
              <div className="absolute top-full right-0 z-10 mt-1 w-64 rounded-md border bg-white p-2 text-xs shadow-md">
                알림 설정, 유효기간 설정 등 자세한 설정은 여기서 확인하실 수
                있습니다.
              </div>
            )}
          </button>
          <button
            onClick={toggleShoppingList}
            className="flex items-center space-x-1 rounded-xl bg-[#6B46C1] py-1 pr-3 pl-2 text-sm text-white shadow-sm transition-colors hover:bg-[#603fad]"
          >
            <Plus size={18} />
            <span>쇼핑 리스트</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="mt-3 text-sm text-gray-500">
          총 {mockItems.filter(item => item.category === activeCategory).length}
          개 아이템
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-xl p-1.5 ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <GridIcon size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-xl p-1.5 ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <ListIcon size={18} />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mt-4 mb-4 flex overflow-x-auto pb-1">
        <div className="flex min-w-full space-x-2">
          <button
            onClick={() => setActiveCategory('vegetables')}
            className={`flex min-h-[40px] min-w-[80px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm ${activeCategory === 'vegetables' ? 'border border-green-300 bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <span className="text-sm">채소</span>
          </button>
          <button
            onClick={() => setActiveCategory('fruits')}
            className={`flex min-h-[40px] min-w-[80px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm ${activeCategory === 'fruits' ? 'border border-red-300 bg-red-100 text-red-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <span className="text-sm">과일</span>
          </button>
          <button
            onClick={() => setActiveCategory('meat')}
            className={`flex min-h-[40px] min-w-[80px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm ${activeCategory === 'meat' ? 'border border-orange-300 bg-orange-100 text-orange-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <span className="text-sm">고기</span>
          </button>
          <button
            onClick={() => setActiveCategory('seafood')}
            className={`flex min-h-[40px] min-w-[80px] flex-1 items-center justify-center space-x-1 rounded-xl shadow-sm ${activeCategory === 'seafood' ? 'border border-blue-300 bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <span className="text-sm">해산물</span>
          </button>
        </div>
      </div>

      {/* 식재료 리스트 스크롤 (데스크탑) */}
      <div
        className={`hidden md:grid ${viewMode === 'grid' ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}
      >
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="relative h-32">
              <Image
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover"
                width={400}
                height={200}
              />
              <div
                className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-medium ${getExpiryStatusColor(item.expiryDate)} bg-opacity-90 bg-white`}
              >
                {formatExpiryDate(item.expiryDate)}
              </div>
            </div>
            <div className="flex items-center justify-between p-3">
              <h3 className="text-sm font-medium">{item.name}</h3>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => addToShoppingList(item.name)}
                  className="p-1 text-[#6B46C1] hover:text-[#603fad]"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => toggleNotificationTooltip(item.id)}
                  className="relative p-1 text-[#6B46C1] hover:text-[#603fad]"
                >
                  <BellIcon size={18} />
                  {showNotificationTooltip === item.id && (
                    <div className="absolute right-0 bottom-full z-10 mb-1 w-64 rounded-md border bg-white p-2 text-xs shadow-md">
                      <p className="mb-1 font-medium">유효기간 알림 설정</p>
                      <p>이 식재료의 유효기간 만료 전에 알림을 받습니다:</p>
                      <ul className="mt-1 space-y-1">
                        <li className="flex items-center">
                          <Check size={12} className="mr-1 text-green-500" />
                          유효기간 80% 전 알림
                        </li>
                        <li className="flex items-center">
                          <Check size={12} className="mr-1 text-green-500" />
                          유효기간 40% 전 알림
                        </li>
                      </ul>
                      <p className="mt-2 text-gray-500">
                        자세한 설정은 설정 아이콘을 클릭하세요
                      </p>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 식재료 리스트 스크롤 (모바일) */}
      <div className="overflow-x-auto pb-4 md:hidden">
        <div
          className="flex space-x-4"
          style={{
            minWidth: 'min-content',
          }}
        >
          {filteredItems.map(item => {
            const isInList = shoppingList.some(
              listItem => listItem.name === item.name,
            );

            return (
              <div
                key={item.id}
                className={`w-[180px] flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-shadow hover:shadow-md ${
                  isInList ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => !isInList && addToShoppingList(item.name)}
              >
                <div className="relative h-32">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    width={180}
                    height={128}
                  />
                  {/* 검은색 오버레이 */}
                  {isInList && <div className="absolute inset-0 bg-black/50" />}
                  <div
                    className={`absolute top-2 right-2 rounded-full px-2 py-1 text-xs font-medium ${getExpiryStatusColor(item.expiryDate)} bg-opacity-90 bg-white`}
                  >
                    {formatExpiryDate(item.expiryDate)}
                  </div>
                  {/* 체크 아이콘 표시 */}
                  {isInList && (
                    <div className="absolute top-2 left-2 rounded-full bg-green-400 p-1">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-3">
                  <h3 className={'text-sm font-medium'}>{item.name}</h3>
                  <div className="flex items-center space-x-1">
                    <div
                      className={`p-1 ${isInList ? 'text-green-400' : 'text-[#6B46C1]'}`}
                    >
                      {isInList ? <Check size={18} /> : <Plus size={18} />}
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleNotificationTooltip(item.id);
                      }}
                      className="relative p-1 text-[#6B46C1] hover:text-[#603fad]"
                    >
                      <BellIcon size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-4 md:mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">식재료 필터</h2>
          <div className="relative">
            <button
              onClick={toggleSortOptions}
              className="flex items-center space-x-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
            >
              <ListFilterIcon size={16} />
              <span>필터</span>
            </button>
            {showSortOptions && (
              <div className="absolute top-full right-0 z-10 mt-1 w-48 rounded-md border bg-white shadow-md">
                <ul>
                  <li>
                    <button
                      onClick={() => applySortOption('most-purchased')}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${sortOption === 'most-purchased' ? 'bg-gray-100 font-medium' : ''}`}
                    >
                      가장 많이 구매한 순
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => applySortOption('least-purchased')}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${sortOption === 'least-purchased' ? 'bg-gray-100 font-medium' : ''}`}
                    >
                      가장 적게 구매한 순
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => applySortOption('purchase-date')}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${sortOption === 'purchase-date' ? 'bg-gray-100 font-medium' : ''}`}
                    >
                      먼저 산 순서 순
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => applySortOption('expiry-date')}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${sortOption === 'expiry-date' ? 'bg-gray-100 font-medium' : ''}`}
                    >
                      유효기간 만료 순
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Filtered Items Board */}
        <div className="mb-2 rounded-xl border border-gray-200 bg-gray-50 px-4 pt-4 pb-1 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              {sortOption === 'most-purchased' && '가장 많이 구매한 식재료'}
              {sortOption === 'least-purchased' && '가장 적게 구매한 식재료'}
              {sortOption === 'purchase-date' && '최근에 구매한 식재료'}
              {sortOption === 'expiry-date' && '유효기간 임박한 식재료'}
            </h3>
            <span className="text-xs text-gray-500">전체 카테고리</span>
          </div>
          <div className="-mx-4 overflow-x-auto px-4">
            <div
              className="flex space-x-4 pb-2"
              style={{
                minWidth: 'min-content',
              }}
            >
              {filteredSectionItems.map(item => (
                <div key={item.id} className="w-24 flex-shrink-0">
                  <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      width={96}
                      height={96}
                    />
                    {sortOption === 'most-purchased' && (
                      <div className="absolute right-0 bottom-0 rounded-tl-md bg-[#6B46C1] px-1.5 py-0.5 text-xs text-white">
                        {item.purchaseCount}회
                      </div>
                    )}
                    {sortOption === 'expiry-date' && (
                      <div
                        className={`absolute right-0 bottom-0 ${getExpiryStatusColor(item.expiryDate)} rounded-tl-md bg-white px-1.5 py-0.5 text-xs`}
                      >
                        {formatExpiryDate(item.expiryDate)}
                      </div>
                    )}
                  </div>
                  <p className="truncate text-center text-xs font-medium">
                    {item.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Consumption Statistics */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm md:mb-8 md:p-4">
        <h2 className="mb-3 text-lg font-semibold md:mb-4">
          식재료 소비 현황 (주간)
        </h2>
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={consumptionData}
              layout="vertical"
              margin={{
                top: 10,
                right: 10,
                left: 40,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                strokeWidth={0.5}
              />
              <XAxis type="number" />
              <YAxis dataKey="week" type="category" width={40} />
              <Tooltip />
              <Legend
                wrapperStyle={{
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="채소" stackId="a" fill="#9C6ADE" />
              <Bar dataKey="과일" stackId="a" fill="#B47EFF" />
              <Bar dataKey="고기" stackId="a" fill="#8452D8" />
              <Bar dataKey="해산물" stackId="a" fill="#6B46C1" />
              <Bar dataKey="기타" stackId="a" fill="#D2B8FF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Health Analysis */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm md:p-4">
        <h2 className="mb-3 text-lg font-semibold md:mb-4">
          건강 분석 및 추천
        </h2>

        {/* Profile Selection Dropdowns */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mb-6 md:grid-cols-3 md:gap-4">
          {/* Gender Dropdown */}
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
                    className={`cursor-pointer rounded-t-xl px-4 py-3 text-gray-400 hover:bg-gray-100`}
                    onClick={() => {
                      updateTempProfile('gender', '-- 선택 --');
                      setActiveDropdown(null);
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
                        setActiveDropdown(null);
                      }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Age Dropdown */}
          <div className="dropdown-container relative">
            <label className="mb-1 block text-sm font-medium text-gray-600">
              연령대
            </label>
            <div
              className={`flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-2 shadow-sm ${!isDropdownEnabled('age') ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={() => isDropdownEnabled('age') && toggleDropdown('age')}
            >
              <span
                className={
                  tempProfile.age === '-- 선택 --' ? 'text-gray-400' : ''
                }
              >
                {tempProfile.age}
              </span>
              <ChevronDownIcon size={16} />
            </div>
            {activeDropdown === 'age' && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-300 bg-white shadow-lg">
                <ul>
                  <li
                    className={`cursor-pointer rounded-t-xl px-4 py-2 text-gray-400 hover:bg-gray-100`}
                    onClick={() => {
                      updateTempProfile('age', '-- 선택 --');
                      setActiveDropdown(null);
                    }}
                  >
                    -- 선택 --
                  </li>
                  {ageOptions.map(option => (
                    <li
                      key={option}
                      className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${tempProfile.age === option ? 'bg-purple-50 text-purple-700' : ''}`}
                      onClick={() => {
                        updateTempProfile('age', option);
                        setActiveDropdown(null);
                      }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Allergies Dropdown */}
          <div className="dropdown-container relative">
            <label className="mb-1 block text-sm font-medium text-gray-600">
              알레르기
            </label>
            <div
              className={`flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-2 shadow-sm ${!isDropdownEnabled('allergy') ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={() =>
                isDropdownEnabled('allergy') && toggleDropdown('allergy')
              }
            >
              <span>
                {tempProfile.allergies.length > 0
                  ? tempProfile.allergies.join(', ')
                  : '없음'}
              </span>
              <ChevronDownIcon size={16} />
            </div>
            {showAllergyDropdown && isDropdownEnabled('allergy') && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-300 bg-white shadow-lg">
                <ul>
                  {allergyOptions.map(option => (
                    <li
                      key={option}
                      className={`flex cursor-pointer items-center rounded-xl px-4 py-2 hover:bg-gray-100`}
                      onClick={() => {
                        if (option === '없음') {
                          updateTempProfile('allergies', []);
                        } else {
                          toggleTempAllergy(option);
                        }
                      }}
                    >
                      <div
                        className={`mr-2 flex h-4 w-4 items-center justify-center rounded border ${tempProfile.allergies.includes(option) ? 'border-purple-600 bg-purple-600' : 'border-gray-400'}`}
                      >
                        {tempProfile.allergies.includes(option) && (
                          <Check size={12} color="white" />
                        )}
                      </div>
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Activity Level Dropdown */}
          <div className="dropdown-container relative">
            <label className="mb-1 block text-sm font-medium text-gray-600">
              활동량
            </label>
            <div
              className={`flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-2 shadow-sm ${!isDropdownEnabled('activity') ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={() =>
                isDropdownEnabled('activity') && toggleDropdown('activity')
              }
            >
              <span
                className={
                  tempProfile.activityLevel === '-- 선택 --'
                    ? 'text-gray-400'
                    : ''
                }
              >
                {tempProfile.activityLevel}
              </span>
              <ChevronDownIcon size={16} />
            </div>
            {activeDropdown === 'activity' && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-300 bg-white shadow-lg">
                <ul>
                  <li
                    className={`cursor-pointer rounded-t-xl px-4 py-2 text-gray-400 hover:bg-gray-100`}
                    onClick={() => {
                      updateTempProfile('activityLevel', '-- 선택 --');
                      setActiveDropdown(null);
                    }}
                  >
                    -- 선택 --
                  </li>
                  {activityOptions.map(option => (
                    <li
                      key={option}
                      className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${tempProfile.activityLevel === option ? 'bg-purple-50 text-purple-700' : ''}`}
                      onClick={() => {
                        updateTempProfile('activityLevel', option);
                        setActiveDropdown(null);
                      }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sleep Time Dropdown */}
          <div className="dropdown-container relative">
            <label className="mb-1 block text-sm font-medium text-gray-600">
              수면시간
            </label>
            <div
              className={`flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-2 shadow-sm ${!isDropdownEnabled('sleep') ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={() =>
                isDropdownEnabled('sleep') && toggleDropdown('sleep')
              }
            >
              <span
                className={
                  tempProfile.sleepTime === '-- 선택 --' ? 'text-gray-400' : ''
                }
              >
                {tempProfile.sleepTime}
              </span>
              <ChevronDownIcon size={16} />
            </div>
            {activeDropdown === 'sleep' && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-300 bg-white shadow-lg">
                <ul>
                  <li
                    className={`cursor-pointer rounded-t-xl px-4 py-2 text-gray-400 hover:bg-gray-100`}
                    onClick={() => {
                      updateTempProfile('sleepTime', '-- 선택 --');
                      setActiveDropdown(null);
                    }}
                  >
                    -- 선택 --
                  </li>
                  {sleepOptions.map(option => (
                    <li
                      key={option}
                      className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${tempProfile.sleepTime === option ? 'bg-purple-50 text-purple-700' : ''}`}
                      onClick={() => {
                        updateTempProfile('sleepTime', option);
                        setActiveDropdown(null);
                      }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Apply Button */}
        <div className="mb-4 flex justify-end md:mb-6">
          <button
            onClick={applyProfileChanges}
            className={`rounded-xl px-3 py-2 text-white shadow-sm transition-colors ${hasUnsavedChanges ? 'bg-[#6B46C1] shadow-md hover:bg-[#603fad]' : 'cursor-not-allowed bg-gray-400'}`}
            disabled={!hasUnsavedChanges}
          >
            적용하기
          </button>
        </div>

        {/* Health Stats Cards */}
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
          <div className="rounded-xl bg-[#F8A5A5] p-4 text-gray-900 shadow-sm md:p-5">
            <div className="flex items-center justify-between">
              <h3 className="rounded-2xl border border-[#28272c] px-3.5 py-1 text-sm font-medium">
                균형 점수
              </h3>
              <button className="bg-opacity-20 rounded-full bg-white p-1">
                <ChevronDownIcon size={16} />
              </button>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-gray-900">
                <div className="text-5xl font-light">
                  {healthStats.balanceRating}
                  <span className="text-2xl text-[#28272c]">*</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-[#64DBAE] p-4 text-gray-900 shadow-sm md:p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="rounded-2xl border border-[#28272c] px-3.5 py-1 text-sm font-medium">
                건강 개선도
              </h3>
              <button className="bg-opacity-20 rounded-full bg-white p-1">
                <ChevronDownIcon size={16} />
              </button>
            </div>
            <div className="mb-2 text-7xl font-extralight md:text-6xl">
              {healthStats.healthImprovement}%
            </div>
          </div>
          <div className="rounded-xl bg-[#DBD7D1] p-4 text-gray-900 shadow-sm md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="rounded-2xl border border-[#28272c] px-3.5 py-1 text-sm font-medium">
                소비 효율성
              </h3>
              <button className="bg-opacity-5 rounded-full bg-white p-1 text-[#121212]">
                <ChevronDownIcon size={16} />
              </button>
            </div>
            <div className="mb-4 text-5xl font-light md:text-6xl">
              {healthStats.consumptionEfficiency}X
            </div>
            <div className="flex justify-end">
              <div className="flex space-x-1">
                <div className="h-18 w-4 bg-gray-900"></div>
                <div className="h-14 w-4 bg-gray-700"></div>
                <div className="h-10 w-4 bg-gray-500"></div>
                <div className="h-6 w-4 bg-gray-300"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
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

      {/* Shopping List Side Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full transform bg-white shadow-xl transition-transform duration-300 ease-in-out sm:w-80 ${showShoppingList ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full flex-col p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">쇼핑 리스트</h2>
            <button
              onClick={toggleShoppingList}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <XIcon size={24} />
            </button>
          </div>

          {/* Tab navigation */}
          <div className="mb-4 flex border-b">
            <button
              onClick={() => setShowFavorites(false)}
              className={`px-4 py-2 ${!showFavorites ? 'border-b-2 border-[#6B46C1] text-[#6B46C1]' : 'text-gray-500'}`}
            >
              쇼핑 목록
            </button>
            <button
              onClick={() => setShowFavorites(true)}
              className={`flex items-center px-4 py-2 ${showFavorites ? 'border-b-2 border-[#6B46C1] text-[#6B46C1]' : 'text-gray-500'}`}
            >
              <Star size={16} className="mr-1" />
              즐겨찾기
            </button>
          </div>

          {!showFavorites ? (
            <>
              {/* Shopping list */}
              <div className="flex-1 overflow-y-auto">
                {shoppingList.length === 0 ? (
                  <div className="mt-10 text-center text-gray-500">
                    <p>쇼핑 목록이 비어 있습니다</p>
                    <p className="mt-2 text-sm">식재료를 추가해보세요</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {shoppingList.map(item => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between border-b p-2"
                      >
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleItemCompletion(item.id)}
                            className={`mr-2 rounded-full border ${item.completed ? 'border-[#6B46C1] bg-[#6B46C1]' : 'border-gray-300'} p-1`}
                          >
                            {item.completed && (
                              <Check size={12} color="white" />
                            )}
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
                            onClick={() => updateItemQuantity(item.id, -1)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                            disabled={item.quantity <= 1}
                          >
                            <MinusIcon size={14} />
                          </button>
                          <span className="mx-2 w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItemQuantity(item.id, 1)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                          >
                            <PlusIcon size={14} />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
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

              {/* Action buttons */}
              <div className="mt-4 space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={handleDirectAdd}
                    className="flex flex-1 items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
                  >
                    <SquarePlus size={16} className="mr-1" />
                    직접 추가
                  </button>
                  <button
                    onClick={() => setShowFavoriteNameInput(true)}
                    className="flex flex-1 items-center justify-center rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
                  >
                    <Star size={16} className="mr-1" />
                    즐겨찾기 추가
                  </button>
                </div>
                {shoppingList.length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={clearCompletedItems}
                      className="flex-1 rounded-lg bg-[#6B46C1] py-2 text-sm text-white hover:bg-[#603fad]"
                    >
                      장보기 완료
                    </button>
                    <button
                      onClick={clearAllItems}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Favorites tab
            <div className="flex-1 overflow-y-auto">
              {favorites.length === 0 ? (
                <div className="mt-10 text-center text-gray-500">
                  <p>저장된 즐겨찾기가 없습니다</p>
                  <p className="mt-2 text-sm">쇼핑 목록을 저장해보세요</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {favorites.map(favorite => (
                    <li
                      key={favorite.id}
                      className="cursor-pointer rounded-lg border p-3 hover:bg-gray-50"
                      onClick={() => loadFavorite(favorite.id)}
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

      {/* Favorite Name Input Modal */}
      {showFavoriteNameInput && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-xs rounded-lg bg-white p-5 sm:max-w-sm">
            <h3 className="mb-3 text-lg font-medium">즐겨찾기에 추가</h3>
            <p className="mb-3 text-sm text-gray-500">
              장바구니 목록 이름을 작성하세요.
            </p>
            <input
              type="text"
              value={favoriteName}
              onChange={e => setFavoriteName(e.target.value)}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="예: 주간 장보기, 파티 준비 등"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFavoriteNameInput(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                취소
              </button>
              <button
                onClick={saveAsFavorite}
                className="rounded-lg bg-[#6B46C1] px-4 py-2 text-white hover:bg-[#603fad]"
                disabled={favoriteName.trim() === ''}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Form Modal */}
      {showAddForm && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-xs rounded-lg bg-white p-5 sm:max-w-sm">
            <h3 className="mb-3 text-lg font-medium">직접 추가</h3>
            <AddItemForm
              onAdd={addDirectItem}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
      <Toast message={toastMessage} isVisible={showToast} />
    </div>
  );
};

// AddItemForm Component
interface AddItemFormProps {
  onAdd: (name: string) => void;
  onCancel: () => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAdd, onCancel }) => {
  const [name, setName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name);
    }
  };

  const handleQuantityChange = (change: number): void => {
    setQuantity(Math.max(1, quantity + change));
  };

  return (
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
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          수량
        </label>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 shadow-sm"
            disabled={quantity <= 1}
          >
            <MinusIcon size={16} />
          </button>
          <span className="mx-3 w-8 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 shadow-sm"
          >
            <PlusIcon size={16} />
          </button>
        </div>
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
  );
};

export default FridgeBoard;
