// app/lib/schemas/shelves.ts
// 선반 보기 베타 API 계약 (app/api/fridges/[id]/shelves)

import { z } from 'zod';
import { CategorySchema } from '@/app/lib/schemas/item';

const CountSchema = z.number().int().min(1).max(7);

export const ShelfSettingsSchema = z.object({
  // 이 냉장고에서 선반 보기가 켜져 있는지 (냉장고 가족 모두 같음)
  enabled: z.boolean(),
  // 내가 켜고 끌 수 있는지 (이 냉장고 가족이고, 냉장고 주인이 실험 허용 목록에 있을 때)
  canToggle: z.boolean(),
  // 이 냉장고에서 내 역할과 들어온 순서 (주인이 1). 누가 바꾸는지 나눠 보기 위해 이벤트에 함께 보낸다
  myRole: z.enum(['owner', 'member']),
  myJoinRank: z.number().int().min(1),
  // 마지막으로 바꾼 사람. 모두에게 적용되는 설정이라 누가 바꿨는지 보여 준다 (한 번도 안 바꿨으면 null)
  lastChange: z
    .object({
      name: z.string().nullable(),
      enabled: z.boolean(),
      at: z.coerce.date(),
    })
    .nullable(),
  counts: z.object({
    fridge: CountSchema,
    freezer: CountSchema,
    pantry: CountSchema,
  }),
});

export const ChangeShelfCountSchema = z.object({
  category: CategorySchema,
  action: z.enum(['add', 'remove']),
});

export const SetShelfViewSchema = z.object({
  enabled: z.boolean(),
});

export type ShelfSettings = z.infer<typeof ShelfSettingsSchema>;
