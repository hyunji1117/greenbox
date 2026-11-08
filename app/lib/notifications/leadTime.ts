// app/lib/notifications/leadTime.ts
// 하루 요약에 품목을 넣기 시작하는 날. 보관 기간이 길수록 미리 알린다
// 3일 이하는 당일 아침, 4~14일은 1일 전, 15~60일은 3일 전, 60일 넘으면 7일 전
// 보관 기간은 등록한 날부터 유통기한까지로 센다 (자동 작성과 직접 입력 모두 같은 기준)

const LEAD_STEPS: { maxPeriod: number; lead: number }[] = [
  { maxPeriod: 3, lead: 0 },
  { maxPeriod: 14, lead: 1 },
  { maxPeriod: 60, lead: 3 },
];

export const MAX_LEAD_DAYS = 7;

export function leadDays(periodDays: number): number {
  return (
    LEAD_STEPS.find(step => periodDays <= step.maxPeriod)?.lead ?? MAX_LEAD_DAYS
  );
}

export interface LeadItem {
  daysLeft: number;
  periodDays: number;
}

// 오늘이 알림 시작일 이후이고 아직 유통기한이 지나지 않았으면 하루 요약에 넣는다
export function isDueForDaily(item: LeadItem): boolean {
  return item.daysLeft >= 0 && item.daysLeft <= leadDays(item.periodDays);
}
