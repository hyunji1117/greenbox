import React, { useState } from 'react';
import { XIcon, Check } from 'lucide-react';
interface ExpiryDateSettingProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number | null;
  itemName: string;
}
const ExpiryDateSetting: React.FC<ExpiryDateSettingProps> = ({
  isOpen,
  onClose,
  itemId,
  itemName,
}) => {
  // Notification timing options
  const timingOptions = ['당일', '1일전', '3일전', '7일전', '30일전', '90일전'];
  // State for notification settings
  const [selectedTiming, setSelectedTiming] = useState('3일전');
  const [selectedMonth, setSelectedMonth] = useState('September');
  const [selectedDay, setSelectedDay] = useState('30');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [notificationTime, setNotificationTime] = useState('11:44');
  // Month options
  const months = [
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
  ];
  // Days options (1-31)
  const days = Array.from(
    {
      length: 31,
    },
    (_, i) => String(i + 1),
  );
  // Year options
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    {
      length: 5,
    },
    (_, i) => String(currentYear + i),
  );
  // Handle save notification settings
  const handleSave = () => {
    // Here you would save the notification settings for this item
    console.log('Saving notification settings for item:', itemId);
    console.log('Timing:', selectedTiming);
    console.log(
      'Expiry date:',
      `${selectedMonth} ${selectedDay}, ${selectedYear}`,
    );
    console.log('Notification time:', notificationTime);
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5">
      <div className="w-full max-w-md rounded-xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">{itemName} 알림 설정</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <XIcon size={20} />
          </button>
        </div>
        {/* Notification Timing */}
        <div className="mb-6">
          <h3 className="mb-3 text-center text-xl font-medium">알림 타이밍</h3>
          <div className="flex rounded-full bg-gray-100 p-1">
            {timingOptions.map(option => (
              <button
                key={option}
                onClick={() => setSelectedTiming(option)}
                className={`flex-1 rounded-full py-2 text-sm transition-colors ${selectedTiming === option ? 'bg-white font-medium text-black shadow-sm' : 'text-gray-500'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        {/* Expiration Date Setting */}
        <div className="mb-6">
          <h3 className="mb-3 text-center text-xl font-medium">
            유통기한 설정
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {/* Month Selector */}
            <div className="h-48 overflow-y-auto rounded-lg bg-gray-50">
              {months.map(month => (
                <div
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`cursor-pointer px-4 py-3 text-center text-2xl ${selectedMonth === month ? 'bg-gray-200 font-semibold' : 'text-gray-400'}`}
                >
                  {month}
                </div>
              ))}
            </div>
            {/* Day Selector */}
            <div className="h-48 overflow-y-auto rounded-lg bg-gray-50">
              {days.map(day => (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`cursor-pointer px-4 py-3 text-center text-2xl ${selectedDay === day ? 'bg-gray-200 font-semibold' : 'text-gray-400'}`}
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Year Selector */}
            <div className="h-48 overflow-y-auto rounded-lg bg-gray-50">
              {years.map(year => (
                <div
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`cursor-pointer px-4 py-3 text-center text-2xl ${selectedYear === year ? 'bg-gray-200 font-semibold' : 'text-gray-400'}`}
                >
                  {year}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Notification Time Setting */}
        <div className="mb-8">
          <h3 className="mb-3 text-center text-xl font-medium">
            알림 시간 설정
          </h3>
          <div className="flex justify-center">
            <div className="rounded-full border-2 border-[#9ACA3C] px-8 py-3">
              <h4 className="text-center text-2xl text-[#9ACA3C]">
                알림 시간: {notificationTime}
              </h4>
            </div>
          </div>
        </div>
        {/* OK Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSave}
            className="w-full rounded-full bg-[#9ACA3C] py-4 text-center text-xl font-bold text-white"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExpiryDateSetting;
