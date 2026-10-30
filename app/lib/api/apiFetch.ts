// app/lib/api/apiFetch.ts
// 클라이언트의 서버 API 호출 창구. 응답을 스키마로 검증해서 화면에는 믿을 수 있는 값만 넘긴다.
// 실패 원인에 따라 처리가 달라서 HTTP 실패와 응답 형식 불일치를 다른 에러로 구분한다.

import type { z } from 'zod';

// 서버가 실패 상태로 응답함 (401, 404, 500 등)
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: unknown,
  ) {
    super(`API 요청 실패: ${status} ${url}`);
    this.name = 'ApiError';
  }
}

// 서버는 성공했지만 응답이 약속한 형식과 다름 (재시도해도 같은 결과)
export class ApiSchemaError extends Error {
  constructor(
    readonly url: string,
    readonly issues: z.core.$ZodIssue[],
  ) {
    super(`API 응답 형식 불일치: ${url}`);
    this.name = 'ApiSchemaError';
  }
}

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<Schema extends z.ZodType>(
  url: string,
  schema: Schema,
  { method = 'GET', body, signal }: ApiFetchOptions = {},
): Promise<z.output<Schema>> {
  const res = await fetch(url, {
    method,
    signal,
    cache: 'no-store',
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // 본문이 JSON이 아닌 응답(프록시 오류 페이지 등)도 아래에서 에러로 처리된다
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, url, json);

  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new ApiSchemaError(url, parsed.error.issues);
  return parsed.data;
}
