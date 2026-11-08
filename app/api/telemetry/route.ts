// app/api/telemetry/route.ts
// 브라우저가 화면을 떠날 때 모아 보내는 성능 지표와 화면 오류를 받는다
// 로그인 전 화면(로그인, 동의)의 오류도 받아야 해서 로그인을 요구하지 않는다. 대신
// - 같은 사이트에서 보낸 요청만 받고, 본문 크기와 개수를 제한하고, 인스턴스마다 가볍게 횟수를 제한한다
// - 누구의 기록인지 남기지 않는다 (회원 번호, IP, 브라우저 정보 문자열은 저장하지 않음)

import { NextResponse } from 'next/server';
import { TelemetryBatchSchema } from '@/app/lib/schemas/telemetry';
import { saveErrors, saveVitals } from '@/app/lib/telemetry/store';
import { browserOf, deviceOf } from '@/app/lib/telemetry/userAgent';

const MAX_BODY_BYTES = 32 * 1024;
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 120;
let windowStart = 0;
let windowCount = 0;

function isRateLimited(now = Date.now()): boolean {
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount > MAX_PER_WINDOW;
}

// 다른 사이트에서 보낸 요청은 받지 않는다 (sendBeacon은 같은 사이트면 Origin을 붙인다)
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return new URL(origin).host === new URL(request.url).host;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 });
  }
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    // 아래에서 형식 오류로 처리한다
  }
  const parsed = TelemetryBatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  if (isRateLimited()) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const userAgent = request.headers.get('user-agent') ?? '';
  const ctx = {
    device: deviceOf(userAgent),
    appVersion: parsed.data.appVersion,
  };
  await saveVitals(parsed.data.vitals, ctx);
  await saveErrors(parsed.data.errors, {
    ...ctx,
    browser: browserOf(userAgent),
  });
  return new NextResponse(null, { status: 204 });
}
