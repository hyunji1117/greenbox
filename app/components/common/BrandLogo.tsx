// app/components/common/BrandLogo.tsx
// 앱 로고와 그 아래 한글 이름 "우리집 냉장고". 로고를 보이는 곳은 모두 이 조각을 써서 모양을 같게 둔다
// 영문 손글씨 로고만으로는 무슨 앱인지 알기 어려워 아래에 한글 손글씨 이름을 붙인다

import React from 'react';
import Image from 'next/image';
import { Nanum_Pen_Script } from 'next/font/google';

// 로고(손글씨 영문)와 어울리는 한글 손글씨. 쓰인 글자 조각만 받는다
const logoHand = Nanum_Pen_Script({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

interface BrandLogoProps {
  // 첫 화면처럼 바로 보이는 곳이면 로고 그림을 먼저 받는다
  priority?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ priority = false }) => (
  // 로고 그림 비율(3:2)에 맞춘 상자라 글자를 왼쪽에 맞추면 로고 왼쪽 끝과 줄이 맞는다
  <div className="flex flex-col items-start">
    <div className="relative h-16 w-24">
      <Image
        src="/greenbox_logo_5_black.png"
        alt="Greenbox 로고"
        fill
        className="object-contain"
        priority={priority}
      />
    </div>
    {/* 로고 그림 아래 빈 공간만큼 끌어올려 로고에 붙은 이름처럼 보이게 하고, */}
    {/* 시작점을 로고 그림의 "O" 왼쪽 끝에 맞추며, F 꼬리에 가리지 않게 글자를 그림 위에 그린다 */}
    <p
      className={`${logoHand.className} relative -mt-2 ml-px text-xl leading-none text-[#553C9A]`}
    >
      우리집 냉장고
    </p>
  </div>
);

export default BrandLogo;
