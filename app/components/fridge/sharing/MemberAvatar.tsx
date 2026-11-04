// app/components/fridge/sharing/MemberAvatar.tsx
// 구성원 프로필 사진. 사진이 없으면 사람 아이콘

import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

const MemberAvatar: React.FC<{ image: string | null; size?: number }> = ({
  image,
  size = 40,
}) =>
  image ? (
    <Image
      src={image}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#F1EDFA] text-[#6B46C1]"
      style={{ width: size, height: size }}
    >
      <User size={size * 0.5} />
    </div>
  );

export default MemberAvatar;
