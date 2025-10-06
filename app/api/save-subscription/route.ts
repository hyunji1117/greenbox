// app/api/save-subscription/route.ts
// 푸시 구독(PushSubscription) 저장 API (Next.js App Router Route Handler)
// - 브라우저의 PushManager.subscribe() 결과(엔드포인트+키)를 서버에 등록
// - 데모로 메모리 배열을 사용, 추후 실제 서비스에서는 DB에 저장 예정

import { NextResponse } from 'next/server';

// ==========================================
//                타입 정의
// ==========================================

/**
 * 브라우저 PushManager.subscribe()가 반환하는 JSON 형태
 * - endpoint: 브라우저 Push Service로 보낼 주소
 * - expirationTime: 만료 시각(대부분 null)
 * - keys: 메시지 복호화용 공개키/인증키
 */
export type PushSubscriptionDTO = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

// ==========================================
//          내부 저장소 (데모용)
// ==========================================

/**
 * 데모용 인메모리 저장소
 * - 서버 재시작 시 초기화
 * - 실제 운영에서 DB/KV에 저장
 */
const subs: PushSubscriptionDTO[] = [];

// ==========================================
//            런타임 가드(검증)
// ==========================================

/**
 * 들어온 JSON이 PushSubscriptionDTO 모양인지 런타임에서 검사
 * - 외부 입력은 신뢰 불가하기에 반드시 검증
 */
function isPushSubscriptionDTO(value: unknown): value is PushSubscriptionDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const keys = v['keys'] as Record<string, unknown> | undefined;

  const endpointOK = typeof v['endpoint'] === 'string';
  const expOK =
    !('expirationTime' in v) ||
    v['expirationTime'] === null ||
    typeof v['expirationTime'] === 'number';
  const keysOK =
    keys &&
    typeof keys === 'object' &&
    typeof keys['p256dh'] === 'string' &&
    typeof keys['auth'] === 'string';

  return endpointOK && expOK && !!keysOK;
}

// ==========================================
//               POST 핸들러
// ==========================================

/**
 * POST /api/save-subscription
 * - 바디로 전달된 PushSubscription을 검증 후 저장합
 * - 동일 endpoint의 중복 등록 방지
 */
export async function POST(
  req: Request,
): Promise<NextResponse<{ ok: true } | { ok: false; error: string }>> {
  // JSON 파싱
  const body = await req.json();

  // 런타임 스키마 검증
  if (!isPushSubscriptionDTO(body)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid subscription payload' },
      { status: 400 },
    );
  }

  // 중복 방지(동일 endpoint 재등록 막기)
  if (!subs.some(s => s.endpoint === body.endpoint)) {
    subs.push(body);
  }

  return NextResponse.json({ ok: true });
}

// ==========================================
//             외부 접근 함수
// ==========================================

/**
 * getSubscriptions()
 * - 다른 라우트/서비스에서 읽기 전용으로 접근할 때 사용
 * - 데모용이므로 ReadonlyArray로 노출
 */
export function getSubscriptions(): ReadonlyArray<PushSubscriptionDTO> {
  return subs;
}
