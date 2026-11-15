'use client';
// app/lib/notes/useNotes.ts
// 가족 게시판 조회와 쓰기, 확인, 지우기 (화면용)
// 가족이 쓴 메모가 바로 보이도록 화면에 돌아올 때마다 다시 읽는다 (기본 동작)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { track } from '@/app/lib/analytics/gtag';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import { noteKeys } from '@/app/lib/query/keys';
import { NoteListSchema, NoteSchema, type Note } from '@/app/lib/schemas/notes';

const notesUrl = (fridgeId: string) => `/api/fridges/${fridgeId}/notes`;
const NoContent = z.null();

export function useNotes(enabled: boolean) {
  const fridgeId = useCurrentFridge().data?.id;
  return useQuery({
    queryKey: noteKeys.list(fridgeId ?? ''),
    queryFn: () => apiFetch(notesUrl(fridgeId!), NoteListSchema),
    enabled: enabled && Boolean(fridgeId),
    staleTime: 30 * 1000,
  });
}

// 확인하지 않은 메모를 먼저, 그 안에서는 새 메모부터 (서버와 같은 순서)
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    const checked = Number(Boolean(a.checked)) - Number(Boolean(b.checked));
    return checked !== 0
      ? checked
      : b.createdAt.getTime() - a.createdAt.getTime();
  });
}

function useNotesCache() {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridge().data?.id ?? '';
  const update = (change: (notes: Note[]) => Note[]) =>
    queryClient.setQueryData<Note[]>(noteKeys.list(fridgeId), notes =>
      sortNotes(change(notes ?? [])),
    );
  return { fridgeId, update };
}

export function useCreateNote() {
  const { fridgeId, update } = useNotesCache();
  return useMutation({
    mutationFn: (text: string) =>
      apiFetch(notesUrl(fridgeId), NoteSchema, {
        method: 'POST',
        body: { text },
      }),
    onSuccess: note => {
      update(notes => [note, ...notes]);
      track('board_note_created', { length: note.text.length });
    },
  });
}

export function useCheckNote() {
  const { fridgeId, update } = useNotesCache();
  return useMutation({
    mutationFn: (input: { id: string; checked: boolean }) =>
      apiFetch(`${notesUrl(fridgeId)}/${input.id}`, NoteSchema, {
        method: 'PATCH',
        body: { checked: input.checked },
      }),
    onSuccess: note => {
      update(notes => notes.map(n => (n.id === note.id ? note : n)));
      track('board_note_checked', { checked: note.checked !== null });
    },
  });
}

export function useDeleteNote() {
  const { fridgeId, update } = useNotesCache();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${notesUrl(fridgeId)}/${id}`, NoContent, {
        method: 'DELETE',
      }),
    onSuccess: (_, id) => {
      update(notes => notes.filter(n => n.id !== id));
      track('board_note_deleted');
    },
  });
}
