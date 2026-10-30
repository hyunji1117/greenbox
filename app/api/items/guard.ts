// app/api/items/guard.ts
// 품목 API 공통 확인. /api는 미들웨어를 거치지 않아서 각 API가 직접 확인한다.

import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';
import { z } from 'zod';
import { auth } from '@/auth';
import { POLICY_VERSION } from '@/app/lib/consent/policies';

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
  if (session.consentVersion !== POLICY_VERSION) {
    return {
      response: NextResponse.json(
        { error: 'consent_required' },
        { status: 403 },
      ),
    };
  }
  return { userId: session.user.id };
}

export function invalidRequest(error: ZodError): NextResponse {
  return NextResponse.json(
    { error: 'invalid_request', fields: z.flattenError(error).fieldErrors },
    { status: 400 },
  );
}
