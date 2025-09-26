import React, { useState } from 'react';
import { useFridge, FoodBenefit } from '../context/FridgeContext';
import { SearchIcon, InfoIcon } from 'lucide-react';
import Image from 'next/image';
const FoodBenefitsBoard: React.FC = () => {
  const { foodBenefits, searchFoodBenefits } = useFridge();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodBenefit | null>(null);
  const [filteredFoods, setFilteredFoods] =
    useState<FoodBenefit[]>(foodBenefits);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const results = searchFoodBenefits(searchQuery);
    setFilteredFoods(results);
  };
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredFoods(foodBenefits);
  };
  // Group foods by category
  const foodsByCategory: Record<string, FoodBenefit[]> = {};
  filteredFoods.forEach(food => {
    if (!foodsByCategory[food.category]) {
      foodsByCategory[food.category] = [];
    }
    foodsByCategory[food.category].push(food);
  });
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-bold">식재료 효능 정보</h1>
        <p className="text-sm text-gray-500">
          식재료의 영양소와 건강 효능을 확인하세요
        </p>
      </div>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="식재료 이름 또는 효능 검색..."
              className="rounded-r-0 w-full rounded-l-xl border border-gray-200 px-3 py-2 pl-9 text-[#636465] shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex rounded-r-xl bg-[#6B46C1] px-4 py-2 text-white shadow-sm hover:bg-[#4b2f8c]"
          >
            검색
          </button>
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="mt-2 text-sm text-indigo-600 hover:underline"
          >
            검색 초기화
          </button>
        )}
      </form>
      <div className="flex-1 overflow-y-auto rounded-xl">
        {filteredFoods.length === 0 ? (
          <div className="mt-4 rounded-xl bg-gray-50 py-12 text-center shadow-sm">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        ) : selectedFood ? (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedFood.name}</h2>
                <p className="text-sm font-medium text-indigo-600">
                  {selectedFood.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="rounded-xl border-1 border-gray-200 px-1 text-sm text-gray-400 shadow-sm hover:border-gray-300 hover:text-gray-500"
              >
                목록으로 돌아가기
              </button>
            </div>
            {selectedFood.imageUrl && (
              <div className="mb-6 rounded-xl shadow-sm">
                <Image
                  src={selectedFood.imageUrl}
                  alt={selectedFood.name}
                  className="h-56 w-full rounded-xl object-cover"
                  width={600}
                  height={224}
                />
              </div>
            )}
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-semibold">건강 효능</h3>
              <ul className="list-disc space-y-1 pl-5">
                {selectedFood.benefits.map((benefit, index) => (
                  <li key={index} className="text-gray-700">
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-semibold">영양 정보</h3>
              <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">칼로리</p>
                    <p className="font-medium">
                      {selectedFood.nutrition.calories} kcal
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">단백질</p>
                    <p className="font-medium">
                      {selectedFood.nutrition.protein}g
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">탄수화물</p>
                    <p className="font-medium">
                      {selectedFood.nutrition.carbs}g
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">지방</p>
                    <p className="font-medium">{selectedFood.nutrition.fat}g</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">주요 비타민 및 미네랄</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedFood.nutrition.vitamins.map((vitamin, index) => (
                      <span
                        key={index}
                        className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-800"
                      >
                        {vitamin}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">보관 팁</h3>
              <p className="rounded-xl border-l-4 border-yellow-400 bg-yellow-50 p-4 text-gray-700 shadow-sm">
                {selectedFood.storageTips}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {Object.keys(foodsByCategory).map(category => (
              <div key={category} className="mb-8">
                <h2 className="mb-3 text-xl font-semibold">{category}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {foodsByCategory[category].map(food => (
                    <div
                      key={food.id}
                      className="cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg"
                      onClick={() => setSelectedFood(food)}
                    >
                      <div className="relative h-32">
                        {food.imageUrl ? (
                          <Image
                            src={food.imageUrl}
                            alt={food.name}
                            className="h-full w-full object-cover"
                            width={400}
                            height={200}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200">
                            <InfoIcon size={24} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold">{food.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {food.benefits[0]}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {food.nutrition.vitamins
                            .slice(0, 2)
                            .map((vitamin, index) => (
                              <span
                                key={index}
                                className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800"
                              >
                                {vitamin}
                              </span>
                            ))}
                          {food.nutrition.vitamins.length > 2 && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
                              +{food.nutrition.vitamins.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default FoodBenefitsBoard;
