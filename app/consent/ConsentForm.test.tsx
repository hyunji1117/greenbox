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

  it('바뀐 방침에 다시 동의할 때는 바뀐 점과 탈퇴 요청 방법을 보여 준다', () => {
    render(
      <ConsentForm
        email="a@example.com"
        isFirstLogin={false}
        changes={['첫째 변경', '둘째 변경']}
      />,
    );
    const changes = screen.getByRole('region', { name: '무엇이 바뀌었나요' });
    expect(changes.querySelectorAll('li')).toHaveLength(2);
    expect(
      screen.getByRole('link', { name: '탈퇴 요청하기' }).getAttribute('href'),
    ).toMatch(/^mailto:/);
    expect(
      screen.getByRole('button', { name: '동의하지 않고 로그아웃' }),
    ).toBeTruthy();
  });

  it('처음 가입할 때는 바뀐 점과 탈퇴 요청을 보이지 않는다', () => {
    render(<ConsentForm email={null} isFirstLogin changes={[]} />);
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.queryByRole('link', { name: '탈퇴 요청하기' })).toBeNull();
  });
});
