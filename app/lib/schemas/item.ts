// app/lib/schemas/item.ts
// 냉장고 품목 API 계약. 서버(요청 검증)와 클라이언트(응답 검증)가 같은 스키마를 쓴다.
// 응답 스키마는 JSON 문자열 날짜를 Date로 바꿔서 화면 타입과 맞춘다.

import { z } from 'zod';

export const FamilyMemberSchema = z.enum(['mom', 'dad', 'bigKid', 'littleKid']);
export const CategorySchema = z.enum(['fridge', 'freezer', 'pantry']);

// DB 제약(0004_items.sql)과 같은 범위
export const ITEM_NAME_MAX = 50;
export const QUANTITY_MAX = 99;
export const COMMENT_TEXT_MAX = 200;

const isoDateTime = z.iso.datetime().transform(value => new Date(value));

// ---------- 응답 ----------
export const CommentSchema = z.object({
  id: z.string(),
  text: z.string(),
  author: FamilyMemberSchema,
  createdAt: isoDateTime,
});

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: CategorySchema,
  quantity: z.number().int().min(1),
  addedBy: FamilyMemberSchema,
  addedAt: isoDateTime,
  comments: z.array(CommentSchema),
  finished: z.boolean(),
  // 서버는 없으면 null을 보내고, 화면은 기존처럼 optional로 다룬다
  expiryDate: z.iso
    .date()
    .nullable()
    .transform(value => value ?? undefined),
});

export const ItemListSchema = z.array(ItemSchema);

// ---------- 요청 ----------
// BIGINT 범위를 넘는 값이 DB 오류가 되지 않도록 자릿수를 제한한다
export const ItemIdSchema = z.string().regex(/^\d{1,18}$/);

export const CreateItemSchema = z.object({
  name: z.string().trim().min(1).max(ITEM_NAME_MAX),
  category: CategorySchema,
  quantity: z.number().int().min(1).max(QUANTITY_MAX),
  addedBy: FamilyMemberSchema,
  expiryDate: z.iso.date().optional(),
});

export const UpdateItemSchema = CreateItemSchema.omit({ addedBy: true })
  .partial()
  .extend({ finished: z.boolean().optional() })
  .refine(value => Object.keys(value).length > 0, {
    message: '바꿀 항목이 없습니다',
  });

export type FamilyMember = z.infer<typeof FamilyMemberSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Comment = z.output<typeof CommentSchema>;
export type Item = z.output<typeof ItemSchema>;
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;
