// app/lib/schemas/shelves.ts
// 선반 보기 베타 API 계약 (app/api/fridges/[id]/shelves)

import { z } from 'zod';
import { CategorySchema } from '@/app/lib/schemas/item';

const CountSchema = z.number().int().min(1).max(7);

export const ShelfSettingsSchema = z.object({
  // 이 냉장고에서 선반 보기가 켜져 있는지 (냉장고 가족 모두 같음)
  enabled: z.boolean(),
  // 내가 켜고 끌 수 있는지 (냉장고 주인이면서 실험 허용 목록에 있을 때)
  canToggle: z.boolean(),
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
