'use client';
// app/components/stats/StatsPage.tsx
// 통계: 지금 보고 있는 냉장고의 실제 품목으로 계산한 수치만 보여 준다
// 보관 위치별 개수, 유통기한 상태, 함께 쓰는 냉장고에서 누가 넣었는지, 이 기기에서 자주 산 품목

import React from 'react';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import { EXPIRY_SOON_DAYS } from '@/app/lib/items/expiry';
import { computeItemStats } from '@/app/lib/items/stats';
import { useItems } from '@/app/lib/items/useItems';
import { usePurchaseHistory } from '@/app/lib/storage/usePurchaseHistory';

const TOP_PURCHASES = 5;

const LOCATION_CARDS = [
  {
    id: 'fridge',
    name: '냉장실',
    image:
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=720&q=80',
  },
  {
    id: 'freezer',
    name: '냉동실',
    image:
      'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?auto=format&fit=crop&w=720&q=80',
  },
  {
    id: 'pantry',
    name: '저장고',
    image:
      'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=720&q=80',
  },
] as const;

// 색만으로 구분하지 않도록 항상 글자와 숫자를 함께 쓴다
const EXPIRY_ROWS = [
  { key: 'expired', label: '지남', bar: 'bg-red-500', text: 'text-red-600' },
  {
    key: 'soon',
    label: `${EXPIRY_SOON_DAYS}일 안`,
    bar: 'bg-amber-400',
    text: 'text-amber-700',
  },
  {
    key: 'later',
    label: '넉넉함',
    bar: 'bg-[#6B46C1]',
    text: 'text-[#553C9A]',
  },
  {
    key: 'unknown',
    label: '기한 없음',
    bar: 'bg-gray-300',
    text: 'text-gray-500',
  },
] as const;

const Section: React.FC<{
  title: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ title, hint, children }) => (
  <section className={`mb-4 p-4 ${SURFACE}`}>
    <h2 className="text-base font-semibold">{title}</h2>
    {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
    <div className="mt-3">{children}</div>
  </section>
);

// 가장 큰 값을 꽉 찬 막대로 두고 나머지를 비율로 그린다
const BarList: React.FC<{
  rows: Array<{ key: string; label: string; count: number }>;
  unit: string;
}> = ({ rows, unit }) => {
  const max = Math.max(1, ...rows.map(row => row.count));
  return (
    <ul className="space-y-2.5">
      {rows.map(row => (
        <li key={row.key} className="text-sm">
          <div className="mb-1 flex justify-between gap-3">
            <span className="min-w-0 truncate font-medium text-gray-800">
              {row.label}
            </span>
            <span className="shrink-0 text-gray-500 tabular-nums">
              {row.count}
              {unit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#F4F4F8]">
            <div
              className="h-2 rounded-full bg-[#8B6BD6]"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

const EmptyNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-xl bg-[#F4F4F8] px-3 py-4 text-center text-sm text-balance text-gray-500">
    {children}
  </p>
);

interface StatsPageProps {
  onGoToFridge: () => void;
}

const StatsPage: React.FC<StatsPageProps> = ({ onGoToFridge }) => {
  const { data: fridge } = useCurrentFridge();
  const { data: items = [], isPending, error } = useItems();
  const purchases = usePurchaseHistory();
  const stats = computeItemStats(items);
  const isShared = (fridge?.members.length ?? 1) > 1;

  const topPurchases = [...(purchases.history ?? [])]
    .sort((a, b) => b.purchaseCount - a.purchaseCount)
    .slice(0, TOP_PURCHASES)
    .map(h => ({ key: h.itemName, label: h.itemName, count: h.purchaseCount }));

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl font-semibold">통계</h1>
        <p className="mt-4 text-sm text-red-500">품목을 불러오지 못했어요.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 sm:p-6 sm:pb-24">
      <h1 className="text-xl font-semibold">통계</h1>
      <p className="mt-1 mb-4 text-sm text-gray-500">
        {isPending
          ? '불러오는 중...'
          : `${fridge?.name ?? '냉장고'}에 품목 ${stats.total}개가 있어요`}
      </p>

      <Section
        title="보관 위치"
        hint={
          stats.finished > 0
            ? `다 먹은 품목 ${stats.finished}개는 세지 않아요`
            : undefined
        }
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {LOCATION_CARDS.map(card => (
            <button
              key={card.id}
              type="button"
              onClick={onGoToFridge}
              aria-label={`${card.name} ${stats.byCategory[card.id]}개, 냉장고 탭으로 이동`}
              className="relative h-24 overflow-hidden rounded-2xl bg-cover bg-center sm:h-32"
              style={{ backgroundImage: `url(${card.image})` }}
            >
              <span className="absolute inset-0 bg-black/30" />
              <span className="absolute inset-x-1 bottom-3 text-center text-white">
                <span className="block text-2xl leading-none font-semibold">
                  {stats.byCategory[card.id]}
                </span>
                <span className="mt-1 block truncate text-sm font-medium">
                  {card.name}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="유통기한">
        {stats.total === 0 ? (
          <EmptyNote>
            냉장고에 품목을 넣으면 유통기한 상태를 보여 드려요
          </EmptyNote>
        ) : (
          <>
            {/* 전체 중 각 상태의 비율 */}
            <div
              className="flex h-3 gap-0.5 overflow-hidden rounded-full"
              aria-hidden
            >
              {EXPIRY_ROWS.map(row =>
                stats.expiry[row.key] > 0 ? (
                  <div
                    key={row.key}
                    className={row.bar}
                    style={{ flexGrow: stats.expiry[row.key] }}
                  />
                ) : null,
              )}
            </div>
            <dl className="mt-3 grid grid-cols-4 gap-2 text-center">
              {EXPIRY_ROWS.map(row => (
                <div key={row.key} className="rounded-xl bg-[#F4F4F8] py-2">
                  <dt className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <span className={`h-2 w-2 rounded-full ${row.bar}`} />
                    {row.label}
                  </dt>
                  <dd
                    className={`mt-0.5 text-lg font-semibold tabular-nums ${row.text}`}
                  >
                    {stats.expiry[row.key]}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </Section>

      {isShared && (
        <Section title="누가 넣었나요" hint="지금 냉장고에 있는 품목 기준">
          {stats.byPerson.length === 0 ? (
            <EmptyNote>아직 넣은 품목이 없어요</EmptyNote>
          ) : (
            <BarList rows={stats.byPerson} unit="개" />
          )}
        </Section>
      )}

      <Section
        title="자주 산 품목"
        hint="이 기기에서 장보기를 완료한 기록 기준"
      >
        {purchases.history === null ? (
          <p className="text-sm text-gray-500">불러오는 중...</p>
        ) : topPurchases.length === 0 ? (
          <EmptyNote>
            {purchases.failed
              ? '이 브라우저에서는 구매 기록을 읽을 수 없어요'
              : '장보기 리스트에서 구매를 완료하면 여기에 쌓여요'}
          </EmptyNote>
        ) : (
          <BarList rows={topPurchases} unit="회" />
        )}
      </Section>
    </div>
  );
};

export default StatsPage;
