// app/components/settings/AppVersionCard.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { INTERNAL_FLAG_KEY } from '@/app/lib/analytics/gtag';
import { GUIDE_TEST_KEY } from '@/app/lib/testing/guideTest';
import AppVersionCard, {
  REVEAL_TAPS,
  TOGGLE_HIDDEN_KEY,
} from './AppVersionCard';

const renderCard = (
  isTestAccount: boolean | undefined,
  Card: typeof AppVersionCard = AppVersionCard,
) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Card isTestAccount={isTestAccount} />
    </QueryClientProvider>,
  );

const tapVersion = (times = REVEAL_TAPS) => {
  const version = screen.getByText('앱 버전');
  for (let i = 0; i < times; i += 1) fireEvent.click(version);
};

describe('AppVersionCard', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('테스트 계정은 버전을 5번 누르면 테스트 기기 표시, 테스트 알림, 가이드 테스트를 보여 준다', () => {
    renderCard(true);
    expect(screen.queryByRole('switch')).toBeNull();
    tapVersion(REVEAL_TAPS - 1);
    expect(screen.queryByRole('switch')).toBeNull();
    tapVersion(1);
    expect(
      screen.getByRole('switch', { name: '테스트 기기로 표시' }),
    ).toBeTruthy();
    expect(screen.getByText('테스트 알림 보내기')).toBeTruthy();
    expect(screen.getByRole('switch', { name: '가이드 테스트' })).toBeTruthy();
  });

  it('다른 계정은 5번 눌러도 아무것도 나오지 않는다', () => {
    renderCard(false);
    tapVersion();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.queryByText('테스트 알림 보내기')).toBeNull();
  });

  it('다른 계정으로 마이를 열면 이 기기의 테스트 기기 표시와 가이드 테스트를 끈다', () => {
    localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    localStorage.setItem(GUIDE_TEST_KEY, '1');
    renderCard(false);
    expect(localStorage.getItem(INTERNAL_FLAG_KEY)).toBeNull();
    expect(localStorage.getItem(GUIDE_TEST_KEY)).toBeNull();
  });

  it('내 정보를 불러오는 중에는 아무것도 끄지 않는다', () => {
    localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    renderCard(undefined);
    expect(localStorage.getItem(INTERNAL_FLAG_KEY)).toBe('1');
  });

  it('사용자에게는 버전 숫자만 보이고, 개발자 모드에서만 배포 커밋이 함께 보인다', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '1.2.0');
    vi.stubEnv('NEXT_PUBLIC_APP_COMMIT', 'b4d0d43');
    vi.resetModules();
    const { default: Card } = await import('./AppVersionCard');
    renderCard(true, Card);
    expect(screen.getByText('1.2.0')).toBeTruthy();
    expect(screen.queryByText(/b4d0d43/)).toBeNull();
    tapVersion();
    expect(screen.getByText('1.2.0 (b4d0d43)')).toBeTruthy();
    vi.unstubAllEnvs();
  });

  it('다시 5번 누르면 숨기고, 켠 기기에서도 다음에 열 때 숨긴 채로 둔다', () => {
    localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    renderCard(true);
    tapVersion();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(localStorage.getItem(TOGGLE_HIDDEN_KEY)).toBe('1');
    // 표시는 그대로 켜져 있다 (숨기기만 한다)
    expect(localStorage.getItem(INTERNAL_FLAG_KEY)).toBe('1');

    cleanup();
    renderCard(true);
    expect(screen.queryByRole('switch')).toBeNull();
    tapVersion();
    expect(screen.getAllByRole('switch').length).toBeGreaterThan(0);
    expect(localStorage.getItem(TOGGLE_HIDDEN_KEY)).toBeNull();
  });

  it('이미 테스트 기기로 표시한 테스트 계정 기기에서는 끌 수 있게 보여 준다', () => {
    localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    renderCard(true);
    expect(
      screen.getByRole('switch', { name: '테스트 기기로 표시' }),
    ).toBeTruthy();
  });
});
