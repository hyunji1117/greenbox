// app/api/items/guard.ts
// 품목 API 공통 확인. /api는 미들웨어를 거치지 않아서 각 API가 직접 확인한다.

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  APP_VERSION,
  APP_VERSION_HEADER,
  UPDATE_REQUIRED_STATUS,
} from '@/app/lib/app/version';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { getFridgeRole, type FridgeRole } from '@/app/lib/fridges/store';

type Guarded =
  | { userId: string; response?: never }
  | { userId?: never; response: NextResponse };

// 예전 버전 앱의 요청은 거절해 업데이트하게 한다 (앱을 닫지 않으면 예전 화면이 계속 남아서)
// - 'missing': 버전을 붙이지 않은 앱(1.8.2 이전). 업데이트 화면 코드가 없어, 그 앱이 이미 가진
//   "동의 필요면 /consent로 옮기기"를 이용해 앱을 다시 열라는 안내 화면으로 보낸다 (v1.1.0부터 있음)
// - 'old': 버전은 붙였지만 지금 배포된 버전과 다른 앱. 앱이 업데이트 화면을 띄운다
// 요청 밖(테스트 등)이라 헤더를 읽을 수 없으면 확인하지 않는다
async function clientVersionState(): Promise<'ok' | 'missing' | 'old'> {
  try {
    const version = (await headers()).get(APP_VERSION_HEADER);
    if (!version) return 'missing';
    return version === APP_VERSION ? 'ok' : 'old';
  } catch {
    return 'ok';
  }
}

const updateRequired = () =>
  NextResponse.json(
    { error: 'update_required', version: APP_VERSION },
    { status: UPDATE_REQUIRED_STATUS },
  );

// 가입했고 현재 방침에 동의한 사용자만 통과한다
// allowAnyVersion: 브라우저가 직접 불러오는 이미지처럼 버전을 붙일 수 없는 요청
export async function requireUser({
  allowAnyVersion = false,
}: { allowAnyVersion?: boolean } = {}): Promise<Guarded> {
  if (!allowAnyVersion && process.env.NODE_ENV !== 'development') {
    const state = await clientVersionState();
    if (state === 'old') return { response: updateRequired() };
    if (state === 'missing') {
      return {
        response: NextResponse.json(
          { error: 'consent_required', reason: 'app_restart_required' },
          { status: 403 },
        ),
      };
    }
  }
  const session = await auth();
  if (!session?.registered) {
    return {
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    };
  }
  if (session.consentVersion !== currentPolicyVersion()) {
    return {
      response: NextResponse.json(
        { error: 'consent_required' },
        { status: 403 },
      ),
    };
  }
  return { userId: session.user.id };
}

export const notFound = () =>
  NextResponse.json({ error: 'not_found' }, { status: 404 });

type FridgeGuarded =
  | { role: FridgeRole; response?: never }
  | { role?: never; response: NextResponse };

// 냉장고 권한 확인은 모두 이 함수를 거친다. 구성원이 아니면 냉장고가 있는지도 알리지 않도록 404
export async function requireFridgeMember(
  userId: string,
  fridgeId: string,
): Promise<FridgeGuarded> {
  const role = await getFridgeRole(userId, fridgeId);
  return role ? { role } : { response: notFound() };
}

// 선반이 가득 찼거나(20개) 없는 선반일 때. 화면은 error 값으로 안내 문구를 고른다
export function shelfConflict(reason: 'full' | 'no_shelf'): NextResponse {
  return NextResponse.json(
    { error: reason === 'full' ? 'shelf_full' : 'no_such_shelf' },
    { status: 409 },
  );
}

export function invalidRequest(error: ZodError): NextResponse {
  return NextResponse.json(
    { error: 'invalid_request', fields: z.flattenError(error).fieldErrors },
    { status: 400 },
  );
}
