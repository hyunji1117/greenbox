// app/components/fridge/FridgeBoardSkeleton.tsx
// 품목이 스트리밍되기 전에 보이는 화면. 도착했을 때 레이아웃이 밀리지 않도록 실제 화면과 틀을 맞춘다

const PULSE = 'motion-safe:animate-pulse rounded-2xl bg-gray-200';

const FridgeBoardSkeleton = () => (
  <div
    role="status"
    aria-label="냉장고를 불러오는 중"
    className="relative flex h-full flex-col p-4 sm:p-6"
  >
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">우리집 냉장고</h1>
    </div>
    <div className={`mb-4 h-12 ${PULSE}`} />
    <div className={`h-12 ${PULSE}`} />
    <div className={`mt-3 min-h-12 ${PULSE}`} />
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map(key => (
        <div key={key} className={`h-44 ${PULSE}`} />
      ))}
    </div>
  </div>
);

export default FridgeBoardSkeleton;
