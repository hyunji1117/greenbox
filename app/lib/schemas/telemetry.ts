// app/lib/schemas/telemetry.ts
// 브라우저가 모아 보내는 성능 지표와 화면 오류. 누구의 기록인지는 담지 않는다

import { z } from 'zod';

export const VITAL_METRICS = ['LCP', 'CLS', 'INP', 'FCP', 'TTFB'] as const;
export const VITAL_RATINGS = ['good', 'needs-improvement', 'poor'] as const;
export const ERROR_KINDS = ['error', 'rejection', 'render'] as const;

// 화면 이름 (경로 또는 탭). 검색어나 초대 코드 같은 값은 담지 않는다
export const PageSchema = z
  .string()
  .regex(/^[a-z0-9/_-]{1,40}$/i, '화면 이름 형식이 아닙니다');

export const VitalSchema = z.object({
  metric: z.enum(VITAL_METRICS),
  value: z.number().min(0).max(600_000),
  rating: z.enum(VITAL_RATINGS),
  page: PageSchema,
  navigationType: z.string().max(20).optional(),
});

export const ClientErrorSchema = z.object({
  kind: z.enum(ERROR_KINDS),
  message: z.string().min(1).max(300),
  stack: z.string().max(2000).optional(),
  page: PageSchema,
});

// 한 번에 보내는 양을 제한한다 (화면 하나에서 나올 수 있는 만큼)
export const TelemetryBatchSchema = z
  .object({
    appVersion: z.string().min(1).max(20),
    vitals: z.array(VitalSchema).max(20).default([]),
    errors: z.array(ClientErrorSchema).max(10).default([]),
  })
  .refine(b => b.vitals.length + b.errors.length > 0, '보낼 기록이 없습니다');

export type Vital = z.infer<typeof VitalSchema>;
export type ClientError = z.infer<typeof ClientErrorSchema>;
export type TelemetryBatch = z.infer<typeof TelemetryBatchSchema>;
