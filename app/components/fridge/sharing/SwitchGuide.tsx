'use client';
// app/components/fridge/sharing/SwitchGuide.tsx
// 처음 초대받은 냉장고가 생겼을 때 한 번 보여 주는 안내
// 냉장고 이름만 밝게 비춰 "여기를 누르면 냉장고를 바꿀 수 있다"는 것을 알린다

import React from 'react';
import SpotlightGuide from '@/app/components/fridge/sharing/SpotlightGuide';

interface SwitchGuideProps {
  target: React.RefObject<HTMLElement | null>;
  onTryIt: () => void;
  onClose: () => void;
}

const SwitchGuide: React.FC<SwitchGuideProps> = ({
  target,
  onTryIt,
  onClose,
}) => (
  <SpotlightGuide
    target={target}
    title="함께 보는 냉장고가 생겼어요"
    body="위의 냉장고 이름을 누르면 내 냉장고와 초대받은 냉장고를 바꿔 가며 볼 수 있어요."
    primaryLabel="바꿔 보기"
    spotLabel="냉장고 바꾸기 열기"
    onPrimary={onTryIt}
    onClose={onClose}
  />
);

export default SwitchGuide;
