// app/components/settings/FaqCard.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import FaqCard, { FAQS } from './FaqCard';

describe('FaqCard', () => {
  afterEach(cleanup);

  it('질문을 모두 보이고, 누르면 그 질문의 답이 펼쳐진다', () => {
    const { container } = render(<FaqCard />);
    expect(
      screen.getByRole('heading', { name: '자주 묻는 질문' }),
    ).toBeTruthy();
    for (const { question } of FAQS)
      expect(screen.getByText(question)).toBeTruthy();

    const first = container.querySelector('details');
    expect(first?.open).toBe(false);
    fireEvent.click(screen.getByText(FAQS[0].question));
    expect(first?.open).toBe(true);
  });

  it('장보기 리스트는 나만 본다고 답한다', () => {
    render(<FaqCard />);
    expect(FAQS[0].answer).toContain('나만 볼 수 있어요');
  });
});
