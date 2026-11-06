// app/components/common/PolicyNoticeBanner.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PolicyNoticeBanner from './PolicyNoticeBanner';

describe('PolicyNoticeBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('시행 전에는 시행일과 바뀌는 방침 링크를 보여 주고, 닫으면 다시 보이지 않는다', () => {
    vi.setSystemTime(new Date('2026-11-01T09:00:00+09:00'));
    render(<PolicyNoticeBanner />);

    expect(screen.getByRole('status').textContent).toContain(
      '11월 5일부터 개인정보처리방침이 바뀌어요',
    );
    expect(
      screen
        .getByRole('link', { name: '무엇이 바뀌나요' })
        .getAttribute('href'),
    ).toBe('/privacy/2026-11-05');

    fireEvent.click(
      screen.getByRole('button', { name: '방침 변경 안내 닫기' }),
    );
    expect(screen.queryByRole('status')).toBeNull();

    cleanup();
    render(<PolicyNoticeBanner />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('다시 동의받지 않는 변경은 시행 뒤 7일 동안 바뀌었다고 알린다', () => {
    vi.setSystemTime(new Date('2026-11-06T09:00:00+09:00'));
    render(<PolicyNoticeBanner />);

    expect(screen.getByRole('status').textContent).toContain(
      '11월 6일에 개인정보처리방침이 바뀌었어요',
    );
    expect(
      screen
        .getByRole('link', { name: '무엇이 바뀌었나요' })
        .getAttribute('href'),
    ).toBe('/privacy/2026-11-06');
  });

  it('알리는 기간이 지나면 보이지 않는다', () => {
    vi.setSystemTime(new Date('2026-11-14T09:00:00+09:00'));
    render(<PolicyNoticeBanner />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
