// app/lib/schemas/recognize.ts
// 사진으로 식재료 찾기 API 계약

import { z } from 'zod';
import { CategorySchema } from '@/app/lib/schemas/item';

// 브라우저가 긴 쪽 1568px JPEG로 줄여 보낸다. 줄이지 못한 큰 사진도 서버 요청 한도(4.5MB) 안에 들도록 자른다
export const MAX_IMAGE_BASE64_LENGTH = 4_000_000;

export const RecognizeRequestSchema = z.object({
  // data: 접두어 없는 base64 본문
  image: z
    .string()
    .min(1)
    .max(MAX_IMAGE_BASE64_LENGTH)
    .regex(/^[A-Za-z0-9+/]+=*$/),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export const RecognizedItemSchema = z.object({
  name: z.string(),
  category: CategorySchema,
  quantity: z.number().int().min(1),
});

export const RecognizeResponseSchema = z.object({
  items: z.array(RecognizedItemSchema),
});

export type RecognizedItem = z.infer<typeof RecognizedItemSchema>;
