'use client';
// app/join/[code]/JoinDescription.tsx
// 참여 화면 제목 아래 설명. 참여 요청을 보내기 전에만 보이고, 보내면 기다리는 안내만 남게 사라진다

import React from 'react';
import { useIsMutating } from '@tanstack/react-query';
import {
  joinRequestKey,
  useMyJoinStatus,
} from '@/app/lib/fridges/useFridgeSharing';

interface JoinDescriptionProps {
  code: string;
  // 지금 요청을 보낼 수 있는 상태인지 (로그인과 동의가 끝난 뒤). 그때만 요청 여부를 확인한다
  canRequest: boolean;
}

const JoinDescription: React.FC<JoinDescriptionProps> = ({
  code,
  canRequest,
}) => {
  const status = useMyJoinStatus(code, canRequest).data?.status;
  const isSending = useIsMutating({ mutationKey: joinRequestKey(code) }) > 0;
  if (
    canRequest &&
    (isSending || status === 'pending' || status === 'member')
  ) {
    return null;
  }
  return <>참여를 요청하고 함께 냉장고를 관리해 보세요.</>;
};

export default JoinDescription;
