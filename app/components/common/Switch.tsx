// app/components/common/Switch.tsx
// 설정 화면의 켜고 끄는 스위치. 알림 설정, 베타 기능, 테스트 기기 표시가 같은 모양과 움직임을 쓴다
// 이름은 label(바로 읽힐 글자) 또는 labelledBy(화면에 보이는 제목의 id) 중 하나로 붙인다

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  labelledBy?: string;
  disabled?: boolean;
}

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  labelledBy,
  disabled = false,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    aria-labelledby={labelledBy}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
      checked ? 'bg-[#6B46C1]' : 'bg-gray-300'
    }`}
  >
    <span
      className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
        checked ? 'translate-x-5' : ''
      }`}
    />
  </button>
);

export default Switch;
