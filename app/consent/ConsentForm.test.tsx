// app/consent/ConsentForm.test.tsx

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConsentForm from './ConsentForm';

vi.mock('@/app/auth/actions', () => ({
  agreeToCurrentPolicy: vi.fn(),
  declineConsent: vi.fn(),
}));

describe('ConsentForm', () => {
  afterEach(cleanup);

  it('다시 동의할 때는 바뀐 방침 링크와 로그아웃을 한 줄에 두고 탈퇴를 권하지 않는다', () => {
    render(
      <ConsentForm
        email="a@example.com"
        isFirstLogin={false}
        changedSince="2026-10-02"
      />,
    );
    expect(
      screen
        .getByRole('link', { name: '바뀐 개인정보처리방침 보기' })
        .getAttribute('href'),
    ).toBe('/privacy?changedSince=2026-10-02');
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeTruthy();
    expect(screen.getByText(/계정으로 이용하고 있어요/)).toBeTruthy();
    expect(screen.queryByText(/탈퇴/)).toBeNull();
  });

  it('처음 가입할 때는 일반 방침 링크와 나가기를 둔다', () => {
    render(<ConsentForm email="a@example.com" isFirstLogin />);
    expect(
      screen
        .getByRole('link', { name: '개인정보처리방침' })
        .getAttribute('href'),
    ).toBe('/privacy');
    expect(screen.getByRole('button', { name: '나가기' })).toBeTruthy();
    expect(screen.getByText(/계정으로 가입해요/)).toBeTruthy();
  });
});
