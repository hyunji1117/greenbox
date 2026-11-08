// app/components/ShareInstallLink.tsx
// PWA 설치 링크 공유 컴포넌트

import { useState } from 'react';
import { track } from '@/app/lib/analytics/gtag';

export const ShareInstallLink = () => {
  const [copied, setCopied] = useState(false);
  const shareUrl = 'https://greenbox-seven.vercel.app/install';
  const shareText = '앱을 설치하고 우리집 냉장고를 관리해보세요!';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PWA 앱 설치',
          text: shareText,
          url: shareUrl,
        });
        track('install_link_shared', { method: 'share' });
      } catch (error) {
        console.log('공유 취소됨:', error);
      }
    } else {
      // 클립보드에 복사
      await navigator.clipboard.writeText(shareUrl);
      track('install_link_shared', { method: 'copy' });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={handleShare}>
      {copied ? '✅ 복사됨!' : '📤 설치 링크 공유하기'}
    </button>
  );
};
