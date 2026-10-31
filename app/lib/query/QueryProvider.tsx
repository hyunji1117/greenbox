// app/lib/query/QueryProvider.tsx
// 서버 상태 캐시. 요청마다 새로 만들지 않도록 컴포넌트 안에서 한 번만 생성한다.

'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, ApiSchemaError } from '@/app/lib/api/apiFetch';

const MAX_RETRIES = 2;

// 다시 보내도 결과가 같은 실패(요청 오류, 응답 형식 불일치)는 재시도하지 않는다
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiSchemaError) return false;
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
      },
    },
  });
}

const QueryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
