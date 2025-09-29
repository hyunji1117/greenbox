// app/components/PurchaseStats.tsx
import React, { useEffect, useState } from 'react';
import purchaseStorage from '@/app/lib/storage/PurchaseDataStorage';
import { TrendingUp } from 'lucide-react';
interface TopItem {
  itemName: string;
  purchaseCount: number;
}
const PurchaseStats: React.FC = () => {
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
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
  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-gray-200"></div>;
  }
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
      {' '}
      <h2 className="mb-3 flex items-center text-lg font-semibold">
        {' '}
        <TrendingUp size={20} className="mr-2 text-purple-600" /> 자주 구매하는
        식재료 TOP 5{' '}
      </h2>{' '}
      {topItems.length === 0 ? (
        <p className="text-sm text-gray-500">아직 구매 기록이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {' '}
          {topItems.map((item, index) => (
            <div
              key={item.itemName}
              className="flex items-center justify-between rounded-lg bg-white p-2"
            >
              {' '}
              <div className="flex items-center">
                {' '}
                <span className="mr-3 text-lg font-bold text-purple-600">
                  {' '}
                  {index + 1}{' '}
                </span>{' '}
                <span className="font-medium">{item.itemName}</span>{' '}
              </div>{' '}
              <div className="text-sm text-gray-600">
                {' '}
                구매 {item.purchaseCount}회{' '}
              </div>{' '}
            </div>
          ))}{' '}
        </div>
      )}{' '}
    </div>
  );
};
export default PurchaseStats;
