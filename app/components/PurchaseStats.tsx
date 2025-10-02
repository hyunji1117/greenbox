// app/components/PurchaseStats.tsx
import React, { useEffect, useState } from 'react';
import purchaseStorage from '@/app/lib/storage/PurchaseDataStorage';
import { TrendingUp, ListFilterIcon, ChevronDownIcon } from 'lucide-react';
import Image from 'next/image';
// mockData 파일에서 itemImageMap import
import { itemImageMap } from '@/app/data/mockItems';

interface TopItem {
  itemName: string;
  purchaseCount: number;
  lastPurchaseDate?: Date;
  firstPurchaseDate?: Date;
  imageUrl?: string;
}

interface PurchaseHistory {
  itemName: string;
  purchaseCount: number;
  lastPurchaseDate: Date;
  firstPurchaseDate: Date;
}

// 기존의 하드코딩된 itemImageMap 제거
// const itemImageMap: { [key: string]: string } = { ... } 삭제

const PurchaseStats: React.FC = () => {
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortOption, setSortOption] = useState<string>('most-purchased');
  const [allPurchaseHistory, setAllPurchaseHistory] = useState<
    PurchaseHistory[]
  >([]);

  // 전체 구매 이력 로드
  useEffect(() => {
    const loadAllHistory = async () => {
      try {
        const history = await purchaseStorage.getAllPurchaseHistory();
        setAllPurchaseHistory(history);
      } catch (error) {
        console.error('Failed to load all purchase history:', error);
      }
    };
    loadAllHistory();
  }, []);

  // TOP 5 아이템 로드
  useEffect(() => {
    const loadStats = async () => {
      try {
        const items = await purchaseStorage.getTopPurchasedItems(5);
        setTopItems(items);
      } catch (error) {
        console.error('Failed to load purchase stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  // 필터에 따른 아이템 정렬
  useEffect(() => {
    let items = [...allPurchaseHistory];

    switch (sortOption) {
      case 'most-purchased':
        items = items.sort((a, b) => b.purchaseCount - a.purchaseCount);
        break;
      case 'least-purchased':
        items = items.sort((a, b) => a.purchaseCount - b.purchaseCount);
        break;
      case 'first-purchase':
        items = items.sort(
          (a, b) =>
            new Date(a.firstPurchaseDate).getTime() -
            new Date(b.firstPurchaseDate).getTime(),
        );
        break;
      case 'recent-purchase':
        items = items.sort(
          (a, b) =>
            new Date(b.lastPurchaseDate).getTime() -
            new Date(a.lastPurchaseDate).getTime(),
        );
        break;
    }

    setFilteredItems(items.slice(0, 6));
  }, [sortOption, allPurchaseHistory]);

  // 정렬 옵션 토글
  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
  };

  // 정렬 옵션 적용
  const applySortOption = (option: string) => {
    setSortOption(option);
    setShowSortOptions(false);
  };

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}달 전`;
  };

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-gray-200"></div>;
  }

  return (
    <>
      {/* TOP 5 섹션 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <h2 className="mb-3 flex items-center text-lg font-semibold">
          <TrendingUp size={20} className="mr-2 text-purple-600" />
          자주 구매하는 식재료 TOP 5
        </h2>
        {topItems.length === 0 ? (
          <p className="text-sm text-gray-500">아직 구매 기록이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {topItems.map((item, index) => (
              <div
                key={item.itemName}
                className="flex items-center justify-between rounded-lg bg-white p-2"
              >
                <div className="flex items-center">
                  <span className="mr-3 text-lg font-bold text-purple-600">
                    {index + 1}
                  </span>
                  <span className="font-medium">{item.itemName}</span>
                </div>
                <div className="text-sm text-gray-600">
                  구매 {item.purchaseCount}회
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 필터 섹션 */}
      {allPurchaseHistory.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">구매 이력 필터</h2>
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
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                          sortOption === 'most-purchased'
                            ? 'bg-gray-100 font-medium'
                            : ''
                        }`}
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
                      >
                        가장 적게 구매한 순
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => applySortOption('first-purchase')}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                          sortOption === 'first-purchase'
                            ? 'bg-gray-100 font-medium'
                            : ''
                        }`}
                      >
                        처음 구매한 순
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => applySortOption('recent-purchase')}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                          sortOption === 'recent-purchase'
                            ? 'bg-gray-100 font-medium'
                            : ''
                        }`}
                      >
                        최근 구매한 순
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 필터링된 아이템 보드 */}
          <div className="mb-2 rounded-xl border border-gray-200 bg-gray-50 px-4 pt-4 pb-1 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                {sortOption === 'most-purchased' && '가장 많이 구매한 식재료'}
                {sortOption === 'least-purchased' && '가장 적게 구매한 식재료'}
                {sortOption === 'first-purchase' && '처음 구매한 식재료'}
                {sortOption === 'recent-purchase' && '최근 구매한 식재료'}
              </h3>
              <span className="text-xs text-gray-500">전체 구매 이력</span>
            </div>

            <div className="-mx-4 overflow-x-auto px-4">
              <div
                className="flex space-x-4 pb-2"
                style={{ minWidth: 'min-content' }}
              >
                {filteredItems.map((item, index) => {
                  // mockData에서 가져온 itemImageMap 사용
                  const imageUrl = itemImageMap[item.itemName];

                  return (
                    <div key={item.itemName} className="w-24 flex-shrink-0">
                      <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.itemName}
                            className="h-full w-full object-cover"
                            width={96}
                            height={96}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                            <span className="text-2xl font-bold text-purple-600">
                              {item.itemName.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* 순위 표시 */}
                        {/* <div className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
                          <span className="text-xs font-bold text-purple-600">
                            {index + 1}
                          </span>
                        </div> */}

                        {/* 정렬 옵션에 따른 배지 표시 */}
                        {sortOption === 'most-purchased' ||
                        sortOption === 'least-purchased' ? (
                          <div className="absolute right-0 bottom-0 rounded-tl-md bg-[#6B46C1] px-1.5 py-0.5 text-xs text-white">
                            {item.purchaseCount}회
                          </div>
                        ) : (
                          <div className="absolute right-0 bottom-0 rounded-tl-md bg-gray-700 px-1.5 py-0.5 text-xs text-white">
                            {sortOption === 'first-purchase' &&
                            item.firstPurchaseDate
                              ? formatDate(item.firstPurchaseDate)
                              : sortOption === 'recent-purchase' &&
                                  item.lastPurchaseDate
                                ? formatDate(item.lastPurchaseDate)
                                : ''}
                          </div>
                        )}
                      </div>
                      <p className="truncate text-center text-xs font-medium">
                        {item.itemName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PurchaseStats;
