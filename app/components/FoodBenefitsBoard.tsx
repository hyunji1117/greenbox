import React, { useState } from 'react'
import { useFridge, FoodBenefit } from '../context/FridgeContext'
import { SearchIcon, InfoIcon } from 'lucide-react'
const FoodBenefitsBoard: React.FC = () => {
  const { foodBenefits, searchFoodBenefits } = useFridge()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodBenefit | null>(null)
  const [filteredFoods, setFilteredFoods] =
    useState<FoodBenefit[]>(foodBenefits)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const results = searchFoodBenefits(searchQuery)
    setFilteredFoods(results)
  }
  const clearSearch = () => {
    setSearchQuery('')
    setFilteredFoods(foodBenefits)
  }
  // Group foods by category
  const foodsByCategory: Record<string, FoodBenefit[]> = {}
  filteredFoods.forEach((food) => {
    if (!foodsByCategory[food.category]) {
      foodsByCategory[food.category] = []
    }
    foodsByCategory[food.category].push(food)
  })
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">식재료 효능 정보</h1>
        <p className="text-gray-500">
          식재료의 영양소와 건강 효능을 확인하세요
        </p>
      </div>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="식재료 이름 또는 효능 검색..."
              className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="bg-[#6B46C1] text-white px-4 py-2 rounded-r-lg hover:bg-[#4b2f8c]"
          >
            검색
          </button>
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="text-sm text-indigo-600 mt-2 hover:underline"
          >
            검색 초기화
          </button>
        )}
      </form>
      <div className="flex-1 overflow-y-auto">
        {filteredFoods.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        ) : selectedFood ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{selectedFood.name}</h2>
                <p className="text-sm text-indigo-600 font-medium">
                  {selectedFood.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ← 목록으로 돌아가기
              </button>
            </div>
            {selectedFood.imageUrl && (
              <div className="mb-6">
                <img
                  src={selectedFood.imageUrl}
                  alt={selectedFood.name}
                  className="w-full h-56 object-cover rounded-lg"
                />
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">건강 효능</h3>
              <ul className="list-disc pl-5 space-y-1">
                {selectedFood.benefits.map((benefit, index) => (
                  <li key={index} className="text-gray-700">
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">영양 정보</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
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
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedFood.nutrition.vitamins.map((vitamin, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded"
                      >
                        {vitamin}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">보관 팁</h3>
              <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                {selectedFood.storageTips}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {Object.keys(foodsByCategory).map((category) => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-semibold mb-3">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {foodsByCategory[category].map((food) => (
                    <div
                      key={food.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedFood(food)}
                    >
                      <div className="relative h-32">
                        {food.imageUrl ? (
                          <img
                            src={food.imageUrl}
                            alt={food.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <InfoIcon size={24} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg">{food.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {food.benefits[0]}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {food.nutrition.vitamins
                            .slice(0, 2)
                            .map((vitamin, index) => (
                              <span
                                key={index}
                                className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded"
                              >
                                {vitamin}
                              </span>
                            ))}
                          {food.nutrition.vitamins.length > 2 && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
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
  )
}
export default FoodBenefitsBoard
