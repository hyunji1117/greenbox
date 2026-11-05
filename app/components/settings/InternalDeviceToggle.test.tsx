// app/components/settings/InternalDeviceToggle.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { INTERNAL_FLAG_KEY } from '@/app/lib/analytics/gtag';
import InternalDeviceToggle from './InternalDeviceToggle';

const toggle = () => screen.getByRole('switch', { name: '테스트 기기로 표시' });

describe('InternalDeviceToggle', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('켜면 이 기기를 테스트 기기로 기억하고, 끄면 지운다', () => {
    render(<InternalDeviceToggle />);
    expect(toggle().getAttribute('aria-checked')).toBe('false');

    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-checked')).toBe('true');
    expect(localStorage.getItem(INTERNAL_FLAG_KEY)).toBe('1');

    fireEvent.click(toggle());
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    expect(localStorage.getItem(INTERNAL_FLAG_KEY)).toBeNull();
  });

  it('주소의 ?internal=on으로 표시한 기기는 켜진 상태로 보인다', () => {
    localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    render(<InternalDeviceToggle />);
    expect(toggle().getAttribute('aria-checked')).toBe('true');
  });
});
