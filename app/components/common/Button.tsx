// app/components/common/Button.tsx
// 재사용 가능한 Button 컴포넌트

import React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: 'red' | 'blue' | 'green' | 'yellow' | 'white';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  leftIcon,
  rightIcon,
  badge,
  badgeColor = 'red',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'relative flex items-center text-base justify-center font-semibold rounded-full shadow-md';

  const variantClasses = {
    primary: 'bg-[#6B46C1] text-white hover:bg-[#603fad] focus:ring-[#6B46C1]',
    secondary:
      'size-12 bg-[#FBFBFF] border border-white text-gray-800 hover:bg-white focus:ring-gray-300',
    outline:
      'border border-gray-300 text-gray-800 hover:bg-gray-100 focus:ring-gray-300',
  };

  const sizeClasses = {
    small: 'h-11 text-sm gap-0',
    medium: 'h-12 text-base gap-0',
    large: 'h-12 text-lg gap-0',
  };


  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      className={` ${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || isLoading ? disabledClasses : ''} ${className} `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>처리 중...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}

      {/* {badge !== undefined && badge !== null && badge !== 0 && (
        <div
          className={`absolute -top-3 right-3 flex h-5 items-center justify-center rounded-full px-3 py-2.5 whitespace-nowrap ${badgeColors[badgeColor]} px-1 text-xs font-semibold shadow-2xl`}
        >
          {badge}
          체크 리스트 보기
        </div>
      )} */}
    </button>
  );
};

export default Button;
