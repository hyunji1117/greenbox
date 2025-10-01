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
      <h3 className="mb-3 text-center text-xl font-medium">알림 시간 설정</h3>
      <div className="flex justify-center">
        <button
          onClick={toggleTimePicker}
          className="cursor-pointer rounded-full border-2 border-[#9ACA3C] px-8 py-3 transition-colors hover:bg-gray-50"
          aria-label={`알림 시간 ${notificationTime} - 클릭하여 변경`}
          aria-expanded={showTimePicker}
        >
          <h4 className="text-center text-2xl text-[#9ACA3C]">
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
              className="rounded-full bg-[#9ACA3C] px-6 py-2 text-white transition-colors hover:bg-[#89BA2C]"
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
