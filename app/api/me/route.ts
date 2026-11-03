// app/api/me/route.ts
// 로그인 사용자 프로필 (설정 화면, 앱 안의 내 이름 표시용)
// 탭과 상관없이 앱 전체에서 쓰므로 클라이언트에서 불러온다. 냉장고 첫 화면은 서버에서 함께 조회한다.

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMyProfile } from '@/app/lib/user/profile';

export async function GET() {
  const session = await auth();
  if (!session?.registered) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const profile = await getMyProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json(profile, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
