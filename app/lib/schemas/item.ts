// app/lib/schemas/item.ts
// 냉장고 품목 API 계약. 서버는 요청 스키마로, 클라이언트는 응답 스키마로 검증한다.
// 응답 스키마는 JSON 문자열 날짜를 Date로 바꿔서 화면 타입과 맞춘다.

import { z } from 'zod';

export const CategorySchema = z.enum(['fridge', 'freezer', 'pantry']);

// DB 제약(0004_items.sql)과 같은 범위
export const ITEM_NAME_MAX = 50;
export const QUANTITY_MAX = 99;
export const COMMENT_TEXT_MAX = 200;

const isoDateTime = z.iso.datetime().transform(value => new Date(value));

// 선반 번호. DB 제약(0015)과 app/lib/shelves/rules.ts의 MAX_SHELF_COUNT와 같은 범위
export const ShelfSchema = z.number().int().min(1).max(7);

// ---------- 응답 ----------
// 품목을 넣은 사람과 댓글 작성자. 탈퇴하면 id와 이름이 비고, 냉장고에서 나갔으면 isMember가 false
export const PersonSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
  isMember: z.boolean(),
});

export const CommentSchema = z.object({
  id: z.string(),
  text: z.string(),
  author: PersonSchema,
  createdAt: isoDateTime,
  // 고친 적이 없으면 null. 이 필드를 보내기 전의 서버 응답도 받을 수 있게 비어 있어도 된다
  editedAt: isoDateTime.nullish().transform(value => value ?? null),
});

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: CategorySchema,
  quantity: z.number().int().min(1),
  // 개수별로 먹음 처리한 수. 남은 수량은 quantity - eatenQuantity (이 필드를 보내기 전의 응답은 0)
  eatenQuantity: z.number().int().min(0).default(0),
  addedBy: PersonSchema,
  addedAt: isoDateTime,
  comments: z.array(CommentSchema),
  finished: z.boolean(),
  // 서버는 없으면 null을 보내고, 화면은 기존처럼 optional로 다룬다
  expiryDate: z.iso
    .date()
    .nullable()
    .transform(value => value ?? undefined),
  // 보는 사람의 관심 품목인지 (종 버튼). 이 필드를 보내기 전의 서버 응답은 false로 읽는다
  watched: z.boolean().default(false),
  // 선반 보기 베타의 선반 번호(1이 맨 위). 정하지 않았거나 이 필드를 보내기 전의 응답은 null
  shelf: ShelfSchema.nullish().transform(value => value ?? null),
  // 마지막으로 바뀐 때. 통계의 다 먹은 음식과 버린 음식을 최근 순으로 놓는다. 이 필드를 보내기 전의 응답은 null
  updatedAt: isoDateTime.nullish().transform(value => value ?? null),
});

export const ItemListSchema = z.array(ItemSchema);

// ---------- 요청 ----------
// BIGINT 범위를 넘는 값이 DB 오류가 되지 않도록 자릿수를 제한한다
export const ItemIdSchema = z.string().regex(/^\d{1,18}$/);
export const FridgeIdSchema = ItemIdSchema;

// 넣은 사람과 작성자는 받지 않는다. 서버가 로그인 사용자로 기록한다 (보내도 무시)
export const CreateItemSchema = z.object({
  name: z.string().trim().min(1).max(ITEM_NAME_MAX),
  category: CategorySchema,
  quantity: z.number().int().min(1).max(QUANTITY_MAX),
  expiryDate: z.iso.date().optional(),
  // 선반 보기에서 그 선반을 열고 넣으면 그 선반에 바로 놓는다
  shelf: ShelfSchema.optional(),
});

// 어느 냉장고에 넣을지는 요청마다 밝힌다. 다른 탭에서 냉장고를 바꿔도 보던 냉장고에 들어가게 한다
export const CreateItemRequestSchema = CreateItemSchema.extend({
  fridgeId: FridgeIdSchema,
});

export const UpdateItemSchema = CreateItemSchema.partial()
  .extend({
    finished: z.boolean().optional(),
    eatenQuantity: z.number().int().min(0).max(QUANTITY_MAX).optional(),
    // null이면 선반에서 빼서 "선반 미정"으로 둔다
    shelf: ShelfSchema.nullable().optional(),
  })
  .refine(value => Object.keys(value).length > 0, {
    message: '바꿀 항목이 없습니다',
  });

export const CreateCommentSchema = z.object({
  text: z.string().trim().min(1).max(COMMENT_TEXT_MAX),
});

// 댓글 수정은 내용만 바꾼다
export const UpdateCommentSchema = CreateCommentSchema;
export const CommentIdSchema = ItemIdSchema;

export type Person = z.output<typeof PersonSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Comment = z.output<typeof CommentSchema>;
export type Item = z.output<typeof ItemSchema>;
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type CreateItemRequest = z.infer<typeof CreateItemRequestSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
