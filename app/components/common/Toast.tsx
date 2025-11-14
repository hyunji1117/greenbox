// app/components/common/Toast.tsx
// Toast 컴포넌트

import React from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="animate-fade-in fixed top-3 left-1/2 z-50 m-auto -translate-x-1/2 transform rounded-full border border-gray-300 bg-white px-4 py-3 text-base whitespace-nowrap text-black shadow-lg">
      {message}
    </div>
  );
};

export default Toast;
