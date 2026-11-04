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
  members: z.array(FridgeMemberSchema),
});

export type FridgeMember = z.output<typeof FridgeMemberSchema>;
export type CurrentFridge = z.output<typeof CurrentFridgeSchema>;
