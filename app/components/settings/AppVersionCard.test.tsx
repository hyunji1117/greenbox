// app/components/settings/AppVersionCard.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { INTERNAL_FLAG_KEY } from '@/app/lib/analytics/gtag';
import AppVersionCard, {
  REVEAL_TAPS,
  TOGGLE_HIDDEN_KEY,
} from './AppVersionCard';

describe('AppVersionCard', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('테스트 기기 스위치는 숨겨 두고, 버전을 5번 누르면 보여 준다', () => {
    render(<AppVersionCard />);
    expect(screen.queryByRole('switch')).toBeNull();

    const version = screen.getByText('앱 버전');
    for (let i = 0; i < REVEAL_TAPS - 1; i += 1) fireEvent.click(version);
    expect(screen.queryByRole('switch')).toBeNull();
    fireEvent.click(version);
    expect(
      screen.getByRole('switch', { name: '테스트 기기로 표시' }),
    ).toBeTruthy();
  });

  it('사용자에게는 버전 숫자만 보이고, 개발자 모드에서만 배포 커밋이 함께 보인다', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '1.2.0');
    vi.stubEnv('NEXT_PUBLIC_APP_COMMIT', 'b4d0d43');
    vi.resetModules();
    const { default: Card } = await import('./AppVersionCard');
    render(<Card />);
    expect(screen.getByText('1.2.0')).toBeTruthy();
    expect(screen.queryByText(/b4d0d43/)).toBeNull();

    const version = screen.getByText('앱 버전');
    for (let i = 0; i < REVEAL_TAPS; i += 1) fireEvent.click(version);
    expect(screen.getByText('1.2.0 (b4d0d43)')).toBeTruthy();
    vi.unstubAllEnvs();
  });

  it('다시 5번 누르면 스위치를 숨기고, 켠 기기에서도 다음에 열 때 숨긴 채로 둔다', () => {
    localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    render(<AppVersionCard />);
    const version = screen.getByText('앱 버전');
    for (let i = 0; i < REVEAL_TAPS; i += 1) fireEvent.click(version);
    expect(screen.queryByRole('switch')).toBeNull();
    expect(localStorage.getItem(TOGGLE_HIDDEN_KEY)).toBe('1');
    // 표시는 그대로 켜져 있다 (숨기기만 한다)
    expect(localStorage.getItem(INTERNAL_FLAG_KEY)).toBe('1');

    cleanup();
    render(<AppVersionCard />);
    expect(screen.queryByRole('switch')).toBeNull();
    for (let i = 0; i < REVEAL_TAPS; i += 1)
      fireEvent.click(screen.getByText('앱 버전'));
    expect(screen.getByRole('switch')).toBeTruthy();
    expect(localStorage.getItem(TOGGLE_HIDDEN_KEY)).toBeNull();
  });

  it('운영자 계정이면 개발자 영역에 테스트 알림 버튼도 보여 준다', () => {
    localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    const { rerender } = render(<AppVersionCard />);
    expect(screen.queryByText('테스트 알림 보내기')).toBeNull();
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AppVersionCard isOperator />
      </QueryClientProvider>,
    );
    expect(screen.getByText('테스트 알림 보내기')).toBeTruthy();
  });

  it('이미 테스트 기기로 표시한 기기에서는 끌 수 있게 보여 준다', () => {
    localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    render(<AppVersionCard />);
    expect(screen.getByRole('switch')).toBeTruthy();
  });
});
