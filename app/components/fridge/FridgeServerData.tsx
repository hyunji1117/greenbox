// app/components/fridge/FridgeServerData.tsx
// 냉장고 첫 화면에 필요한 데이터를 서버에서 조회해 클라이언트 캐시로 넘긴다.
// 브라우저가 같은 품목을 다시 요청하지 않고, 첫 HTML에 품목과 내 이름이 담긴다.

import type { ReactNode } from 'react';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { requireUser } from '@/app/api/items/guard';
import { ServerProfileBoundary } from '@/app/context/FridgeContext';
import { listItems } from '@/app/lib/items/store';
import { itemKeys } from '@/app/lib/query/keys';
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
    queryClient.prefetchQuery({
      queryKey: itemKeys.list(),
      queryFn: async () => {
        try {
          return ItemListSchema.parse(await listItems(userId));
        } catch (error) {
          console.error('첫 화면 품목 조회 실패', error);
          throw error;
        }
      },
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ServerProfileBoundary profile={profile}>
        {children}
      </ServerProfileBoundary>
    </HydrationBoundary>
  );
}
