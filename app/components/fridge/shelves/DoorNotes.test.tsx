// app/components/fridge/shelves/DoorNotes.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '@/app/lib/schemas/notes';

const { check, remove, create, notes } = vi.hoisted(() => ({
  check: vi.fn(),
  remove: vi.fn(),
  create: vi.fn(),
  notes: { list: [] as Note[] },
}));

vi.mock('@/app/lib/analytics/gtag', () => ({ track: vi.fn() }));
vi.mock('@/app/lib/notes/useNotes', () => ({
  useNotes: () => ({ data: notes.list }),
  useCheckNote: () => ({ mutate: check, isPending: false }),
  useDeleteNote: () => ({ mutate: remove, isPending: false }),
  useCreateNote: () => ({ mutate: create, isPending: false, isError: false }),
}));

import DoorNotes, { noteTime } from './DoorNotes';

const note = (id: string, checked = false): Note => ({
  id,
  text: `메모 ${id}`,
  author: { id: '7', name: '엄마' },
  createdAt: new Date(),
  checked: checked ? { by: { id: '8', name: '현지' }, at: new Date() } : null,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DoorNotes', () => {
  it('문 위 보드는 작게 몇 줄만 적고, 누르면 큰 보드가 떠서 모든 기록을 스크롤로 보여 준다', () => {
    notes.list = [
      ...Array.from({ length: 6 }, (_, i) => note(String(i + 1))),
      note('9', true),
    ];
    render(<DoorNotes />);
    const board = screen.getByRole('button', {
      name: '알림장 열기, 확인 전 메모 6개',
    });
    // 문 위 보드에도 실제로 쓴 글이 작게 그대로 적힌다 (확인된 메모 포함 7개)
    expect(board.textContent).toContain('알림장');
    expect(board.textContent).toContain('메모 1');
    expect(board.textContent).toContain('메모 9');
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(board);
    const dialog = screen.getByRole('dialog', { name: '알림장' });
    const list = screen.getByRole('list', { name: '게시판 기록' });
    expect(dialog.contains(list)).toBe(true);
    expect(list.querySelectorAll(':scope > li')).toHaveLength(7);
    // 열리면 닫기 버튼에 초점이 가고, Esc로 닫힌다
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: '알림장 닫기' }),
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('메모를 누르면 확인하고, 지우기는 확인된 메모의 더 보기에만 있다', () => {
    notes.list = [note('1'), note('2', true)];
    render(<DoorNotes />);
    fireEvent.click(screen.getByRole('button', { name: /알림장 열기/ }));

    fireEvent.click(screen.getByRole('button', { name: /메모 1.*엄마/ }));
    expect(check).toHaveBeenCalledWith({ id: '1', checked: true });

    // 확인 전 메모에는 더 보기가 없다 (확인된 메모 하나에만)
    const more = screen.getAllByRole('button', { name: '메모 더 보기' });
    expect(more).toHaveLength(1);
    expect(screen.queryByRole('button', { name: '지우기' })).toBeNull();
    fireEvent.click(more[0]);
    fireEvent.click(screen.getByRole('button', { name: '지우기' }));
    expect(remove).toHaveBeenCalledWith('2');
  });

  it('붙이기는 앞뒤 공백을 빼고 보낸다', () => {
    notes.list = [];
    render(<DoorNotes />);
    fireEvent.click(screen.getByRole('button', { name: /알림장 열기/ }));
    fireEvent.change(screen.getByLabelText('메모 내용'), {
      target: { value: '  우유 사 왔어요 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '붙이기' }));
    expect(create).toHaveBeenCalledWith('우유 사 왔어요', expect.anything());
  });
});

describe('noteTime', () => {
  it('최근은 몇 분, 몇 시간 전으로, 하루가 지나면 날짜로 보여 준다', () => {
    const now = new Date(2026, 10, 15, 12, 0);
    expect(noteTime(new Date(2026, 10, 15, 11, 59, 30), now)).toBe('방금');
    expect(noteTime(new Date(2026, 10, 15, 11, 30), now)).toBe('30분 전');
    expect(noteTime(new Date(2026, 10, 15, 9, 0), now)).toBe('3시간 전');
    expect(noteTime(new Date(2026, 10, 13, 9, 0), now)).toBe('11월 13일');
  });
});
