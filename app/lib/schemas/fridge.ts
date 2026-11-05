// app/lib/schemas/fridge.ts
// 냉장고 API 응답 계약. 서버 결과(app/lib/fridges/store.ts)가 이 스키마를 통과해야 한다

import { z } from 'zod';
import { NotifyLevelSchema } from '@/app/lib/schemas/notifications';

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
  hasCustomName: z.boolean(),
  role: FridgeRoleSchema,
  // 이 냉장고의 내 알림 수준. null이면 아직 고르지 않음 (이 필드가 없는 이전 응답도 null로 읽는다)
  myNotifyLevel: NotifyLevelSchema.nullish().transform(value => value ?? null),
  myUserId: z.string(),
  members: z.array(FridgeMemberSchema),
  pendingRequestCount: z.number().int().min(0),
  fridgeCount: z.number().int().min(1),
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
// 냉장고 이름은 "앞 이름 + 냉장고" 형식이다 (예: 본가 냉장고). 사용자는 앞 이름만 쓴다
// 앞 이름 길이는 호칭과 같게 둬서, 머리글에 한 줄로 들어간다 (360px 폭: 8자 + " 냉장고" = 212px)
export const FRIDGE_NAME_SUFFIX = '냉장고';
export const FRIDGE_LABEL_MAX = 8;

// 앞 이름에 "냉장고"까지 써도 두 번 붙지 않게 지운다
export function toFridgeLabel(input: string): string {
  return input
    .trim()
    .replace(new RegExp(`\\s*${FRIDGE_NAME_SUFFIX}$`), '')
    .trim();
}

export const toFridgeName = (label: string) =>
  `${toFridgeLabel(label)} ${FRIDGE_NAME_SUFFIX}`;

export const FridgeNameSchema = z.object({
  label: z
    .string()
    .transform(toFridgeLabel)
    .pipe(z.string().min(1).max(FRIDGE_LABEL_MAX)),
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
