'use client';

// app/components/ExpiryDateSetting.tsx
// 유통기한 알림 설정 메인 컴포넌트 (Hooks 순서 보장 + 타입 강화 + 주석 보강)

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  MouseEvent,
  ChangeEvent,
} from 'react';
import { X, Bell, CalendarClock, CalendarCheck } from 'lucide-react';
import { mockItems } from '@/app/data/mockItems';

// --- NotificationService 타입 선언 (실제 구현 시그니처와 맞춰주세요)
// - 외부 서비스(클라이언트/서비스 워커/서버)에 알림 스케줄링을 위임한다는 가정
// - sendTestNotification은 구현에 따라 sync/async 모두 가능하여 union으로 타입 정의
interface NotificationService {
  scheduleNotification: (
    itemId: number,
    title: string,
    expiryDate: Date,
    daysBefore: number,
    timeHHmm: string,
  ) => Promise<void>;
  sendTestNotification: () => void | Promise<void>;
}

// import 시 타입 단언 (없으면 undefined 가능)
// - 실제 구현이 default export가 아닐 수 있어 unknown → union 단언
import _notificationService from '@/app/lib/services/NotificationService';
const notificationService = _notificationService as unknown as
  | NotificationService
  | undefined;

// ==========================================
//                타입 정의
// ==========================================

interface ExpiryDateSettingProps {
  // ==========================================
  //          유통기한 날짜 선택 컴포넌트
  // ==========================================
  isOpen: boolean; // 모달 오픈 여부
  onClose: () => void; // 닫기 핸들러 (모달 바깥 클릭/저장 후 호출)
  itemId: number | null; // 대상 아이템 식별자
  itemName: string; // 대상 아이템 이름 (알림 본문)
}

interface ExpiryDatePickerProps {
  selectedMonth: string;
  selectedDay: string;
  selectedYear: string;
  onMonthChange: (month: string) => void;
  onDayChange: (day: string) => void;
  onYearChange: (year: string) => void;
  hasDateSelected: boolean;
  onDateSelected: (selected: boolean) => void;
  /** 오늘로부터 남은 권장 섭취 일수 (mockItems 기준 파생) */
  recommendedDays: number;
}

interface NotificationTimeSettingProps {
  notificationTime: string; // "HH:mm"
  onTimeChange: (time: string) => void;
  hasTimeSelected: boolean;
  onTimeSelected: (selected: boolean) => void;
}

// ==========================================
//          유틸 함수/상수 (컴포넌트 외부)
//          - 재사용/테스트 용이, 렌더마다 재생성 방지
// ==========================================

// 남은 일수에 따른 동적 알림 옵션 구성
const getAvailableAlertOptions = (
  daysRemaining: number,
): ReadonlyArray<string> => {
  if (daysRemaining >= 14) return ['당일', '1일전', '3일전', '7일전'] as const;
  if (daysRemaining >= 7) return ['당일', '1일전', '3일전'] as const;
  if (daysRemaining >= 5) return ['당일', '1일전', '3일전'] as const;
  if (daysRemaining >= 3) return ['당일', '1일전'] as const;
  if (daysRemaining >= 1) return ['당일'] as const;
  return ['당일'] as const;
};

// UI 라벨 → 실제 일수 변환
const calcDaysBefore = (label: string): number => {
  switch (label) {
    case '1일전':
      return 1;
    case '3일전':
      return 3;
    case '7일전':
      return 7;
    case '당일':
    default:
      return 0;
  }
};

// 2자리 zero-padding
const pad2 = (v: string | number) => String(v).padStart(2, '0');

// ==========================================
//          하위 컴포넌트: 날짜 선택
// ==========================================

const ExpiryDatePicker: React.FC<ExpiryDatePickerProps> = ({
  selectedMonth,
  selectedDay,
  selectedYear,
  onMonthChange,
  onDayChange,
  onYearChange,
  hasDateSelected,
  onDateSelected,
  recommendedDays,
}) => {
  // YYYY-MM-DD 포맷터
  const formatDate = (year: string, month: string, day: string): string =>
    year && month && day ? `${year}-${pad2(month)}-${pad2(day)}` : '';

  // 입력 컨트롤 표시 값 (상위 상태와 동기화)
  const [dateValue, setDateValue] = useState<string>(() =>
    hasDateSelected ? formatDate(selectedYear, selectedMonth, selectedDay) : '',
  );

  // 유효성 메시지 (권장기간 초과 등)
  const [validationMessage, setValidationMessage] = useState<string>('');

  // min/max 범위 (메모이즈: 렌더당 재계산 방지)
  const today = useMemo<string>(
    () => new Date().toISOString().split('T')[0],
    [],
  );
  const maxDateString = useMemo<string>(() => {
    const max = new Date();
    max.setFullYear(max.getFullYear() + 5);
    return max.toISOString().split('T')[0];
  }, []);

  // 날짜 변경 핸들러
  // - 권장 섭취 기간 + 2일까지 허용 (UX 정책)
  // - 상위 연/월/일 상태 업데이트 및 선택 유무 토글
  const handleDateChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;

      if (!newDate) {
        // 선택 해제
        setDateValue('');
        onDateSelected(false);
        setValidationMessage('');
        return;
      }

      // 오늘로부터의 일수 계산
      const selected = new Date(newDate);
      const base = new Date();
      base.setHours(0, 0, 0, 0);

      const diffTime = selected.getTime() - base.getTime();
      const daysFromToday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 권장기간 초과 방지: recommendedDays + 2 초과 시 거부
      if (daysFromToday > recommendedDays + 2) {
        setValidationMessage(
          `권장 섭취 유통기간이 ${recommendedDays}일 입니다. 해당 기간 안에서 설정해주세요.`,
        );
        setDateValue('');
        onDateSelected(false);
        // 잠시 후 안내 메시지 자동 해제
        window.setTimeout(() => setValidationMessage(''), 3000);
        return;
      }

      // 정상 입력 처리
      setDateValue(newDate);
      setValidationMessage('');

      // 상위 상태(연/월/일) 업데이트
      const [year, month, day] = newDate.split('-');
      onYearChange(year);
      onMonthChange(String(parseInt(month, 10)));
      onDayChange(String(parseInt(day, 10)));
      onDateSelected(true);
    },
    [onDateSelected, onDayChange, onMonthChange, onYearChange, recommendedDays],
  );

  // 상위 prop 변화 시 date input 동기화
  useEffect(() => {
    if (hasDateSelected && selectedYear && selectedMonth && selectedDay) {
      setDateValue(formatDate(selectedYear, selectedMonth, selectedDay));
    } else {
      setDateValue('');
    }
  }, [hasDateSelected, selectedDay, selectedMonth, selectedYear]);

  return (
    <div className="mb-6">
      <h3 className="text-md mb-3 flex items-center gap-2 border-t border-gray-200 pt-4 text-start font-medium">
        식재료 유통기한 설정
      </h3>

      <div className="space-y-3">
        {/* Native Date Input: 접근성/모바일 키패드 이점 */}
        <div className="relative">
          <input
            type="date"
            value={dateValue}
            onChange={handleDateChange}
            min={today}
            max={maxDateString}
            placeholder="날짜 선택"
            className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium shadow-sm transition-all duration-200 hover:bg-gray-100 focus:border-[#6B46C1] focus:ring-1 focus:ring-[#6B46C1] focus:outline-none"
            aria-label="유통기한 날짜 선택"
          />
        </div>

        {/* 유효성 검사 경고 메시지: 초과 설정 차단 피드백 */}
        {!!validationMessage && (
          <div className="animate-pulse rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-600">
              ⚠️ {validationMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
//          하위 컴포넌트: 시간 선택
// ==========================================

const NotificationTimeSetting: React.FC<NotificationTimeSettingProps> = ({
  notificationTime,
  onTimeChange,
  hasTimeSelected,
  onTimeSelected,
}) => {
  // time input 내부 표시값
  const [timeValue, setTimeValue] = useState<string>(
    hasTimeSelected ? notificationTime : '',
  );

  // 시간 변경 핸들러 (HH:mm)
  const handleTimeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newTime = e.target.value;
      setTimeValue(newTime);
      onTimeChange(newTime);
      onTimeSelected(Boolean(newTime));
    },
    [onTimeChange, onTimeSelected],
  );

  // 한국어 시각 문자열 (오전/오후 h시 m분)
  const koreanTime = useMemo<string>(() => {
    if (!timeValue) return '시간을 선택해주세요';
    const [h, m] = timeValue.split(':');
    const hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    const period = hour >= 12 ? '오후' : '오전';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${period} ${displayHour}시 ${minute}분`;
  }, [timeValue]);

  // 상위 prop 변경 시 동기화
  useEffect(() => {
    setTimeValue(hasTimeSelected ? notificationTime : '');
  }, [hasTimeSelected, notificationTime]);

  return (
    <div className="mb-6">
      <h3 className="text-md mb-3 flex items-center gap-2 border-t border-gray-200 pt-4 text-start font-medium">
        알림 시간 설정
      </h3>

      <div className="space-y-3">
        {/* Native Time Input */}
        <div className="relative">
          <input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-medium shadow-sm transition-all duration-200 hover:bg-gray-100 focus:border-[#6B46C1] focus:ring-2 focus:ring-[#6B46C1] focus:outline-none"
            aria-label="알림 시간 선택"
          />
        </div>

        {/* 선택된 시간 요약 배지 */}
        {hasTimeSelected && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2">
            <p className="text-sm font-medium text-purple-900">
              매일 {koreanTime}에 알림
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
//              메인 컴포넌트
// ==========================================

const ExpiryDateSetting: React.FC<ExpiryDateSettingProps> = ({
  isOpen,
  onClose,
  itemId,
  itemName,
}) => {
  // ✅ 훅은 조건문 밖에서 항상 동일한 순서로 호출되어야 함 (규칙 준수)
  // - isOpen에 따라 렌더만 분기 (return null), 훅 호출은 그대로 유지

  // mockItems 기반 기본 날짜/남은 일수 계산
  // - useMemo로 파생값 캐싱 (itemId 변경 시만 재계산)
  const itemData = useMemo(() => {
    if (!itemId) {
      const now = new Date();
      return {
        year: String(now.getFullYear()),
        month: String(now.getMonth() + 1),
        day: String(now.getDate()),
        daysRemaining: 7, // 기본 보수적 값
      };
    }
    const item = mockItems.find(it => it.id === itemId);
    if (item) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(item.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const diff = expiry.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return {
        year: String(expiry.getFullYear()),
        month: String(expiry.getMonth() + 1),
        day: String(expiry.getDate()),
        daysRemaining,
      };
    }
    // itemId는 있으나 mock에서 못 찾은 경우: 오늘 기준 기본값
    const now = new Date();
    return {
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1),
      day: String(now.getDate()),
      daysRemaining: 7,
    };
  }, [itemId]);

  // -------------------------------
  // 상태 정의 (항상 같은 순서로 선언)
  // -------------------------------

  // 자동 설정 모드 (mock 기반)
  const [useAutoSettings, setUseAutoSettings] = useState<boolean>(true);

  // 남은 일수 기반 알림 옵션
  const ALERT_TIMING_OPTIONS = useMemo<ReadonlyArray<string>>(
    () => getAvailableAlertOptions(itemData.daysRemaining),
    [itemData.daysRemaining],
  );

  // 알림 타이밍 기본값: 3일전 > 1일전 > 당일 우선
  const [selectedBeforeDays, setSelectedBeforeDays] = useState<string>(
    ALERT_TIMING_OPTIONS.includes('3일전')
      ? '3일전'
      : ALERT_TIMING_OPTIONS.includes('1일전')
        ? '1일전'
        : '당일',
  );

  // 날짜/시간 상태 (자동 모드 기준 기본값으로 세팅)
  const [selectedMonth, setSelectedMonth] = useState<string>(itemData.month);
  const [selectedDay, setSelectedDay] = useState<string>(itemData.day);
  const [selectedYear, setSelectedYear] = useState<string>(itemData.year);
  const [hasDateSelected, setHasDateSelected] = useState<boolean>(true);

  const [notificationTime, setNotificationTime] = useState<string>('09:00');
  const [hasTimeSelected, setHasTimeSelected] = useState<boolean>(true);

  // itemData가 바뀔 때, 자동 모드에서는 화면 값 동기화
  useEffect(() => {
    if (!useAutoSettings) return;
    setSelectedYear(itemData.year);
    setSelectedMonth(itemData.month);
    setSelectedDay(itemData.day);
    setHasDateSelected(true);
    setNotificationTime('09:00');
    setHasTimeSelected(true);
  }, [itemData, useAutoSettings]);

  // 표시용 파생값 (자동 모드/직접 모드 분기)
  const displayYear = useAutoSettings ? itemData.year : selectedYear;
  const displayMonth = useAutoSettings ? itemData.month : selectedMonth;
  const displayDay = useAutoSettings ? itemData.day : selectedDay;
  const displayTime = useAutoSettings ? '09:00' : notificationTime;

  // 저장 가능 여부 (자동 모드 또는 직접 모드에서 날짜/시간 모두 선택)
  const canSave = useMemo<boolean>(
    () => useAutoSettings || (hasDateSelected && hasTimeSelected),
    [useAutoSettings, hasDateSelected, hasTimeSelected],
  );

  // 자동/직접 토글
  // - next가 true(자동)면 mock값 재적용, false(직접)면 입력 초기화
  const handleToggleAutoSettings = useCallback(() => {
    setUseAutoSettings(prev => {
      const next = !prev;
      if (next) {
        // 직접 → 자동
        setSelectedYear(itemData.year);
        setSelectedMonth(itemData.month);
        setSelectedDay(itemData.day);
        setHasDateSelected(true);
        setNotificationTime('09:00');
        setHasTimeSelected(true);
      } else {
        // 자동 → 직접
        setSelectedYear('');
        setSelectedMonth('');
        setSelectedDay('');
        setHasDateSelected(false);
        setNotificationTime('');
        setHasTimeSelected(false);
      }
      return next;
    });
  }, [itemData.day, itemData.month, itemData.year]);

  // 모달 바깥 영역 클릭 시 닫기
  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  // 선택한 타이밍 기준 알림 날짜 계산 (요약 영역 표시용)
  const getNotificationDate = useCallback((): string => {
    if (!displayYear || !displayMonth || !displayDay)
      return '날짜를 선택해주세요';
    const expiryDate = new Date(
      `${displayYear}-${pad2(displayMonth)}-${pad2(displayDay)}`,
    );
    const notificationDate = new Date(expiryDate);
    const minus = calcDaysBefore(selectedBeforeDays);
    notificationDate.setDate(expiryDate.getDate() - minus);
    return notificationDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [displayDay, displayMonth, displayYear, selectedBeforeDays]);

  // 저장(알림 스케줄 등록) 핸들러
  // - 외부 notificationService 유무/시그니처 검증
  // - 실패 시 콘솔 로깅, 성공/실패와 관계없이 finally에서 모달 닫기
  const handleSave = useCallback(async () => {
    if (!itemId || !displayYear || !displayMonth || !displayDay) return;

    const expiryDate = new Date(
      `${displayYear}-${pad2(displayMonth)}-${pad2(displayDay)}`,
    );
    const daysBefore = calcDaysBefore(selectedBeforeDays);
    const time = displayTime || '09:00';

    try {
      if (notificationService?.scheduleNotification) {
        await notificationService.scheduleNotification(
          itemId,
          itemName,
          expiryDate,
          daysBefore,
          time,
        );
      } else {
        console.error(
          'NotificationService is not initialized or missing scheduleNotification.',
        );
      }
      // TODO: 필요한 경우 서버 저장 API 연동
      // await api.saveExpiryNotification({...})
    } catch (err) {
      console.error('알림 예약 실패:', err);
    } finally {
      onClose();
    }
  }, [
    displayDay,
    displayMonth,
    displayTime,
    displayYear,
    itemId,
    itemName,
    onClose,
    selectedBeforeDays,
  ]);

  // ==========================================
  //                  렌더링
  // ==========================================
  // ⚠️ 훅은 이미 모두 호출됨. isOpen으로 렌더만 분기(안전)
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="expiry-modal-title"
    >
      <div className="h-auto max-h-[90vh] w-full max-w-md overflow-hidden overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <h2
              id="expiry-modal-title"
              className="text-lg font-semibold text-[#121212]"
            >
              {itemName} 알림 설정
            </h2>
            <button
              onClick={onClose}
              className="ml-auto p-1 text-gray-500 hover:text-gray-600"
              aria-label="닫기"
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-4 py-5">
          {/* 토글: 자동 설정 vs 직접 설정 */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                권장 유통기간 날짜/시간으로 자동 설정
              </span>
              <button
                onClick={handleToggleAutoSettings}
                className={`relative inline-flex h-6 w-11 items-center rounded-full shadow-sm transition-colors ${
                  useAutoSettings ? 'bg-[#6B46C1]' : 'bg-gray-200'
                }`}
                type="button"
                aria-pressed={useAutoSettings}
                aria-label="자동 설정 토글"
              >
                {/* 토글 핸들: Tailwind translate 클래스는 고정 폭 기준으로 조정 */}
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    useAutoSettings ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 자동 모드 설명 배지 */}
            {useAutoSettings && (
              <div className="rounded-xl border border-gray-200 p-4 text-sm shadow-sm">
                <p className="text-xs text-[#121212]">
                  권장 유통기간으로 자동 설정하는 모드입니다.
                </p>
              </div>
            )}
          </div>

          {/* 직접 설정 모드 (자동 설정이 꺼져있을 때만 표시) */}
          {!useAutoSettings && (
            <>
              {/* 알림 타이밍 옵션 */}
              <div className="mb-6">
                <h3 className="text-md mb-3 flex items-center gap-2 font-medium">
                  알림 타이밍
                </h3>
                <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                  {ALERT_TIMING_OPTIONS.map(option => (
                    <button
                      key={option}
                      onClick={() => setSelectedBeforeDays(option)}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        selectedBeforeDays === option
                          ? 'bg-white text-[#6B46C1] shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                      aria-pressed={selectedBeforeDays === option}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* 유통기한 설정 */}
              <ExpiryDatePicker
                selectedMonth={selectedMonth}
                selectedDay={selectedDay}
                selectedYear={selectedYear}
                onMonthChange={setSelectedMonth}
                onDayChange={setSelectedDay}
                onYearChange={setSelectedYear}
                hasDateSelected={hasDateSelected}
                onDateSelected={setHasDateSelected}
                recommendedDays={itemData.daysRemaining}
              />

              {/* 알림 시간 설정 */}
              <NotificationTimeSetting
                notificationTime={notificationTime}
                onTimeChange={setNotificationTime}
                hasTimeSelected={hasTimeSelected}
                onTimeSelected={setHasTimeSelected}
              />
            </>
          )}

          {/* 자동 설정 모드: 타이밍만 선택 가능 (날짜/시간은 고정) */}
          {useAutoSettings && (
            <div className="mb-3">
              <h3 className="text-md mb-3 flex items-center gap-2 font-medium">
                <Bell size={18} className="text-[#6B46C1]" />
                알림 타이밍
              </h3>
              <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                {ALERT_TIMING_OPTIONS.map(option => (
                  <button
                    key={option}
                    onClick={() => setSelectedBeforeDays(option)}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedBeforeDays === option
                        ? 'bg-white text-[#6B46C1] shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    aria-pressed={selectedBeforeDays === option}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 알림 테스트: 서비스가 준비되지 않은 경우 콘솔 에러 */}
          <button
            onClick={async () => {
              try {
                await notificationService?.sendTestNotification?.();
              } catch (e) {
                console.error('알림 테스트 실패:', e);
              }
            }}
            className="mb-4 w-full rounded-xl bg-purple-100 py-2 text-sm text-purple-700 transition-colors hover:bg-purple-200"
            type="button"
          >
            🔔 알림 테스트
          </button>

          {/* 설정 요약: 사용자가 선택한 최종 결과 프리뷰 */}
          <div className="mb-6 rounded-xl border border-gray-200 p-4 text-sm shadow-sm">
            <h4 className="text-md mb-3 font-semibold text-gray-700">
              식재료 권장 섭취기간 설정
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              {/* 유통기한 */}
              <div className="flex items-start gap-2">
                <div className="pt-0.5">
                  <CalendarCheck color="#101828" strokeWidth={2} size={15} />
                </div>
                <div>
                  <span className="font-medium text-gray-900">유통기한:</span>
                  <br />
                  {displayYear && displayMonth && displayDay ? (
                    `${displayYear}년 ${parseInt(displayMonth, 10)}월 ${parseInt(displayDay, 10)}일`
                  ) : (
                    <span className="text-gray-400">미설정</span>
                  )}
                </div>
              </div>

              {/* 알림 날짜 (타이밍 반영) */}
              <div className="flex items-start gap-2">
                <div className="pt-0.5">
                  <Bell color="#101828" strokeWidth={2} size={15} />
                </div>
                <div>
                  <span className="font-medium text-gray-900">알림 날짜:</span>
                  <br />
                  {displayYear && displayMonth && displayDay ? (
                    <>
                      {getNotificationDate()} ({selectedBeforeDays})
                    </>
                  ) : (
                    <span className="text-gray-400">미설정</span>
                  )}
                </div>
              </div>

              {/* 알림 시간 */}
              <div className="flex items-start gap-2">
                <div className="pt-0.5">
                  <CalendarClock color="#101828" strokeWidth={2} size={15} />
                </div>
                <div>
                  <span className="font-medium text-gray-900">알림 시간:</span>
                  <br />
                  {displayTime ? (
                    `매일 ${displayTime}`
                  ) : (
                    <span className="text-gray-400">미설정</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 저장 버튼: canSave 조건으로 활성/비활성 관리 */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full rounded-xl py-3 font-medium text-white shadow-sm transition-all duration-200 active:scale-[0.98] ${
              !canSave
                ? 'cursor-not-allowed bg-gray-400 shadow-sm'
                : 'bg-[#6B46C1] hover:bg-[#5a3aa0]'
            }`}
            aria-label="설정 저장"
            type="button"
          >
            알림 설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpiryDateSetting;
