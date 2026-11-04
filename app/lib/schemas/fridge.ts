// app/lib/schemas/fridge.ts
// 냉장고 API 응답 계약. 서버 결과(app/lib/fridges/store.ts)가 이 스키마를 통과해야 한다

import { z } from 'zod';

export const FridgeRoleSchema = z.enum(['owner', 'member']);

export const FridgeMemberSchema = z.object({
  userId: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  role: FridgeRoleSchema,
});

export const CurrentFridgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: FridgeRoleSchema,
  myUserId: z.string(),
  members: z.array(FridgeMemberSchema),
  pendingRequestCount: z.number().int().min(0),
});

export const MyFridgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: FridgeRoleSchema,
  memberCount: z.number().int().min(1),
});
export const MyFridgeListSchema = z.array(MyFridgeSchema);

export const InviteSchema = z.object({
  code: z.string(),
  expiresAt: z.iso.datetime(),
});
// 링크가 없으면 null
export const InviteResponseSchema = InviteSchema.nullable();

export const JoinRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export const JoinRequestListSchema = z.array(JoinRequestSchema);

// ---------- 요청 ----------
// 초대 코드: 24바이트 무작위 값을 주소용 문자로 바꾼 32자
export const INVITE_CODE_PATTERN = /^[A-Za-z0-9_-]{32}$/;
export const FRIDGE_NAME_MAX = 20;
export const FridgeNameSchema = z.object({
  name: z.string().trim().min(1).max(FRIDGE_NAME_MAX),
});
export const SwitchFridgeSchema = z.object({
  fridgeId: z.string().regex(/^\d{1,18}$/),
});
export const DecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
});

export type FridgeMember = z.output<typeof FridgeMemberSchema>;
export type CurrentFridge = z.output<typeof CurrentFridgeSchema>;
export type MyFridge = z.output<typeof MyFridgeSchema>;
export type Invite = z.output<typeof InviteSchema>;
export type JoinRequest = z.output<typeof JoinRequestSchema>;
