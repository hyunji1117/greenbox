'use client';
// app/components/fridge/shelves/DoorNotes.tsx
// 가족 게시판: 닫힌 냉장고 문에 붙은 메모 (선반 보기 베타)
// - 문에는 확인하지 않은 메모부터 6개까지 포스트잇처럼 붙인다. 누르면 게시판 시트가 열린다
// - 시트에서 가족 누구나 쓰고, 눌러서 확인(줄 긋기)하고, 확인된 메모만 "⋯"에서 지운다
// - 새 메모는 다른 가족에게 알림이 간다 (서버가 알림 설정과 5분 간격을 지킨다)

import React, { useState } from 'react';
import { CheckIcon, MoreHorizontalIcon, PlusIcon } from 'lucide-react';
import BottomSheet from '@/app/components/common/BottomSheet';
import { track } from '@/app/lib/analytics/gtag';
import {
  useCheckNote,
  useCreateNote,
  useDeleteNote,
  useNotes,
} from '@/app/lib/notes/useNotes';
import { NOTE_TEXT_MAX, type Note } from '@/app/lib/schemas/notes';

export const NOTES_ON_DOOR = 6;

// 포스트잇 색. 메모마다 번호로 돌려 가며 고른다 (같은 메모는 늘 같은 색)
const STICKY = ['bg-[#FFF3B0]', 'bg-[#FFD9E2]', 'bg-[#D9F2E6]', 'bg-[#DDE8FF]'];
const TILT = ['-rotate-2', 'rotate-1', 'rotate-2', '-rotate-1'];
const pick = <T,>(list: T[], id: string) => list[Number(id) % list.length];

export function noteTime(date: Date, now = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const NoteRow: React.FC<{ note: Note }> = ({ note }) => {
  const check = useCheckNote();
  const remove = useDeleteNote();
  const [menuOpen, setMenuOpen] = useState(false);
  const checked = note.checked !== null;
  return (
    <li className={`rounded-xl p-3 ${pick(STICKY, note.id)}`}>
      <div className="flex items-start gap-2">
        {/* 메모를 누르면 확인(줄 긋기), 다시 누르면 확인 풀기 */}
        <button
          type="button"
          aria-pressed={checked}
          disabled={check.isPending}
          onClick={() => {
            setMenuOpen(false);
            check.mutate({ id: note.id, checked: !checked });
          }}
          className="flex min-h-11 min-w-0 flex-1 items-start gap-2 text-left"
        >
          <span
            aria-hidden
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-black/20 ${
              checked ? 'bg-[#6B46C1] ring-[#6B46C1]' : 'bg-white/70'
            }`}
          >
            {checked && <CheckIcon size={14} className="text-white" />}
          </span>
          <span className="min-w-0">
            <span
              className={`block text-[15px] break-words ${
                checked ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}
            >
              {note.text}
            </span>
            <span className="mt-0.5 block text-xs text-gray-500">
              {note.author.name ?? '가족'}, {noteTime(note.createdAt)}
              {note.checked && ` / ${note.checked.by.name ?? '가족'} 확인`}
            </span>
          </span>
        </button>
        {/* 지우기는 확인된 메모에만, 한 번 더 눌러야 보이게 둔다 */}
        {checked && (
          <button
            type="button"
            aria-label="메모 더 보기"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 active:bg-black/5"
          >
            <MoreHorizontalIcon size={18} />
          </button>
        )}
      </div>
      {checked && menuOpen && (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() => remove.mutate(note.id)}
            className="h-10 rounded-lg bg-white px-4 text-sm font-semibold text-red-600 ring-1 ring-black/10"
          >
            지우기
          </button>
        </div>
      )}
    </li>
  );
};

const NotesSheet: React.FC<{
  isOpen: boolean;
  notes: Note[];
  onClose: () => void;
}> = ({ isOpen, notes, onClose }) => {
  const [text, setText] = useState('');
  const create = useCreateNote();
  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || create.isPending) return;
    create.mutate(trimmed, { onSuccess: () => setText('') });
  };
  return (
    <BottomSheet isOpen={isOpen} title="가족 게시판" onClose={onClose}>
      <form
        onSubmit={event => {
          event.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        {/* iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 17px로 쓴다 */}
        <input
          value={text}
          onChange={event => setText(event.target.value)}
          maxLength={NOTE_TEXT_MAX}
          aria-label="메모 내용"
          placeholder="예: 우유 사 왔어요, 김치 꺼내 먹어요"
          className="h-12 min-w-0 flex-1 rounded-xl bg-white px-3 text-[17px] text-gray-800 ring-1 ring-black/10 placeholder:text-gray-400 focus:ring-2 focus:ring-[#A794D6] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || create.isPending}
          className="h-12 shrink-0 rounded-xl bg-[#6B46C1] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          붙이기
        </button>
      </form>
      <p className="mt-1 px-1 text-xs text-gray-400">
        붙이면 가족에게 알림이 가요. 눌러서 확인하면 줄이 그어져요.
      </p>
      {create.isError && (
        <p role="alert" className="mt-1 px-1 text-xs text-red-500">
          붙이지 못했어요. 확인된 메모를 지우거나 잠시 뒤 다시 해 주세요.
        </p>
      )}
      {notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          아직 메모가 없어요
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {notes.map(note => (
            <NoteRow key={note.id} note={note} />
          ))}
        </ul>
      )}
    </BottomSheet>
  );
};

// 닫힌 문 위에 놓는 메모 묶음. 냉장고를 여는 버튼보다 위에 놓아 메모를 눌러도 문이 열리지 않는다
const DoorNotes: React.FC = () => {
  const notes = useNotes(true).data ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const shown = notes.slice(0, NOTES_ON_DOOR);
  const unchecked = notes.filter(note => note.checked === null).length;
  const open = () => {
    setIsOpen(true);
    track('board_opened', { count: notes.length, unchecked });
  };
  return (
    <>
      <div className="pointer-events-none absolute inset-x-3 top-12 z-10 grid grid-cols-2 gap-x-8 gap-y-2">
        {shown.map(note => (
          <button
            key={note.id}
            type="button"
            onClick={open}
            className={`pointer-events-auto min-h-11 rounded-sm px-2 py-1.5 text-left text-xs leading-snug shadow-[0_2px_4px_rgba(31,26,46,0.18)] ${pick(STICKY, note.id)} ${pick(TILT, note.id)} ${
              note.checked ? 'text-gray-400 line-through' : 'text-gray-800'
            }`}
          >
            <span className="line-clamp-2 break-words">{note.text}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={open}
          className="pointer-events-auto flex min-h-11 items-center justify-center gap-1 rounded-sm border border-dashed border-[#A9B0BE] bg-white/60 px-2 text-xs font-semibold text-[#6B7385]"
        >
          {notes.length > NOTES_ON_DOOR ? (
            `전체 보기 (${notes.length})`
          ) : (
            <>
              <PlusIcon size={14} /> 메모
            </>
          )}
        </button>
      </div>
      <NotesSheet
        isOpen={isOpen}
        notes={notes}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default DoorNotes;
