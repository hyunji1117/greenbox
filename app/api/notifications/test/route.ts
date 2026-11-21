// app/api/notifications/test/route.ts
// 테스트 알림. 테스트 계정(app/lib/testing/testAccount.ts)만 자기 기기로 보낼 수 있다

import { NextResponse } from 'next/server';
import { requireUser } from '@/app/api/items/guard';
import { koreaClock } from '@/app/lib/notifications/schedule';
import { sendTestSummaries } from '@/app/lib/notifications/testPush';
import { configurePush } from '@/app/lib/push/sendToUsers';
import { getMyProfile } from '@/app/lib/user/profile';
import { isTestAccount } from '@/app/lib/testing/testAccount';

// 연달아 눌러 알림이 쌓이지 않게 막는다 (인스턴스마다 따로 세는 가벼운 제한)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent: number[] = [];

export async function POST() {
  const { userId, response } = await requireUser();
  if (response) return response;

  const profile = await getMyProfile(userId);
  if (!isTestAccount(profile?.email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const now = Date.now();
  while (recent.length > 0 && now - recent[0] > WINDOW_MS) recent.shift();
  if (recent.length >= MAX_PER_WINDOW) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  recent.push(now);

  if (!configurePush()) {
    return NextResponse.json({ error: 'push_unavailable' }, { status: 503 });
  }
  const result = await sendTestSummaries(userId, koreaClock(new Date()).date);
  return NextResponse.json(result);
}
