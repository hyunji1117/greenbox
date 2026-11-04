// app/api/items/guard.ts
// 품목 API 공통 확인. /api는 미들웨어를 거치지 않아서 각 API가 직접 확인한다.

import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { z } from 'zod';
import { auth } from '@/auth';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { getFridgeRole, type FridgeRole } from '@/app/lib/fridges/store';

type Guarded =
  | { userId: string; response?: never }
  | { userId?: never; response: NextResponse };

// 가입했고 현재 방침에 동의한 사용자만 통과한다
export async function requireUser(): Promise<Guarded> {
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

export function invalidRequest(error: ZodError): NextResponse {
  return NextResponse.json(
    { error: 'invalid_request', fields: z.flattenError(error).fieldErrors },
    { status: 400 },
  );
}
