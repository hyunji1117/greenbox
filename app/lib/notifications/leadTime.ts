// app/lib/notifications/leadTime.ts
// 하루 요약에 품목을 넣기 시작하는 날
// - 기본: 유통기한 3일 안이면 모두 넣는다 (홈 "바로 꺼내기"와 같은 기준. 짧게 두는 품목일수록 빨리 먹어야 해서)
// - 60일 넘게 두는 품목(주로 냉동)은 꺼내서 해동할 시간이 필요해 7일 전부터 미리 넣는다
// 보관 기간은 등록한 날부터 유통기한까지로 센다 (자동 작성과 직접 입력 모두 같은 기준)
// 26.11.09: 짧게 두는 품목을 더 늦게(당일, 1일 전) 알리던 기준 때문에 바로 꺼내기에 보이는 품목이 알림에서 빠져 바꿨다

import { EXPIRY_SOON_DAYS } from '@/app/lib/items/expiry';

// 이보다 오래 두는 품목은 미리 알린다
export const LONG_STORAGE_DAYS = 60;
export const MAX_LEAD_DAYS = 7;

export function leadDays(periodDays: number): number {
  return periodDays > LONG_STORAGE_DAYS ? MAX_LEAD_DAYS : EXPIRY_SOON_DAYS;
}

export interface LeadItem {
  daysLeft: number;
  periodDays: number;
}

// 오늘이 알림 시작일 이후이고 아직 유통기한이 지나지 않았으면 하루 요약에 넣는다
export function isDueForDaily(item: LeadItem): boolean {
  return item.daysLeft >= 0 && item.daysLeft <= leadDays(item.periodDays);
}
