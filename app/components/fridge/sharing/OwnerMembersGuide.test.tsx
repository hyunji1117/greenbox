// app/components/fridge/sharing/OwnerMembersGuide.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentFridge } from '@/app/lib/schemas/fridge';
import OwnerMembersGuide, { joinedLabel } from './OwnerMembersGuide';

const member = (userId: string, name: string | null, role = 'member') => ({
  userId,
  name,
  image: null,
  role: role as 'owner' | 'member',
});

const fridge = (overrides: Partial<CurrentFridge> = {}): CurrentFridge => ({
  id: '1',
  name: '내 냉장고',
  hasCustomName: false,
  role: 'owner',
  myNotifyLevel: 'watched',
  myUserId: '7',
  members: [member('7', '현지', 'owner'), member('8', '엄마')],
  pendingRequestCount: 0,
  fridgeCount: 1,
  ...overrides,
});

// 비출 "N명" 버튼 자리
const anchor = document.createElement('button');
document.body.appendChild(anchor);
const target = { current: anchor };

const guide = () => screen.queryByRole('dialog');

describe('OwnerMembersGuide', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('만든 사람에게 함께 보는 사람과 내보낼 수 있다는 것을 알린다', () => {
    render(
      <OwnerMembersGuide
        fridge={fridge()}
        target={target}
        isBlocked={false}
        onOpenMembers={() => {}}
      />,
    );
    expect(guide()?.textContent).toContain('엄마님이 이 냉장고에 참여했어요');
    expect(guide()?.textContent).toContain(
      '함께 쓰는 사람은 마이에서 보고 초대할 수 있어요',
    );
    expect(guide()?.textContent).not.toContain('내보낼');
  });

  it('다른 안내나 시트가 떠 있으면 기다린다', () => {
    render(
      <OwnerMembersGuide
        fridge={fridge()}
        target={target}
        isBlocked
        onOpenMembers={() => {}}
      />,
    );
    expect(guide()).toBeNull();
  });

  it('함께 보는 사람이 없거나 만든 사람이 아니면 보이지 않는다', () => {
    render(
      <OwnerMembersGuide
        fridge={fridge({ members: [member('7', '현지', 'owner')] })}
        target={target}
        isBlocked={false}
        onOpenMembers={() => {}}
      />,
    );
    expect(guide()).toBeNull();
    cleanup();
    render(
      <OwnerMembersGuide
        fridge={fridge({ role: 'member' })}
        target={target}
        isBlocked={false}
        onOpenMembers={() => {}}
      />,
    );
    expect(guide()).toBeNull();
  });

  it('닫으면 다시 보이지 않고, 새로운 사람이 들어오면 다시 보인다', () => {
    render(
      <OwnerMembersGuide
        fridge={fridge()}
        target={target}
        isBlocked={false}
        onOpenMembers={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '알겠어요' }));
    expect(guide()).toBeNull();

    cleanup();
    render(
      <OwnerMembersGuide
        fridge={fridge()}
        target={target}
        isBlocked={false}
        onOpenMembers={() => {}}
      />,
    );
    expect(guide()).toBeNull();

    cleanup();
    render(
      <OwnerMembersGuide
        fridge={fridge({
          members: [
            member('7', '현지', 'owner'),
            member('8', '엄마'),
            member('9', '아빠'),
          ],
        })}
        target={target}
        isBlocked={false}
        onOpenMembers={() => {}}
      />,
    );
    expect(guide()?.textContent).toContain('아빠님이 이 냉장고에 참여했어요');
  });

  it('마이에서 보기를 누르면 마이로 가고 안내는 확인한 것으로 한다', () => {
    const onOpenMembers = vi.fn();
    render(
      <OwnerMembersGuide
        fridge={fridge()}
        target={target}
        isBlocked={false}
        onOpenMembers={onOpenMembers}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '마이에서 보기' }));
    expect(onOpenMembers).toHaveBeenCalledOnce();
    expect(guide()).toBeNull();
  });
});

describe('joinedLabel', () => {
  it('이름이 없으면 새 구성원으로 부른다', () => {
    expect(joinedLabel([null])).toBe('새 구성원이');
    expect(joinedLabel(['엄마', '아빠', null])).toBe('엄마님 외 2명이');
  });
});
