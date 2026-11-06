// app/components/settings/AppVersionCard.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { INTERNAL_FLAG_KEY } from '@/app/lib/analytics/gtag';
import AppVersionCard, { REVEAL_TAPS } from './AppVersionCard';

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

  it('이미 테스트 기기로 표시한 기기에서는 끌 수 있게 보여 준다', () => {
    localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    render(<AppVersionCard />);
    expect(screen.getByRole('switch')).toBeTruthy();
  });
});
