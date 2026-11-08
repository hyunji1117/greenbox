// app/api/version/route.ts
// 지금 배포된 앱 버전. 열려 있는 화면이 예전 버전이면 새로 불러오게 하는 데 쓴다 (UpdateWatcher)

import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/app/lib/app/version';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { version: APP_VERSION },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
