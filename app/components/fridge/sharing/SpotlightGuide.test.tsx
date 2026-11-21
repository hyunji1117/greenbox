// app/components/fridge/sharing/SpotlightGuide.test.tsx

import React, { useRef, useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GuideName } from '@/app/lib/analytics/gtag';

vi.mock('@/app/lib/analytics/gtag', () => ({ track: vi.fn() }));

import SpotlightGuide, { resetGuideQueueForTest } from './SpotlightGuide';

// 안내를 하나 띄우고, 오른쪽 버튼을 누르면 닫는 작은 화면
const Guide: React.FC<{ name: GuideName; title: string }> = ({
  name,
  title,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(true);
  return (
    <>
      <span ref={ref}>{title} 자리</span>
      {open && (
        <SpotlightGuide
          guide={name}
          target={ref}
          title={title}
          body="설명"
          primaryLabel="해 보기"
          spotLabel={`${title} 비춘 자리`}
          onPrimary={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
};

afterEach(() => {
  cleanup();
  resetGuideQueueForTest();
});

describe('SpotlightGuide 순서', () => {
  it('안내가 여러 개면 정한 순서대로 하나씩 보이고, 마지막은 시작하기다', () => {
    // 그리는 순서와 상관없이 정한 순서(함께 보는 사람 → 알림장)대로 보인다
    render(
      <>
        <Guide name="shelf_board" title="알림장 등장" />
        <Guide name="members_count" title="함께 보는 사람" />
      </>,
    );
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    screen.getByRole('dialog', { name: '함께 보는 사람' });
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    screen.getByRole('dialog', { name: '알림장 등장' });
    expect(screen.queryByRole('button', { name: '다음' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '시작하기' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('어두운 바깥을 눌러도 넘어가지 않는다', () => {
    render(<Guide name="members_count" title="함께 보는 사람" />);
    const dialog = screen.getByRole('dialog', { name: '함께 보는 사람' });
    fireEvent.click(dialog.firstElementChild as Element);
    fireEvent.click(dialog);
    expect(screen.getByRole('dialog', { name: '함께 보는 사람' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '안내 닫기' })).toBeNull();
  });

  it('보이기 시작한 안내는 순서가 앞선 안내가 늦게 와도 닫힐 때까지 그대로 둔다', () => {
    const { rerender } = render(
      <Guide name="shelf_board" title="알림장 등장" />,
    );
    screen.getByRole('dialog', { name: '알림장 등장' });
    rerender(
      <>
        <Guide name="shelf_board" title="알림장 등장" />
        <Guide name="members_count" title="함께 보는 사람" />
      </>,
    );
    screen.getByRole('dialog', { name: '알림장 등장' });
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    screen.getByRole('dialog', { name: '함께 보는 사람' });
  });
});
