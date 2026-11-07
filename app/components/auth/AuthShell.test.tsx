// app/components/auth/AuthShell.test.tsx

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthShell from './AuthShell';

// next/font는 빌드할 때만 동작해서 테스트에서는 글꼴 클래스만 돌려준다
vi.mock('next/font/google', () => ({
  Nanum_Pen_Script: () => ({ className: 'font-hand' }),
}));

describe('AuthShell 맨 아래 개인정보처리방침 링크', () => {
  afterEach(cleanup);

  it('기본은 맨 아래에 방침 링크를 둔다', () => {
    render(<AuthShell title="로그인">내용</AuthShell>);
    expect(
      screen
        .getByRole('link', { name: '개인정보처리방침' })
        .getAttribute('href'),
    ).toBe('/privacy');
  });

  it('화면이 방침 링크를 직접 두면 맨 아래 링크를 빼 두 번 보이지 않게 한다', () => {
    render(
      <AuthShell title="동의" hideFooter>
        내용
      </AuthShell>,
    );
    expect(screen.queryByRole('link')).toBeNull();
  });
});
