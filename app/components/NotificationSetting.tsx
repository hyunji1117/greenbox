import React, { useState } from 'react';
interface NotificationSettingProps {
  isOpen: boolean;
  onClose: () => void;
}
const NotificationSetting: React.FC<NotificationSettingProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedTiming, setSelectedTiming] = useState<string>('당일');
  const [selectedDate, setSelectedDate] = useState<{
    month: string;
    day: string;
    year: string;
  }>({
    month: 'September',
    day: '30',
    year: '2025',
  });
  const [notificationTime, setNotificationTime] = useState<string>('11:44');
  if (!isOpen) return null;
  const timingOptions = [
    '당일',
    '1일 전',
    '3일 전',
    '7일 전',
    '30일 전',
    '90일 전',
  ];
  const months = [
    {
      name: 'July',
      day: '28',
      year: '2023',
    },
    {
      name: 'August',
      day: '29',
      year: '2024',
    },
    {
      name: 'September',
      day: '30',
      year: '2025',
    },
    {
      name: 'October',
      day: '31',
      year: '2026',
    },
    {
      name: 'November',
      day: '1',
      year: '2027',
    },
  ];
  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-end justify-center bg-black">
      <div className="flex w-full max-w-md flex-col items-center rounded-t-[30px] bg-white p-6">
        {/* 드래그 핸들 */}
        <div className="mb-8 h-1 w-10 rounded-full bg-gray-300"></div>
        {/* 알림 타이밍 섹션 */}
        <h2 className="mb-4 text-xl font-medium">통지의 타이밍</h2>
        <div className="mb-10 flex w-full rounded-2xl bg-gray-100">
          {timingOptions.map(option => (
            <button
              key={option}
              className={`flex-1 py-3 text-sm ${selectedTiming === option ? 'rounded-2xl bg-white shadow-sm' : 'text-gray-500'}`}
              onClick={() => setSelectedTiming(option)}
            >
              {option}
            </button>
          ))}
        </div>
        {/* 유효기간 설정 섹션 */}
        <h2 className="mb-4 text-xl font-medium">유효기간을 설정</h2>
        <div className="mb-10 w-full">
          {months.map(month => (
            <div
              key={month.name}
              className={`flex justify-between px-4 py-2 ${selectedDate.month === month.name ? 'rounded-xl bg-gray-100' : ''}`}
              onClick={() =>
                setSelectedDate({
                  month: month.name,
                  day: month.day,
                  year: month.year,
                })
              }
            >
              <span
                className={`text-2xl ${selectedDate.month === month.name ? 'text-black' : 'text-gray-300'}`}
              >
                {month.name}
              </span>
              <div className="flex">
                <span
                  className={`text-2xl ${selectedDate.month === month.name ? 'text-black' : 'text-gray-300'}`}
                >
                  {month.day}
                </span>
                <span
                  className={`ml-8 text-2xl ${selectedDate.month === month.name ? 'text-black' : 'text-gray-300'}`}
                >
                  {month.year}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* 알림 시간 설정 섹션 */}
        <h2 className="mb-4 text-xl font-medium">통지시간을 설정</h2>
        <div className="mb-10 rounded-full border-2 border-green-500 px-8 py-2">
          <div className="flex items-center">
            <span className="text-gray-500">통지시간: </span>
            <span className="ml-1 font-medium text-green-500">
              {notificationTime}
            </span>
          </div>
        </div>
        {/* 확인 버튼 */}
        <button
          className="w-64 rounded-full bg-green-500 py-3 text-xl text-white"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
};
export default NotificationSetting;
