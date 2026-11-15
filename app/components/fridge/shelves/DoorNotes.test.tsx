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

import DoorNotes, { NOTES_ON_DOOR, noteTime } from './DoorNotes';

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
  it('문에는 6개까지 붙이고, 넘치면 전체 보기로 개수를 알려 준다', () => {
    notes.list = Array.from({ length: 8 }, (_, i) => note(String(i + 1)));
    render(<DoorNotes />);
    expect(screen.getAllByText(/^메모 \d$/)).toHaveLength(NOTES_ON_DOOR);
    expect(screen.getByRole('button', { name: '전체 보기 (8)' })).toBeTruthy();
  });

  it('메모를 누르면 확인하고, 지우기는 확인된 메모의 더 보기에만 있다', () => {
    notes.list = [note('1'), note('2', true)];
    render(<DoorNotes />);
    fireEvent.click(screen.getByRole('button', { name: '메모 1' }));

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
    fireEvent.click(screen.getByRole('button', { name: /메모/ }));
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
