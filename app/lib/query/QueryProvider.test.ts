// app/lib/query/QueryProvider.test.ts

import { describe, expect, it } from 'vitest';
import { ApiError, ApiSchemaError } from '@/app/lib/api/apiFetch';
import { shouldRetry } from './QueryProvider';

describe('shouldRetry', () => {
  it('4xx와 응답 형식 불일치는 재시도하지 않는다', () => {
    expect(shouldRetry(0, new ApiError(401, '/api/x', null))).toBe(false);
    expect(shouldRetry(0, new ApiSchemaError('/api/x', []))).toBe(false);
  });

  it('5xx와 네트워크 오류는 2번까지만 재시도한다', () => {
    expect(shouldRetry(0, new ApiError(500, '/api/x', null))).toBe(true);
    expect(shouldRetry(1, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetry(2, new TypeError('Failed to fetch'))).toBe(false);
  });
});
