// app/components/ExpiryDateSetting.tsx
// 유통기한 알림 설정 메인 컴포넌트

import React, { useState, useEffect } from 'react';
import { XIcon, Bell, CalendarClock, CalendarCheck } from 'lucide-react';
import { mockItems } from '@/app/data/mockItems';
import notificationService from '@/app/lib/services/NotificationService';

// ==========================================
//                타입 정의
// ==========================================

interface ExpiryDateSettingProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number | null;
  itemName: string;
}

// ==========================================
//              상수 정의
// ==========================================

// const ALERT_TIMING_OPTIONS = ['당일', '1일전', '3일전', '7일전'];

// ==========================================
//          유통기한 날짜 선택 컴포넌트
// ==========================================

interface ExpiryDatePickerProps {
  selectedMonth: string;
  selectedDay: string;
  selectedYear: string;
  onMonthChange: (month: string) => void;
  onDayChange: (day: string) => void;
  onYearChange: (year: string) => void;
  hasDateSelected: boolean;
  onDateSelected: (selected: boolean) => void;
  recommendedDays: number; // 권장 섭취 기간 (일수)
}

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
  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDate = (year: string, month: string, day: string): string => {
    if (!year || !month || !day) return '';
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  };

  const [dateValue, setDateValue] = useState(() =>
    hasDateSelected ? formatDate(selectedYear, selectedMonth, selectedDay) : '',
  );

  // 유효성 경고 메시지 상태
  const [validationMessage, setValidationMessage] = useState('');

  // 오늘 날짜와 최대 날짜 설정
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 5);
  const maxDateString = maxDate.toISOString().split('T')[0];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;

    if (newDate) {
      // 선택한 날짜 검증
      const selectedDate = new Date(newDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 오늘부터 선택한 날짜까지의 일수 계산
      const diffTime = selectedDate.getTime() - today.getTime();
      const daysFromToday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 권장 섭취 기간보다 2일 이상 초과하는지 확인
      if (daysFromToday > recommendedDays + 2) {
        setValidationMessage(
          `권장 섭취 유통기간이 ${recommendedDays}일 입니다. 해당 기간 안에서 설정해주세요.`,
        );
        // 날짜 선택 취소
        setDateValue('');
        onDateSelected(false);

        // 3초 후 메시지 제거
        setTimeout(() => {
          setValidationMessage('');
        }, 3000);
        return;
      }

      setDateValue(newDate);
      setValidationMessage('');

      const [year, month, day] = newDate.split('-');
      onYearChange(year);
      onMonthChange(parseInt(month).toString());
      onDayChange(parseInt(day).toString());
      onDateSelected(true);
    } else {
      setDateValue('');
      onDateSelected(false);
      setValidationMessage('');
    }
  };

  // Props 변경 시 날짜 업데이트
  useEffect(() => {
    if (hasDateSelected && selectedYear && selectedMonth && selectedDay) {
      const formattedDate = formatDate(
        selectedYear,
        selectedMonth,
        selectedDay,
      );
      setDateValue(formattedDate);
    } else {
      setDateValue('');
    }
  }, [selectedYear, selectedMonth, selectedDay, hasDateSelected]);

  return (
    <div className="mb-6">
      <h3 className="text-md mb-3 flex items-center gap-2 border-t border-gray-200 pt-4 text-start font-medium">
        식재료 유통기한 설정
      </h3>

      <div className="space-y-3">
        {/* Native Date Input */}
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

        {/* 유효성 검사 경고 메시지 */}
        {validationMessage && (
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
//          알림 시간 설정 컴포넌트
// ==========================================

interface NotificationTimeSettingProps {
  notificationTime: string;
  onTimeChange: (time: string) => void;
  hasTimeSelected: boolean;
  onTimeSelected: (selected: boolean) => void;
}

const NotificationTimeSetting: React.FC<NotificationTimeSettingProps> = ({
  notificationTime,
  onTimeChange,
  hasTimeSelected,
  onTimeSelected,
}) => {
  const [timeValue, setTimeValue] = useState(
    hasTimeSelected ? notificationTime : '',
  );

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    onTimeChange(newTime);
    onTimeSelected(!!newTime);
  };

  // 시간을 한국어 형식으로 표시
  const getKoreanTimeString = (): string => {
    if (!timeValue) return '시간을 선택해주세요';

    const [hour, minute] = timeValue.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? '오후' : '오전';
    const displayHour =
      hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;

    return `${period} ${displayHour}시 ${parseInt(minute)}분`;
  };

  useEffect(() => {
    if (hasTimeSelected) {
      setTimeValue(notificationTime);
    } else {
      setTimeValue('');
    }
  }, [notificationTime, hasTimeSelected]);

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

        {/* 선택된 시간 표시 */}
        {hasTimeSelected && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2">
            <p className="text-sm font-medium text-purple-900">
              매일 {getKoreanTimeString()}에 알림
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
  // ==========================================
  //            권장 섭취 기간 계산
  // ==========================================

  // mockItems에서 해당 아이템의 유통기한 데이터 가져오기
  const getItemExpiryData = () => {
    const item = mockItems.find(item => item.id === itemId);
    if (item) {
      // mockItems의 expiryDate는 현재 시간 + n일로 설정되어 있음
      // 현재 시간과의 차이를 계산하여 남은 일수 구하기
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        year: expiryDate.getFullYear().toString(),
        month: (expiryDate.getMonth() + 1).toString(),
        day: expiryDate.getDate().toString(),
        daysRemaining: daysRemaining,
      };
    }
    // 아이템을 찾지 못한 경우 기본값
    return {
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString(),
      day: new Date().getDate().toString(),
      daysRemaining: 7,
    };
  };

  const itemData = getItemExpiryData();

  // ==========================================
  //                  상태 관리
  // ==========================================

  // 자동 설정 모드 (기본값: true - 자동 설정)
  const [useAutoSettings, setUseAutoSettings] = useState(true);

  const getAvailableAlertOptions = (daysRemaining: number): string[] => {
    // 임시로 반환값을 하드코딩
    if (daysRemaining >= 14) {
      return ['당일', '1일전', '3일전', '7일전'];
    } else if (daysRemaining >= 7) {
      return ['당일', '1일전', '3일전'];
    } else if (daysRemaining >= 5) {
      return ['당일', '1일전', '3일전'];
    } else if (daysRemaining >= 3) {
      return ['당일', '1일전'];
    } else if (daysRemaining >= 1) {
      return ['당일'];
    } else {
      return ['당일'];
    }
  };
  // 동적 알림 옵션
  const ALERT_TIMING_OPTIONS = getAvailableAlertOptions(itemData.daysRemaining);

  // 알림 타이밍 상태 - 기본값 설정 (사용 가능한 옵션 중 첫 번째)
  const [selectedBeforeDays, setSelectedBeforeDays] = useState(
    ALERT_TIMING_OPTIONS.includes('3일전')
      ? '3일전'
      : ALERT_TIMING_OPTIONS.includes('1일전')
        ? '1일전'
        : '당일',
  );

  // 유통기한 날짜 상태 - 자동 설정 시 mockData 사용, 초기값 설정
  const [selectedMonth, setSelectedMonth] = useState(itemData?.month || '');
  const [selectedDay, setSelectedDay] = useState(itemData?.day || '');
  const [selectedYear, setSelectedYear] = useState(itemData?.year || '');
  const [hasDateSelected, setHasDateSelected] = useState(!!itemData);

  // 알림 시간 상태
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [hasTimeSelected, setHasTimeSelected] = useState(true);

  // 토글 전환 시 처리
  const handleToggleAutoSettings = () => {
    if (useAutoSettings) {
      // 자동 -> 직접 전환 시 값 초기화
      setSelectedYear('');
      setSelectedMonth('');
      setSelectedDay('');
      setHasDateSelected(false);
      setNotificationTime('');
      setHasTimeSelected(false);
    } else {
      // 직접 -> 자동 전환 시 mockData 값 설정
      if (itemData) {
        setSelectedYear(itemData.year);
        setSelectedMonth(itemData.month);
        setSelectedDay(itemData.day);
        setNotificationTime('09:00');
        setHasDateSelected(true);
        setHasTimeSelected(true);
      }
    }
    setUseAutoSettings(!useAutoSettings);
  };

  // ==========================================
  //              이벤트 핸들러
  // ==========================================

  // const handleSave = () => {
  //   const settings = {
  //     itemId,
  //     itemName,
  //     timing: selectedBeforeDays,
  //     expiryDate: {
  //       year: useAutoSettings && itemData ? itemData.year : selectedYear,
  //       month: useAutoSettings && itemData ? itemData.month : selectedMonth,
  //       day: useAutoSettings && itemData ? itemData.day : selectedDay,
  //       formatted: `${useAutoSettings && itemData ? itemData.year : selectedYear}-${(useAutoSettings && itemData ? itemData.month : selectedMonth).padStart(2, '0')}-${(useAutoSettings && itemData ? itemData.day : selectedDay).padStart(2, '0')}`,
  //     },
  //     notificationTime: useAutoSettings ? '09:00' : notificationTime,
  //     isAutoSet: useAutoSettings,
  //   };

  //   console.log('Saving notification settings:', settings);

  const handleSave = async () => {
    const settings = {
      itemId,
      itemName,
      timing: selectedBeforeDays,
      expiryDate: {
        year: useAutoSettings && itemData ? itemData.year : selectedYear,
        month: useAutoSettings && itemData ? itemData.month : selectedMonth,
        day: useAutoSettings && itemData ? itemData.day : selectedDay,
      },
      notificationTime: useAutoSettings ? '09:00' : notificationTime,
      isAutoSet: useAutoSettings,
    };

    // 알림 스케줄링 추가
    if (itemId && settings.expiryDate.year) {
      const expiryDate = new Date(
        `${settings.expiryDate.year}-${settings.expiryDate.month.padStart(2, '0')}-${settings.expiryDate.day.padStart(2, '0')}`,
      );

      const daysBefore =
        selectedBeforeDays === '당일'
          ? 0
          : selectedBeforeDays === '1일전'
            ? 1
            : selectedBeforeDays === '3일전'
              ? 3
              : selectedBeforeDays === '7일전'
                ? 7
                : 3;

      // NotificationService를 통한 알림 예약
      await notificationService.scheduleNotification(
        itemId,
        itemName,
        expiryDate,
        daysBefore,
        settings.notificationTime,
      );
    }

    console.log('Saving notification settings:', settings);

    // 알림 스케줄링 추가 (새로운 기능)
    if (itemId && settings.expiryDate.year) {
      try {
        const expiryDate = new Date(
          `${settings.expiryDate.year}-${settings.expiryDate.month.padStart(2, '0')}-${settings.expiryDate.day.padStart(2, '0')}`,
        );

        const daysBefore =
          selectedBeforeDays === '당일'
            ? 0
            : selectedBeforeDays === '1일전'
              ? 1
              : selectedBeforeDays === '3일전'
                ? 3
                : selectedBeforeDays === '7일전'
                  ? 7
                  : 3;

        await notificationService.scheduleNotification(
          itemId,
          itemName,
          expiryDate,
          daysBefore,
          settings.notificationTime,
        );

        console.log('알림 예약 완료');
      } catch (error) {
        console.error('알림 예약 실패:', error);
      }
    }

    // TODO: API 연동
    // await api.saveExpiryNotification(settings);

    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 알림 날짜 계산 (유통기한 - 선택한 일수)
  const getNotificationDate = (): string => {
    const year = useAutoSettings && itemData ? itemData.year : selectedYear;
    const month = useAutoSettings && itemData ? itemData.month : selectedMonth;
    const day = useAutoSettings && itemData ? itemData.day : selectedDay;

    if (!year || !month || !day) return '날짜를 선택해주세요';

    const expiryDate = new Date(
      `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
    );
    const notificationDate = new Date(expiryDate);

    switch (selectedBeforeDays) {
      case '1일전':
        notificationDate.setDate(expiryDate.getDate() - 1);
        break;
      case '3일전':
        notificationDate.setDate(expiryDate.getDate() - 3);
        break;
      case '7일전':
        notificationDate.setDate(expiryDate.getDate() - 7);
        break;
      default: // 당일
        break;
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return notificationDate.toLocaleDateString('ko-KR', options);
  };

  // 표시용 값 계산
  const displayYear =
    useAutoSettings && itemData ? itemData.year : selectedYear;
  const displayMonth =
    useAutoSettings && itemData ? itemData.month : selectedMonth;
  const displayDay = useAutoSettings && itemData ? itemData.day : selectedDay;
  const displayTime = useAutoSettings ? '09:00' : notificationTime;

  // 저장 버튼 활성화 조건
  const canSave = useAutoSettings || (hasDateSelected && hasTimeSelected);

  // ==========================================
  //                  렌더링
  // ==========================================

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
            >
              <XIcon size={20} />
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
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    useAutoSettings ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {useAutoSettings && (
              <div className="rounded-xl border border-gray-200 p-4 text-sm shadow-sm">
                <p className="text-xs text-[#121212]">
                  권장 유통기간으로 자동 설정하는 모드 입니다
                </p>
              </div>
            )}
          </div>

          {/* 직접 설정 모드 (자동 설정이 꺼져있을 때만 표시) */}
          {!useAutoSettings && (
            <>
              {/* 알림 타이밍 섹션 */}
              <div className="mb-6">
                <h3 className="text-md mb-3 flex items-center gap-2 font-medium">
                  알림 타이밍
                </h3>
                <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                  {ALERT_TIMING_OPTIONS.map((option: string) => (
                    <button
                      key={option}
                      onClick={() => setSelectedBeforeDays(option)}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        selectedBeforeDays === option
                          ? 'bg-white text-[#6B46C1] shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      } `}
                      aria-pressed={selectedBeforeDays === option}
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

          {/* 자동 설정 모드일 때 알림 타이밍만 선택 가능 */}
          {useAutoSettings && (
            <div className="mb-3">
              <h3 className="text-md mb-3 flex items-center gap-2 font-medium">
                <Bell size={18} className="text-[#6B46C1]" />
                알림 타이밍
              </h3>
              <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                {ALERT_TIMING_OPTIONS.map((option: string) => (
                  <button
                    key={option}
                    onClick={() => setSelectedBeforeDays(option)}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedBeforeDays === option
                        ? 'bg-white text-[#6B46C1] shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    } `}
                    aria-pressed={selectedBeforeDays === option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 알림 테스트 버튼 추가 - 여기에 삽입! */}
          <button
            onClick={() => notificationService.sendTestNotification()}
            className="mb-4 w-full rounded-xl bg-purple-100 py-2 text-sm text-purple-700 transition-colors hover:bg-purple-200"
            type="button"
          >
            🔔 알림 테스트
          </button>

          {/* 설정 요약 (항상 표시) */}
          <div className="mb-6 rounded-xl border border-gray-200 p-4 text-sm shadow-sm">
            <h4 className="text-md mb-3 font-semibold text-gray-700">
              식재료 권장 섭취기간 설정
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="pt-0.5">
                  <CalendarCheck color="#101828" strokeWidth={2} size={15} />
                </div>
                <div>
                  <span className="font-medium text-gray-900">유통기한:</span>
                  <br />
                  {displayYear && displayMonth && displayDay ? (
                    `${displayYear}년 ${parseInt(displayMonth)}월 ${parseInt(displayDay)}일`
                  ) : (
                    <span className="text-gray-400">미설정</span>
                  )}
                </div>
              </div>
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

          {/* 확인 버튼 */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full rounded-xl py-3 font-medium text-white shadow-sm transition-all duration-200 active:scale-[0.98] ${
              !canSave
                ? 'cursor-not-allowed bg-gray-400 shadow-sm'
                : 'bg-[#6B46C1] hover:bg-[#5a3aa0]'
            }`}
            aria-label="설정 저장"
          >
            알림 설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpiryDateSetting;
