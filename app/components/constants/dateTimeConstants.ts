// app/constants/dateTimeConstants.ts
// 날짜 및 시간 관련 공통 상수 및 유틸리티 함수

// ==========================================
//              알림 타이밍 옵션
// ==========================================
export const ALERT_TIMING_OPTIONS = [
  '당일',
  '1일전',
  '3일전',
  '7일전',
  '30일전',
  '90일전',
] as const;

export type AlertTiming = (typeof ALERT_TIMING_OPTIONS)[number];

// ==========================================
//                월 옵션
// ==========================================
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export type Month = (typeof MONTHS)[number];

// ==========================================
//              날짜/시간 생성 함수
// ==========================================

/**
 * 일 배열 생성 (1-31)
 * @returns {string[]} 1부터 31까지의 문자열 배열
 */
export const generateDays = (): string[] => {
  return Array.from({ length: 31 }, (_, i) => String(i + 1));
};

/**
 * 연도 배열 생성 (현재년도부터 n년)
 * @param {number} count - 생성할 연도 개수 (기본값: 5)
 * @returns {string[]} 현재년도부터 count년까지의 문자열 배열
 */
export const generateYears = (count: number = 5): string[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => String(currentYear + i));
};

/**
 * 시간 배열 생성 (00-23)
 * @returns {string[]} 00부터 23까지의 두 자리 문자열 배열
 */
export const generateHours = (): string[] => {
  return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
};

/**
 * 분 배열 생성 (00-59)
 * @returns {string[]} 00부터 59까지의 두 자리 문자열 배열
 */
export const generateMinutes = (): string[] => {
  return Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
};

// ==========================================
//              스타일 클래스
// ==========================================

/**
 * 공통 스타일 객체
 */
export const styles = {
  // 스크롤 컨테이너
  scrollContainer: 'h-40 overflow-y-auto rounded-lg bg-gray-50',

  /**
   * 선택 가능한 아이템 스타일
   * @param {boolean} isSelected - 선택 상태
   * @returns {string} 조건부 클래스 문자열
   */
  selectableItem: (isSelected: boolean): string =>
    `
    cursor-pointer px-4 py-3 text-center text-md transition-colors
    ${isSelected ? 'bg-gray-200 font-semibold' : 'text-gray-400 hover:bg-gray-100'}
  `.trim(),

  /**
   * 알림 타이밍 버튼 스타일
   * @param {boolean} isSelected - 선택 상태
   * @returns {string} 조건부 클래스 문자열
   */
  timingButton: (isSelected: boolean): string =>
    `
    flex-1 rounded-full py-2 text-sm transition-colors
    ${
      isSelected
        ? 'bg-white font-medium text-black shadow-sm'
        : 'text-gray-500 hover:bg-gray-50'
    }
  `.trim(),

  // 섹션 헤더
  sectionHeader:
    'sticky top-0 bg-[#d2c7ec] py-2 text-center text-black text-sm font-medium',
} as const;

// ==========================================
//              유틸리티 함수
// ==========================================

/**
 * 날짜 문자열 포맷팅
 * @param {string} year - 연도
 * @param {string} month - 월
 * @param {string} day - 일
 * @returns {string} YYYY-MM-DD 형식의 날짜 문자열
 */
export const formatDate = (
  year: string,
  month: string,
  day: string,
): string => {
  const monthIndex = MONTHS.indexOf(month as Month) + 1;
  const paddedMonth = String(monthIndex).padStart(2, '0');
  const paddedDay = day.padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
};

/**
 * 알림 시기를 일수로 변환
 * @param {string} timing - 알림 타이밍 문자열
 * @returns {number} 일수
 */
export const timingToDays = (timing: AlertTiming): number => {
  const mappings: Record<AlertTiming, number> = {
    당일: 0,
    '1일전': 1,
    '3일전': 3,
    '7일전': 7,
    '30일전': 30,
    '90일전': 90,
  };
  return mappings[timing] || 0;
};
