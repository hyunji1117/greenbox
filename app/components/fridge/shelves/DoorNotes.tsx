'use client';
// app/components/fridge/shelves/DoorNotes.tsx
// 가족 게시판: 닫힌 냉장실 문에 붙은 작은 화이트보드 (선반 보기 베타)
// - 문 위의 보드(표지판 아래부터 손잡이 위까지)에는 실제로 쓴 메모를 아주 작은 체크박스 목록으로 두 칸에 적어 둔다 (읽기는 크게 펼쳐서)
// - 보드를 누르면 화면 가운데에 큰 화이트보드가 뜨고 뒤는 어둡게 가린다. 보드 안에서 스크롤로 모든 기록을 본다
// - 큰 보드에서 가족 누구나 쓰고, 눌러서 확인(줄 긋기)하고, 확인된 메모만 "⋯"에서 지운다
// - 새 메모는 다른 가족에게 알림이 간다 (서버가 알림 설정과 5분 간격을 지킨다)

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BellIcon, CheckIcon, MoreHorizontalIcon, XIcon } from 'lucide-react';
import { track } from '@/app/lib/analytics/gtag';
import {
  useCheckNote,
  useCreateNote,
  useDeleteNote,
  useNotes,
} from '@/app/lib/notes/useNotes';
import { NOTE_TEXT_MAX, type Note } from '@/app/lib/schemas/notes';

// 문 위 보드에 작은 글씨로 적어 두는 메모 수. 보드 높이는 냉장고 높이(선반 수)를 따라 바뀌어
// 가장 큰 냉장고(선반 7칸)에서 두 칸이 차는 만큼 넉넉히 두고, 넘치는 줄은 보드가 잘라 낸다
export const PREVIEW_ON_BOARD = 60;
export const BOARD_TITLE = '알림장';
// 쓰기 칸 예시. 냉장고 앞에서 가족끼리 실제로 주고받는 말(찜하기, 부탁, 알림)을 번갈아 보여 준다
// 좁은 화면에서도 잘리지 않게 10자 안팎으로
export const NOTE_EXAMPLES = [
  '내 케익 건들지 마라',
  '아빠 우유 하나만 사다줘',
  '찌개 데워 먹어요',
  '만두는 아빠 거',
] as const;
const EXAMPLE_INTERVAL_MS = 3000;

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
    <li className="border-b border-dashed border-gray-200 py-2 last:border-b-0">
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

// 크게 펼친 화이트보드. 뒤는 어둡게 가리고, 바깥을 누르거나 Esc, 닫기 버튼으로 닫는다
const NotesBoard: React.FC<{
  isOpen: boolean;
  notes: Note[];
  onClose: () => void;
}> = ({ isOpen, notes, onClose }) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [text, setText] = useState('');
  const create = useCreateNote();
  // 비어 있는 동안 예시 문구를 번갈아 보여 준다. 움직임 줄이기 설정이면 첫 예시만
  const [exampleIndex, setExampleIndex] = useState(0);
  useEffect(() => {
    if (!isOpen || text) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(
      () => setExampleIndex(index => (index + 1) % NOTE_EXAMPLES.length),
      EXAMPLE_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [isOpen, text]);
  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || create.isPending) return;
    create.mutate(trimmed, { onSuccess: () => setText('') });
  };

  // 닫기 함수는 화면이 다시 그려질 때마다 새로 오므로 ref로 들고, 열릴 때 한 번만 닫기 버튼에 초점을 둔다
  // (글을 쓰는 동안 다시 그려져도 초점이 입력창에서 닫기 버튼으로 옮겨 가지 않게)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        aria-hidden
        className="animate-backdrop-in absolute inset-0 bg-black/60"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={event => event.stopPropagation()}
        className="animate-dialog-in relative flex h-[min(80vh,640px)] w-full max-w-md flex-col rounded-md border-[6px] border-[#C3C9D4] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        {/* 제목은 가운데, 닫기는 오른쪽. 왼쪽에 같은 폭의 빈 칸을 두어 제목이 정확히 가운데에 온다 */}
        <div className="grid grid-cols-[44px_1fr_44px] items-center border-b border-gray-100 px-1 py-2">
          <span aria-hidden />
          <h2
            id={titleId}
            className="text-center text-lg font-bold text-[#2F3A56]"
          >
            {BOARD_TITLE}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={`${BOARD_TITLE} 닫기`}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 active:bg-gray-100"
          >
            <XIcon size={20} />
          </button>
        </div>
        <div className="px-4 pt-3">
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
              placeholder={`예: ${NOTE_EXAMPLES[exampleIndex]}`}
              className="h-12 min-w-0 flex-1 rounded-xl bg-[#F4F4F8] px-3 text-[17px] text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#A794D6] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim() || create.isPending}
              className="h-12 shrink-0 rounded-xl bg-[#6B46C1] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              붙이기
            </button>
          </form>
          {create.isError && (
            <p role="alert" className="mt-1 px-1 text-xs text-red-500">
              붙이지 못했어요. 확인된 메모를 지우거나 잠시 뒤 다시 해 주세요.
            </p>
          )}
        </div>
        {notes.length === 0 ? (
          <p className="flex flex-1 items-center justify-center text-sm text-gray-400">
            아직 메모가 없어요
          </p>
        ) : (
          <ul
            aria-label="게시판 기록"
            className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3"
          >
            {notes.map(note => (
              <NoteRow key={note.id} note={note} />
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
};

// 닫힌 냉장실 문에 붙은 화이트보드. 폭은 냉장실 문에 맞추고, 위는 표지판 아래(64px), 아래는 문 손잡이 위쪽 끝에서 8px 위
// 손잡이는 문 세로 가운데에 놓인 144px 막대(FridgeShelfView)라 위쪽 끝이 "높이의 50% - 72px"이다.
// 고정 높이 대신 손잡이에 맞춰 두어 냉장고 높이가 바뀌어도 늘 손잡이 위에서 멈춘다.
// 선반이 적어 손잡이 위 자리가 거의 없으면 최소 40px은 남긴다 (그때만 손잡이와 살짝 겹친다)
// 실제 메모를 아주 작게(7px) 적어 무엇이 붙어 있는지만 보이게 하고, 누르면 큰 보드가 열린다
// 냉장고를 여는 버튼보다 위에 놓아 보드를 눌러도 문이 열리지 않는다
const DoorNotes: React.FC = () => {
  const notes = useNotes(true).data ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const unchecked = notes.filter(note => note.checked === null);
  // 확인 전 메모가 먼저 오도록 정렬된 목록을 그대로, 실제로 쓴 글을 아주 작게 적는다
  const lines = notes.slice(0, PREVIEW_ON_BOARD);
  const open = () => {
    setIsOpen(true);
    track('board_opened', {
      count: notes.length,
      unchecked: unchecked.length,
    });
  };
  return (
    <>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[calc(50%-2px)]">
        <button
          type="button"
          onClick={open}
          // 업데이트 안내(ShelfUpdateGuide)가 이 보드를 비출 때 찾는 표시
          data-guide-target="door-notes"
          aria-label={
            unchecked.length > 0
              ? `${BOARD_TITLE} 열기, 확인 전 메모 ${unchecked.length}개`
              : `${BOARD_TITLE} 열기`
          }
          className="pointer-events-auto absolute inset-x-3 top-16 bottom-[calc(50%+80px)] flex min-h-10 flex-col rounded-sm border-2 border-[#C9CED8] bg-white px-1.5 pt-0.5 pb-1 text-left shadow-[0_1px_3px_rgba(31,26,46,0.12)] active:bg-gray-50"
        >
          {/* 제목은 맨 위 가운데에 붙인다 */}
          <span
            aria-hidden
            className="relative block border-b border-gray-200 pb-0.5 text-center text-[9px] leading-[12px] font-bold text-[#56607A]"
          >
            {BOARD_TITLE}
            {/* 확인 전 메모가 있으면 제목 줄 오른쪽에 작은 알림 종과 수를 둔다 (제목 줄 높이에 맞춰 세로 가운데) */}
            {unchecked.length > 0 && (
              <span className="absolute top-0 right-0.5 flex h-3 items-center">
                <BellIcon
                  size={10}
                  className="text-[#6B46C1]"
                  fill="currentColor"
                  fillOpacity={0.15}
                />
                <span className="absolute -top-px -right-0.5 flex h-[7px] min-w-[7px] origin-center scale-90 items-center justify-center rounded-full bg-[#E5484D] px-[1.5px] text-[5px] leading-none font-bold text-white">
                  {unchecked.length}
                </span>
              </span>
            )}
          </span>
          {/* 체크박스 목록을 왼쪽 위부터 채우고, 왼쪽 칸이 차면 가운데 구분선 너머 오른쪽 칸으로 넘어간다 */}
          <span
            aria-hidden
            className="relative mt-1 block min-h-0 flex-1 columns-2 gap-x-2 overflow-hidden [column-fill:auto]"
          >
            {/* 가운데 구분선은 메모가 한 칸만 차도 늘 보이게 따로 그린다 */}
            <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gray-200" />
            {lines.length === 0
              ? [70, 50, 60].map(width => (
                  <span
                    key={width}
                    className="mb-1 block h-[3px] rounded-full bg-gray-200"
                    style={{ width: `${width}%` }}
                  />
                ))
              : lines.map(note => (
                  <span
                    key={note.id}
                    className="flex break-inside-avoid items-center gap-[3px]"
                  >
                    <span
                      className={`h-[6px] w-[6px] shrink-0 rounded-[1px] border ${
                        note.checked
                          ? 'border-gray-400 bg-gray-400'
                          : 'border-gray-500 bg-white'
                      }`}
                    />
                    <span
                      className={`min-w-0 truncate text-[7px] leading-[10px] ${
                        note.checked
                          ? 'text-gray-400 line-through'
                          : 'text-gray-700'
                      }`}
                    >
                      {note.text}
                    </span>
                  </span>
                ))}
          </span>
        </button>
      </div>
      <NotesBoard
        isOpen={isOpen}
        notes={notes}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default DoorNotes;
