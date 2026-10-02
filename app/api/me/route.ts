// app/api/me/route.ts
// 로그인 사용자 프로필 (설정 화면, 앱 안의 내 이름 표시용)
// 첫 화면을 정적 페이지로 유지하려고 서버 렌더링 대신 클라이언트에서 불러온다.

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMyProfile } from '@/app/lib/user/profile';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
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
