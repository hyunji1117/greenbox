// app/components/settings/MembersEntryCard.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MembersEntryCard from './MembersEntryCard';

const fridgeState = vi.hoisted(() => ({
  data: undefined as unknown,
}));
vi.mock('@/app/lib/fridges/useCurrentFridge', () => ({
  useCurrentFridge: () => ({ data: fridgeState.data }),
}));
// 시트 안의 초대와 구성원 관리는 MembersSheet 쪽에서 확인한다. 여기서는 열리는지만 본다
vi.mock('@/app/components/fridge/sharing/MembersSheet', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog">함께 보는 사람 시트</div> : null,
}));

describe('MembersEntryCard', () => {
  afterEach(cleanup);

  it('냉장고 이름, 사람 수, 참여 요청을 보이고 누르면 함께 보는 사람 시트를 연다', () => {
    fridgeState.data = {
      id: '1',
      name: '가족 냉장고',
      members: [{}, {}, {}],
      pendingRequestCount: 1,
    };
    render(<MembersEntryCard />);
    const entry = screen.getByRole('button', { name: /함께 보는 사람과 초대/ });
    expect(entry.textContent).toContain('가족 냉장고, 3명, 참여 요청 1건');
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(entry);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('냉장고를 아직 못 불러왔으면 아무것도 그리지 않는다', () => {
    fridgeState.data = undefined;
    const { container } = render(<MembersEntryCard />);
    expect(container.innerHTML).toBe('');
  });
});
