// app/page.tsx
// 화면 틀을 먼저 보내고, 첫 탭이 냉장고면 품목을 서버에서 조회해 이어서 스트리밍한다

import { Suspense } from 'react';
import PageClient from '@/app/PageClient';
import FridgeBoard from '@/app/components/fridge/FridgeBoard';
import FridgeBoardSkeleton from '@/app/components/fridge/FridgeBoardSkeleton';
import FridgeServerData from '@/app/components/fridge/FridgeServerData';
import { paramToTab } from '@/app/lib/navigation/tabs';

interface PageProps {
  searchParams: Promise<{ tab?: string | string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const startsOnFridge =
    paramToTab(typeof tab === 'string' ? tab : null) === 'fridge';

  return (
    <PageClient
      fridgeSlot={
        startsOnFridge ? (
          <Suspense fallback={<FridgeBoardSkeleton />}>
            <FridgeServerData>
              <FridgeBoard />
            </FridgeServerData>
          </Suspense>
        ) : undefined
      }
    />
  );
}
