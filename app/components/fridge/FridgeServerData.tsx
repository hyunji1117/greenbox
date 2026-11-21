// app/components/fridge/FridgeServerData.tsx
// 냉장고 첫 화면에 필요한 데이터를 서버에서 조회해 클라이언트 캐시로 넘긴다.
// 브라우저가 같은 품목을 다시 요청하지 않고, 첫 HTML에 품목과 내 이름이 담긴다.
// 마지막으로 본 냉장고를 먼저 찾고 그 냉장고의 품목을 조회한다 (구성원 목록도 함께 넘겨 이름이 깜빡이지 않게 한다)
// 선반 보기 설정도 함께 넘긴다. 없으면 설정을 받기 전 잠깐 목록 화면이 보였다가 선반 보기로 바뀌었다 (2026-11-20)

import type { ReactNode } from 'react';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { requireUser } from '@/app/api/items/guard';
import { ServerProfileBoundary } from '@/app/context/FridgeContext';
import {
  countMyFridges,
  countPendingRequests,
  listFridgeMembers,
  resolveCurrentFridge,
} from '@/app/lib/fridges/store';
import { listItems } from '@/app/lib/items/store';
import { fridgeKeys, itemKeys, shelfKeys } from '@/app/lib/query/keys';
import { ShelfSettingsSchema } from '@/app/lib/schemas/shelves';
import { getShelfSettings } from '@/app/lib/shelves/store';
import { CurrentFridgeSchema } from '@/app/lib/schemas/fridge';
import { ItemListSchema } from '@/app/lib/schemas/item';
import { getMyProfile } from '@/app/lib/user/profile';

export default async function FridgeServerData({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await requireUser();
  if (!userId) return children;

  const queryClient = new QueryClient();
  // 조회에 실패해도 화면은 그린다. 실패한 조회는 캐시로 넘어가지 않아
  // 브라우저가 다시 요청하고, 그래도 실패하면 기존 '다시 시도' 화면이 보인다
  const [profile] = await Promise.all([
    getMyProfile(userId).catch(error => {
      console.error('첫 화면 프로필 조회 실패', error);
      return null;
    }),
    prefetchFridgeAndItems(queryClient, userId),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServerProfileBoundary profile={profile}>
        {children}
      </ServerProfileBoundary>
    </HydrationBoundary>
  );
}

// 냉장고를 찾은 뒤 구성원과 품목은 함께 조회한다
async function prefetchFridgeAndItems(
  queryClient: QueryClient,
  userId: string,
) {
  try {
    const fridge = await resolveCurrentFridge(userId);
    const [members, pendingRequestCount, fridgeCount, items, shelves] =
      await Promise.all([
        listFridgeMembers(fridge.id),
        countPendingRequests(fridge.id),
        countMyFridges(userId),
        listItems(fridge.id, userId),
        // 선반 설정을 못 읽어도 첫 화면은 그린다 (브라우저가 다시 요청한다)
        getShelfSettings(fridge.id, userId).catch(error => {
          console.error('첫 화면 선반 설정 조회 실패', error);
          return null;
        }),
      ]);
    queryClient.setQueryData(
      fridgeKeys.current(),
      CurrentFridgeSchema.parse({
        ...fridge,
        myUserId: userId,
        members,
        pendingRequestCount,
        fridgeCount,
      }),
    );
    queryClient.setQueryData(
      itemKeys.list(fridge.id),
      ItemListSchema.parse(items),
    );
    if (shelves) {
      queryClient.setQueryData(
        shelfKeys.settings(fridge.id),
        ShelfSettingsSchema.parse(shelves),
      );
    }
  } catch (error) {
    console.error('첫 화면 냉장고 조회 실패', error);
  }
}
