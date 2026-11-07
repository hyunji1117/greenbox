// app/join/[code]/JoinDescription.test.tsx

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';
import JoinDescription from './JoinDescription';

const TEXT = '참여를 요청하고 함께 냉장고를 관리해 보세요.';

function renderWith(status: 'none' | 'pending' | null, canRequest = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  if (status) {
    client.setQueryData(['fridges', 'join', 'abc'], { status, fridgeId: '1' });
  }
  render(
    <QueryClientProvider client={client}>
      <JoinDescription code="abc" canRequest={canRequest} />
    </QueryClientProvider>,
  );
}

describe('JoinDescription', () => {
  afterEach(cleanup);

  it('요청을 보내기 전에는 보인다', () => {
    renderWith('none');
    expect(screen.getByText(TEXT)).toBeTruthy();
  });

  it('요청을 보낸 뒤(기다리는 중)에는 사라진다', () => {
    renderWith('pending');
    expect(screen.queryByText(TEXT)).toBeNull();
  });

  it('로그인이나 동의 전에는 요청 여부와 상관없이 보인다', () => {
    renderWith(null, false);
    expect(screen.getByText(TEXT)).toBeTruthy();
  });
});
