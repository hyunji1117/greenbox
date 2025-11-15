// app/components/PurchaseHistoryFilter.tsx
import React, { useState, useEffect } from 'react';
import { ListFilter } from 'lucide-react';
import Image from 'next/image';
import purchaseStorage, {
  PurchaseHistory,
} from '@/app/lib/storage/PurchaseDataStorage';

// 타입 정의
interface FilteredItem {
  id: string;
  name: string;
  imageUrl: string;
  purchaseCount?: number;
  purchaseDate?: string;
  expiryDate?: string;
  category: string;
}

type SortOption =
  | 'most-purchased'
  | 'least-purchased'
  | 'purchase-date'
  | 'expiry-date';

// 임시 이미지 URL 생성 함수 (실제 구현시 제거하고 실제 이미지 사용)
const getPlaceholderImage = (name: string): string => {
  // 실제 구현시에는 식재료별 이미지 매핑 또는 API 사용
  return `https://via.placeholder.com/96/6B46C1/FFFFFF?text=${encodeURIComponent(name.charAt(0))}`;
};

// 날짜 포맷팅 함수들
const formatExpiryDate = (date: string | undefined): string => {
  if (!date) return '';
  const expiryDate = new Date(date);
  const today = new Date();
  const diffTime = Math.abs(expiryDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '내일';
  if (diffDays <= 7) return `${diffDays}일`;
  return `${Math.ceil(diffDays / 7)}주`;
};

const getExpiryStatusColor = (date: string | undefined): string => {
  if (!date) return 'text-gray-500';
  const expiryDate = new Date(date);
  const today = new Date();
  const diffTime = Math.abs(expiryDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) return 'text-red-600';
  if (diffDays <= 7) return 'text-orange-600';
  return 'text-gray-600';
};

const PurchaseHistoryFilter: React.FC = () => {
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>('most-purchased');
  const [filteredSectionItems, setFilteredSectionItems] = useState<
    FilteredItem[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 정렬 옵션 토글
  const toggleSortOptions = (): void => {
    setShowSortOptions(!showSortOptions);
  };

  // 정렬 옵션 적용
  const applySortOption = (option: SortOption): void => {
    setSortOption(option);
    setShowSortOptions(false);
  };

  // 데이터 로드 및 정렬
  useEffect(() => {
    const loadAndSortData = async (): Promise<void> => {
      setLoading(true);
      try {
        // purchaseStorage 초기화
        await purchaseStorage.init();

        let items: FilteredItem[] = [];

        switch (sortOption) {
          case 'most-purchased': {
            // 가장 많이 구매한 순
            const topItems: PurchaseHistory[] =
              await purchaseStorage.getTopPurchasedItems(10);
            items = topItems.map((item: PurchaseHistory) => ({
              id: `most-${item.itemName}`,
              name: item.itemName,
              imageUrl: getPlaceholderImage(item.itemName),
              purchaseCount: item.purchaseCount,
              category: '전체',
            }));
            break;
          }

          case 'least-purchased': {
            // 가장 적게 구매한 순 - 모든 구매 히스토리에서 추출
            const allItems: PurchaseHistory[] =
              await purchaseStorage.getAllPurchaseHistory();

            // purchaseCount가 적은 순으로 정렬
            const leastPurchased = allItems
              .sort((a, b) => a.purchaseCount - b.purchaseCount)
              .slice(0, 10)
              .map(item => ({
                id: `least-${item.itemName}`,
                name: item.itemName,
                imageUrl: getPlaceholderImage(item.itemName),
                purchaseCount: item.purchaseCount,
                category: '전체',
              }));

            items = leastPurchased;
            break;
          }

          case 'purchase-date': {
            // 최근 구매한 순 - lastPurchaseDate 기준 정렬
            const allItems: PurchaseHistory[] =
              await purchaseStorage.getAllPurchaseHistory();

            const recentItems = allItems
              .sort(
                (a, b) =>
                  new Date(b.lastPurchaseDate).getTime() -
                  new Date(a.lastPurchaseDate).getTime(),
              )
              .slice(0, 10)
              .map(item => ({
                id: `recent-${item.itemName}`,
                name: item.itemName,
                imageUrl: getPlaceholderImage(item.itemName),
                purchaseDate: item.lastPurchaseDate.toString(),
                category: '전체',
              }));

            items = recentItems;
            break;
          }

          case 'expiry-date': {
            // 유효기간 임박 순 (실제 구현시 냉장고 데이터와 연동 필요)
            // 임시로 모의 데이터 생성
            const expiryItems: PurchaseHistory[] =
              await purchaseStorage.getTopPurchasedItems(10);
            items = expiryItems.map((item: PurchaseHistory, index: number) => ({
              id: `expiry-${item.itemName}`,
              name: item.itemName,
              imageUrl: getPlaceholderImage(item.itemName),
              // 임시 유효기간 (실제로는 냉장고 데이터에서 가져와야 함)
              expiryDate: new Date(
                Date.now() + (index + 1) * 24 * 60 * 60 * 1000,
              ).toISOString(),
              category: '전체',
            }));
            break;
          }

          default:
            items = [];
        }

        setFilteredSectionItems(items);
      } catch (error) {
        console.error('Failed to load filtered items:', error);
        setFilteredSectionItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadAndSortData();
  }, [sortOption]);

  // 정렬 옵션에 따른 타이틀
  const getSectionTitle = (): string => {
    switch (sortOption) {
      case 'most-purchased':
        return '가장 많이 구매한 식재료';
      case 'least-purchased':
        return '가장 적게 구매한 식재료';
      case 'purchase-date':
        return '최근에 구매한 식재료';
      case 'expiry-date':
        return '유효기간 임박한 식재료';
      default:
        return '식재료';
    }
  };

  return (
    <div className="mb-4 md:mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">식재료 필터</h2>
        <div className="relative">
          <button
            onClick={toggleSortOptions}
            className="flex items-center space-x-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
            type="button"
          >
            <ListFilter size={16} />
            <span>필터</span>
          </button>
          {showSortOptions && (
            <div className="absolute top-full right-0 z-10 mt-1 w-48 rounded-md border bg-white shadow-md">
              <ul>
                <li>
                  <button
                    onClick={() => applySortOption('most-purchased')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      sortOption === 'most-purchased'
                        ? 'bg-gray-100 font-medium'
                        : ''
                    }`}
                    type="button"
                  >
                    가장 많이 구매한 순
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => applySortOption('least-purchased')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      sortOption === 'least-purchased'
                        ? 'bg-gray-100 font-medium'
                        : ''
                    }`}
                    type="button"
                  >
                    가장 적게 구매한 순
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => applySortOption('purchase-date')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      sortOption === 'purchase-date'
                        ? 'bg-gray-100 font-medium'
                        : ''
                    }`}
                    type="button"
                  >
                    먼저 산 순서 순
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => applySortOption('expiry-date')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      sortOption === 'expiry-date'
                        ? 'bg-gray-100 font-medium'
                        : ''
                    }`}
                    type="button"
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
            {getSectionTitle()}
          </h3>
          <span className="text-xs text-gray-500">전체 카테고리</span>
        </div>

        {loading ? (
          <div className="flex space-x-4 pb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-24 flex-shrink-0">
                <div className="mb-2 h-24 w-24 animate-pulse rounded-lg bg-gray-200"></div>
                <div className="h-3 animate-pulse rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <div
              className="flex space-x-4 pb-2"
              style={{
                minWidth: 'min-content',
              }}
            >
              {filteredSectionItems.length === 0 ? (
                <div className="flex h-24 w-full items-center justify-center text-sm text-gray-500">
                  구매 기록이 없습니다
                </div>
              ) : (
                filteredSectionItems.map((item: FilteredItem) => (
                  <div key={item.id} className="w-24 flex-shrink-0">
                    <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        width={96}
                        height={96}
                      />
                      {(sortOption === 'most-purchased' ||
                        sortOption === 'least-purchased') &&
                        item.purchaseCount !== undefined && (
                          <div className="absolute right-0 bottom-0 rounded-tl-md bg-[#6B46C1] px-1.5 py-0.5 text-xs text-white">
                            {item.purchaseCount}회
                          </div>
                        )}
                      {sortOption === 'expiry-date' && item.expiryDate && (
                        <div
                          className={`absolute right-0 bottom-0 ${getExpiryStatusColor(
                            item.expiryDate,
                          )} rounded-tl-md bg-white px-1.5 py-0.5 text-xs`}
                        >
                          {formatExpiryDate(item.expiryDate)}
                        </div>
                      )}
                    </div>
                    <p className="truncate text-center text-xs font-medium">
                      {item.name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseHistoryFilter;
