// app/page.tsx
// 화면 틀을 먼저 보내고, 첫 탭이 냉장고면 품목을 서버에서 조회해 이어서 스트리밍한다

import { Suspense } from 'react';
import { cookies } from 'next/headers';
import PageClient from '@/app/PageClient';
import FridgeBoard from '@/app/components/fridge/FridgeBoard';
import FridgeBoardSkeleton from '@/app/components/fridge/FridgeBoardSkeleton';
import FridgeServerData from '@/app/components/fridge/FridgeServerData';
import {
  POLICY_NOTICE_COOKIE,
  policyNoticeVersion,
} from '@/app/lib/consent/policyNotice';
import { paramToTab } from '@/app/lib/navigation/tabs';

interface PageProps {
  searchParams: Promise<{ tab?: string | string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const startsOnFridge =
    paramToTab(typeof tab === 'string' ? tab : null) === 'fridge';

  // 방침 변경 안내는 첫 HTML에 함께 그려, 화면이 뜬 뒤 끼어들어 아래 내용을 밀어내지 않게 한다
  const noticeVersion = policyNoticeVersion(
    (await cookies()).get(POLICY_NOTICE_COOKIE)?.value,
  );

  return (
    <PageClient
      policyNoticeVersion={noticeVersion}
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
