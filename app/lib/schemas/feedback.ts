// app/lib/schemas/feedback.ts
// 의견 보내기 API 계약. DB 제약(0010_feedback.sql)과 같은 범위

import { z } from 'zod';

export const FEEDBACK_TEXT_MAX = 1000;

export const FeedbackInputMethodSchema = z.enum(['text', 'voice']);
export type FeedbackInputMethod = z.infer<typeof FeedbackInputMethodSchema>;

export const CreateFeedbackSchema = z.object({
  text: z.string().trim().min(1).max(FEEDBACK_TEXT_MAX),
  // 말로 한 번이라도 입력했으면 voice
  inputMethod: FeedbackInputMethodSchema,
  // 보낸 화면 (탭 이름). 사람을 알 수 있는 값은 넣지 않는다
  page: z
    .string()
    .regex(/^[a-zA-Z-]{1,30}$/)
    .optional(),
  // 보낼 때 받는 동의 (방침 2026-11-06). true가 아니면 저장하지 않는다
  agreed: z.literal(true),
});
export type CreateFeedback = z.infer<typeof CreateFeedbackSchema>;
