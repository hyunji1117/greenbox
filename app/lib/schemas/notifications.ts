// app/lib/schemas/notifications.ts
// 알림 설정 API 계약. 서버는 요청 스키마로, 클라이언트는 응답 스키마로 검증한다
// 시각은 모두 한국 시간 기준 0~23시, 요일은 0(일요일)~6(토요일)

import { z } from 'zod';

// 냉장고별 알림 수준. 아직 고르지 않았으면 null이고 "관심 품목만"으로 다룬다
export const NotifyLevelSchema = z.enum(['all', 'watched', 'none']);
export type NotifyLevel = z.infer<typeof NotifyLevelSchema>;
export const DEFAULT_NOTIFY_LEVEL: NotifyLevel = 'watched';

const HourSchema = z.number().int().min(0).max(23);
const WeekdaySchema = z.number().int().min(0).max(6);

export const NotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  dailyHour: HourSchema,
  weeklyEnabled: z.boolean(),
  weeklyDay: WeekdaySchema,
  weeklyHour: HourSchema,
});
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;

// 가족 응답(26.11.06)으로 정한 기본값. 마이그레이션 0009의 DEFAULT와 같게 유지한다
// 하루 요약: 아침 8시 / 주간 요약: 토요일 12시 (주말 오후 장 보러 나가기 전)
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyHour: 8,
  weeklyEnabled: true,
  weeklyDay: 6,
  weeklyHour: 12,
};

export const NotificationSettingsResponseSchema = z.object({
  settings: NotificationSettingsSchema,
  // 한 번이라도 직접 저장했는지. 처음 묻는 화면에서 시각까지 물을지 정한다
  saved: z.boolean(),
});
export type NotificationSettingsResponse = z.infer<
  typeof NotificationSettingsResponseSchema
>;

export const UpdateNotificationSettingsSchema =
  NotificationSettingsSchema.partial().refine(
    value => Object.keys(value).length > 0,
    { message: '바꿀 항목이 없습니다' },
  );
export type UpdateNotificationSettings = z.infer<
  typeof UpdateNotificationSettingsSchema
>;

export const NotifyLevelRequestSchema = z.object({ level: NotifyLevelSchema });

export const WEEKDAY_LABELS = [
  '일',
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
] as const;

// 0 → 밤 12시, 9 → 오전 9시, 12 → 낮 12시, 17 → 오후 5시
export function hourLabel(hour: number): string {
  if (hour === 0) return '밤 12시';
  if (hour === 12) return '낮 12시';
  return hour < 12 ? `오전 ${hour}시` : `오후 ${hour - 12}시`;
}
