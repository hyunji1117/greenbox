// app/lib/notifications/schedule.ts
// 매시간 실행에서 "지금이 이 사람의 발송 시각인가"를 판단한다 (DB와 무관한 순수 함수)

// 한국은 일광 절약 시간이 없어 UTC+9로 고정한다
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface KoreaClock {
  // 한국 날짜 YYYY-MM-DD
  date: string;
  // 한국 시각 0~23
  hour: number;
  // 요일 0(일요일)~6(토요일)
  day: number;
}

export function koreaClock(now: Date): KoreaClock {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  return {
    date: kst.toISOString().slice(0, 10),
    hour: kst.getUTCHours(),
    day: kst.getUTCDay(),
  };
}

// 예약 실행은 늦거나 한 번 건너뛸 수 있다. 정한 시각부터 이 시간까지는 아직 안 보냈으면 보낸다
// (발송 기록으로 하루 1번만 보내므로 여러 번 실행돼도 중복되지 않는다)
export const CATCH_UP_HOURS = 2;

export function isDueHour(targetHour: number, currentHour: number): boolean {
  const passed = currentHour - targetHour;
  return passed >= 0 && passed <= CATCH_UP_HOURS;
}

// 정각에서 몇 분 늦게 실행됐는지. 예약 실행이 얼마나 늦는지 기록해 보기 위한 값
export function minutesPastHour(now: Date): number {
  return now.getUTCMinutes();
}
