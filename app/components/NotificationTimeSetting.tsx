// app/components/NotificationTimeSetting.tsx
// 알림 시간 설정 컴포넌트

import React, { useState, useEffect, useMemo } from 'react';
import {
  generateHours,
  generateMinutes,
  styles,
} from '@/app/components/constants/dateTimeConstants';

interface NotificationTimeSettingProps {
  notificationTime: string;
  onTimeChange: (time: string) => void;
}

const NotificationTimeSetting: React.FC<NotificationTimeSettingProps> = ({
  notificationTime,
  onTimeChange,
}) => {
  // ==========================================
  //             Memoized 값 생성
  // ==========================================

  // 배열은 한 번만 생성되도록 memoization
  const hours = useMemo(() => generateHours(), []);
  const minutes = useMemo(() => generateMinutes(), []);

  // ==========================================
  //                  상태 관리
  // ==========================================

  // ---------- 시간 선택 UI 상태 ----------
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState('08');
  const [selectedMinute, setSelectedMinute] = useState('00');

  // ==========================================
  //                Side Effects
  // ==========================================

  // ---------- 알림시간 초기화 ----------
  useEffect(() => {
    if (notificationTime) {
      const [hour, minute] = notificationTime.split(':');
      setSelectedHour(hour);
      setSelectedMinute(minute);
    }
  }, [notificationTime]);

  // ---------- 시간/분 변경 시 콜백 호출 ----------
  useEffect(() => {
    const newTime = `${selectedHour}:${selectedMinute}`;
    if (showTimePicker) {
      onTimeChange(newTime);
    }
  }, [selectedHour, selectedMinute, showTimePicker, onTimeChange]);

  // ==========================================
  //              이벤트 핸들러
  // ==========================================

  const toggleTimePicker = () => {
    setShowTimePicker(!showTimePicker);
  };

  // ==========================================
  //                  렌더링
  // ==========================================

  return (
    <div className="mb-8">
      <h3 className="text-md mb-3 border-t-1 border-gray-300 pt-3 text-start font-medium">
        알림 시간 설정
      </h3>
      <div className="flex justify-center">
        <button
          onClick={toggleTimePicker}
          className="cursor-pointer rounded-2xl border-2 border-[#6B46C1] px-1 py-1 text-sm shadow-sm transition-colors hover:border-[#603fad]"
          aria-label={`알림 시간 ${notificationTime} - 클릭하여 변경`}
          aria-expanded={showTimePicker}
          // 시간 선택 UI와 의미가 연결되고 있음을 명시
          aria-controls="time-picker-ui"
        >
          <h4 className="border-[#6B46C1] px-4 py-1 text-center text-[#6B46C1]">
            알림 시간: {notificationTime}
          </h4>
        </button>
      </div>

      {/* ---------- 시간 선택 토글 UI ---------- */}
      {showTimePicker && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 시간 선택 */}
            <div className={styles.scrollContainer}>
              <div className={styles.sectionHeader}>시간</div>
              {hours.map(hour => (
                <div
                  key={hour}
                  onClick={() => setSelectedHour(hour)}
                  className={styles.selectableItem(selectedHour === hour)}
                  role="option"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedHour(hour);
                    }
                  }}
                  aria-selected={selectedHour === hour}
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* 분 선택 */}
            <div className={styles.scrollContainer}>
              <div className={styles.sectionHeader}>분</div>
              {minutes.map(minute => (
                <div
                  key={minute}
                  onClick={() => setSelectedMinute(minute)}
                  className={styles.selectableItem(selectedMinute === minute)}
                  role="option"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedMinute(minute);
                    }
                  }}
                  aria-selected={selectedMinute === minute}
                >
                  {minute}
                </div>
              ))}
            </div>
          </div>

          {/* ---------- 시간 선택 완료 버튼 ---------- */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={toggleTimePicker}
              className="cursor-pointer rounded-xl bg-[#6B46C1] px-4 py-1 text-sm text-white shadow-sm transition-colors hover:bg-[#603fad]"
              aria-label="시간 선택 완료"
            >
              시간 선택 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTimeSetting;
