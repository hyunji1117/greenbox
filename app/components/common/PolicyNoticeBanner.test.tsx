// app/components/common/PolicyNoticeBanner.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LEGACY_DISMISSED_KEY_PREFIX,
  POLICY_NOTICE_COOKIE,
  policyNoticeVersion,
} from '@/app/lib/consent/policyNotice';
import PolicyNoticeBanner from './PolicyNoticeBanner';

const at = (date: string) => new Date(date).getTime();

describe('policyNoticeVersion', () => {
  it('시행 전에는 다가올 버전을, 다시 동의받지 않는 변경 뒤 7일 동안은 그 버전을 고른다', () => {
    expect(
      policyNoticeVersion(undefined, at('2026-11-01T09:00:00+09:00')),
    ).toBe('2026-11-05');
    // 11월 9일 개정을 미리 알리는 동안에는 그 버전을 먼저 알린다
    expect(
      policyNoticeVersion(undefined, at('2026-11-08T09:00:00+09:00')),
    ).toBe('2026-11-09');
    expect(
      policyNoticeVersion(undefined, at('2026-11-12T09:00:00+09:00')),
    ).toBe('2026-11-09');
    expect(
      policyNoticeVersion(undefined, at('2026-11-16T09:00:00+09:00')),
    ).toBeNull();
  });

  it('닫은 버전은 쿠키 기록을 보고 처음부터 빼고 그린다', () => {
    expect(
      policyNoticeVersion('2026-11-09', at('2026-11-12T09:00:00+09:00')),
    ).toBeNull();
  });
});

describe('PolicyNoticeBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = `${POLICY_NOTICE_COOKIE}=; max-age=0; path=/`;
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('시행 전에는 시행일과 바뀌는 방침 링크를 보여 주고, 닫으면 쿠키에 기록한다', () => {
    vi.setSystemTime(new Date('2026-11-01T09:00:00+09:00'));
    render(<PolicyNoticeBanner noticeVersion="2026-11-05" />);

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
    expect(document.cookie).toContain(`${POLICY_NOTICE_COOKIE}=2026-11-05`);
  });

  it('다시 동의받지 않는 변경은 바뀌었다고 알린다', () => {
    vi.setSystemTime(new Date('2026-11-06T09:00:00+09:00'));
    render(<PolicyNoticeBanner noticeVersion="2026-11-06" />);

    expect(screen.getByRole('status').textContent).toContain(
      '11월 6일에 개인정보처리방침이 바뀌었어요',
    );
    expect(
      screen
        .getByRole('link', { name: '무엇이 바뀌었나요' })
        .getAttribute('href'),
    ).toBe('/privacy/2026-11-06');
  });

  it('예전에 기기 저장소로 닫은 기록이 있으면 쿠키로 옮기고 보이지 않는다', () => {
    vi.setSystemTime(new Date('2026-11-06T09:00:00+09:00'));
    localStorage.setItem(LEGACY_DISMISSED_KEY_PREFIX + '2026-11-06', '1');
    render(<PolicyNoticeBanner noticeVersion="2026-11-06" />);

    expect(screen.queryByRole('status')).toBeNull();
    expect(document.cookie).toContain(`${POLICY_NOTICE_COOKIE}=2026-11-06`);
  });

  it('알릴 버전이 없으면 그리지 않는다', () => {
    render(<PolicyNoticeBanner noticeVersion={null} />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
