// app/lib/schemas/notes.ts
// 가족 게시판 API 계약 (app/api/fridges/[id]/notes)

import { z } from 'zod';

export const NOTE_TEXT_MAX = 60;

const PersonSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
});

export const NoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  author: PersonSchema,
  createdAt: z.coerce.date(),
  // 확인(줄 긋기)한 사람. 아직 확인하지 않았으면 null
  checked: z.object({ by: PersonSchema, at: z.coerce.date() }).nullable(),
});

export const NoteListSchema = z.array(NoteSchema);

export const CreateNoteSchema = z.object({
  text: z.string().trim().min(1).max(NOTE_TEXT_MAX),
});

export const CheckNoteSchema = z.object({
  checked: z.boolean(),
});

export type Note = z.infer<typeof NoteSchema>;
