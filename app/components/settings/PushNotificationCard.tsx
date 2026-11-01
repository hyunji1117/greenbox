// app/components/settings/PushNotificationCard.tsx
// 유통기한 알림 켜기. 기기 상태에 따라 지금 할 수 있는 행동을 안내한다

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import {
  enablePush,
  getPushStatus,
  type PushStatus,
} from '@/app/lib/push/subscribe';

const STATUS_TEXT: Record<PushStatus, string> = {
  granted: '유통기한이 3일 안에 끝나는 품목을 매일 아침 알려 드려요',
  default: '앱을 닫아도 유통기한이 가까운 품목을 알려 드려요',
  denied: '알림이 꺼져 있어요. 기기 설정에서 이 앱의 알림을 허용해 주세요',
  unsupported:
    '이 브라우저에서는 쓸 수 없어요. iPhone은 Safari의 공유 메뉴에서 홈 화면에 추가한 앱으로 열어 주세요',
};

const PushNotificationCard: React.FC = () => {
  // 서버 렌더링에는 브라우저 값이 없어 화면이 열린 뒤에 읽는다
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setStatus(getPushStatus());
  }, []);

  const handleEnable = async () => {
    setIsEnabling(true);
    setHasError(false);
    try {
      setStatus(await enablePush());
    } catch (e) {
      console.error('푸시 구독 실패:', e);
      setHasError(true);
    } finally {
      setIsEnabling(false);
    }
  };

  if (!status) return null;

  return (
    <div className={`flex gap-3 p-4 ${SURFACE}`}>
      <Bell size={20} className="mt-0.5 shrink-0 text-[#6B46C1]" />
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-gray-800">유통기한 알림</h2>
        <p className="mt-1 text-sm text-gray-600">{STATUS_TEXT[status]}</p>
        {status === 'default' && (
          <button
            type="button"
            onClick={handleEnable}
            disabled={isEnabling}
            className="mt-3 h-11 rounded-xl bg-[#6B46C1] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#603fad] disabled:opacity-60"
          >
            {isEnabling ? '켜는 중...' : '알림 켜기'}
          </button>
        )}
        {hasError && (
          <p role="alert" className="mt-2 text-xs text-red-500">
            알림을 켜지 못했어요. 다시 시도해 주세요.
          </p>
        )}
      </div>
    </div>
  );
};

export default PushNotificationCard;
